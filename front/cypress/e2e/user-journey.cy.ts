import { newUser } from '../support/users';

// Complete journey through the UI only: register, log in, then manage the users
describe('User journey', () => {
  it('should register, log in and manage the users', () => {
    const user = newUser('journey');
    const colleague = newUser('colleague');
    cy.on('window:alert', cy.stub().as('alert'));
    cy.intercept('GET', '/api/user/read/').as('readAll');

    // Register
    cy.visit('/register');
    cy.fillUserForm(user);
    cy.contains('button', 'Register').click();
    cy.get('@alert').should('have.been.calledWith', 'SUCCESS!! :-)');

    // Log in
    cy.visit('/login');
    cy.get('input[formcontrolname="login"]').type(user.login);
    cy.get('input[formcontrolname="password"]').type(user.password);
    cy.contains('button', 'Login').click();
    cy.get('@alert').should('have.been.calledTwice');
    cy.getCookie('authToken').should('exist');

    // The users page now shows the registered user
    cy.visit('/users');
    cy.wait('@readAll');
    cy.contains('tbody tr', user.login);

    // Create a colleague
    cy.contains('button', 'Add User').click();
    cy.fillUserForm(colleague);
    cy.contains('app-user-form button', 'Create').click();
    cy.contains('tbody tr', colleague.login).should('contain', colleague.firstName);

    // Rename the colleague
    cy.contains('tbody tr', colleague.login).contains('button', 'Edit').click();
    cy.fillUserForm({ firstName: 'Renamed' });
    cy.contains('app-user-form button', 'Save').click();
    cy.contains('tbody tr', colleague.login).should('contain', 'Renamed');

    // Delete the colleague (confirm() is accepted by default by Cypress)
    cy.contains('tbody tr', colleague.login).contains('button', 'Delete').click();
    cy.contains('tbody tr', colleague.login).should('not.exist');
    cy.contains('tbody tr', user.login).should('be.visible');
  });
});
