import { newUser } from '../support/users';

describe('Registration', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/register').as('register');
    cy.on('window:alert', cy.stub().as('alert'));
    cy.visit('/register');
  });

  it('should display the registration form', () => {
    cy.contains('.card-header', 'Registration Form');
    cy.get('input[formcontrolname="firstName"]').should('be.visible');
    cy.get('input[formcontrolname="lastName"]').should('be.visible');
    cy.get('input[formcontrolname="login"]').should('be.visible');
    cy.get('input[formcontrolname="password"]').should('be.visible');
    cy.contains('button', 'Register').should('be.visible');
  });

  it('should display the required errors and send nothing when the form is empty', () => {
    cy.contains('button', 'Register').click();

    cy.contains('First Name is required');
    cy.contains('Last Name is required');
    cy.contains('Login is required');
    cy.contains('password is required');
    cy.get('input.is-invalid').should('have.length', 4);
    cy.get('@register.all').should('have.length', 0);
  });

  it('should register a new user who can then log in', () => {
    const user = newUser('register');

    cy.fillUserForm(user);
    cy.contains('button', 'Register').click();

    cy.wait('@register').then(({ request, response }) => {
      expect(request.body).to.deep.equal(user);
      expect(response?.statusCode).to.equal(201);
    });
    cy.get('@alert').should('have.been.calledWith', 'SUCCESS!! :-)');
    cy.loginByApi(user.login, user.password).its('status').should('equal', 200);
  });

  it('should refuse a login that is already taken', () => {
    const user = newUser('taken');
    cy.registerByApi(user);

    cy.fillUserForm(user);
    cy.contains('button', 'Register').click();

    cy.wait('@register').its('response.statusCode').should('equal', 400);
    cy.get('@alert').should('not.have.been.called');
  });

  it('should clear the form when clicking Cancel', () => {
    cy.contains('button', 'Register').click();
    cy.contains('Login is required');

    cy.contains('button', 'Cancel').click();

    cy.get('.invalid-feedback').should('not.exist');
    cy.get('input[formcontrolname="login"]').should('have.value', '');
  });
});
