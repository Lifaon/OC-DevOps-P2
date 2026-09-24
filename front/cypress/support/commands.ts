/// <reference types="cypress" />
import { E2E_PREFIX, E2eUser, newUser } from './users';

declare global {
  namespace Cypress {
    interface Chainable {
      registerByApi(user: E2eUser): Chainable<Response<unknown>>;
      loginByApi(login: string, password: string, failOnStatusCode?: boolean): Chainable<Response<unknown>>;
      fillUserForm(user: Partial<E2eUser>): Chainable<void>;
      deleteE2eUsers(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('registerByApi', (user: E2eUser) => {
  return cy.request('POST', '/api/register', user);
});

// The back-end answers with the JWT cookie, which Cypress keeps for the next requests
Cypress.Commands.add('loginByApi', (login: string, password: string, failOnStatusCode = true) => {
  return cy.request({
    method: 'POST',
    url: '/api/login',
    body: { login, password },
    failOnStatusCode
  });
});

// Fills the fields of the displayed form; an empty string clears the field
Cypress.Commands.add('fillUserForm', (user: Partial<E2eUser>) => {
  Object.entries(user).forEach(([field, value]) => {
    cy.get(`input[formcontrolname="${field}"]`).clear();
    if (value) {
      cy.get(`input[formcontrolname="${field}"]`).type(value);
    }
  });
});

// Deletes every user created by the e2e tests, using a dedicated user to authenticate
Cypress.Commands.add('deleteE2eUsers', () => {
  const cleaner = newUser('cleaner');
  cy.registerByApi(cleaner);
  cy.loginByApi(cleaner.login, cleaner.password);
  cy.request<{ id: number, login: string }[]>('/api/user/read/').then(response => {
    response.body
      .filter(user => user.login.startsWith(E2E_PREFIX))
      .forEach(user => cy.request('DELETE', `/api/user/delete/${user.id}`));
  });
  cy.clearCookies();
});
