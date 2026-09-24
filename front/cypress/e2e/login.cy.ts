import { newUser } from '../support/users';

describe('Login', () => {
  const user = newUser('login');

  before(() => {
    cy.registerByApi(user);
  });

  beforeEach(() => {
    cy.intercept('POST', '/api/login').as('login');
    cy.on('window:alert', cy.stub().as('alert'));
    cy.visit('/login');
  });

  it('should display the required errors and send nothing when the form is empty', () => {
    cy.contains('button', 'Login').click();

    cy.contains('Login is required');
    cy.contains('password is required');
    cy.get('@login.all').should('have.length', 0);
  });

  it('should log in and store the JWT in a secured cookie', () => {
    cy.get('input[formcontrolname="login"]').type(user.login);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.contains('button', 'Login').click();

    cy.wait('@login').its('response.statusCode').should('equal', 200);
    cy.get('@alert').should('have.been.calledWith', 'SUCCESS!! :-)');
    cy.getCookie('authToken').should('exist').then(cookie => {
      expect(cookie?.httpOnly).to.equal(true);
      expect(cookie?.sameSite).to.equal('strict');
    });
  });

  it('should refuse a wrong password', () => {
    cy.get('input[formcontrolname="login"]').type(user.login);
    cy.get('input[formcontrolname="password"]').type('wrong-password');
    cy.contains('button', 'Login').click();

    cy.wait('@login').its('response.statusCode').should('equal', 401);
    cy.get('@alert').should('not.have.been.called');
    cy.getCookie('authToken').should('not.exist');
  });

  it('should refuse an unknown user', () => {
    cy.get('input[formcontrolname="login"]').type(newUser('unknown').login);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.contains('button', 'Login').click();

    cy.wait('@login').its('response.statusCode').should('equal', 401);
    cy.getCookie('authToken').should('not.exist');
  });
});
