import { E2eUser, newUser } from '../support/users';

describe('User management', () => {
  function row(login: string) {
    return cy.contains('tbody tr', login);
  }

  beforeEach(() => {
    cy.intercept('GET', '/api/user/read/').as('readAll');
    cy.intercept('POST', '/api/user/create').as('create');
    cy.intercept('PUT', '/api/user/update/*').as('update');
    cy.intercept('DELETE', '/api/user/delete/*').as('delete');
  });

  describe('without authentication', () => {
    it('should display an error instead of the users', () => {
      cy.visit('/users');

      cy.wait('@readAll').its('response.statusCode').should('equal', 401);
      cy.get('.alert-danger').should('contain', 'Unable to load users');
      cy.contains('No users found.');
    });
  });

  describe('with authentication', () => {
    let me: E2eUser;
    let other: E2eUser;

    beforeEach(() => {
      me = newUser('me');
      other = newUser('other');
      cy.registerByApi(me);
      cy.registerByApi(other);
      cy.loginByApi(me.login, me.password);

      cy.visit('/users');
      cy.wait('@readAll').its('response.statusCode').should('equal', 200);
    });

    it('should list the users', () => {
      row(me.login).should('contain', me.firstName).and('contain', me.lastName);
      row(other.login).should('be.visible');
      cy.get('.alert-danger').should('not.exist');
      cy.get('app-user-form').should('not.exist');
    });

    describe('create', () => {
      beforeEach(() => {
        cy.contains('button', 'Add User').click();
      });

      it('should create a user and display it in the list', () => {
        const created = newUser('created');
        cy.contains('app-user-form .card-header', 'Create User');

        cy.fillUserForm({ ...created, firstName: 'Paul', lastName: 'Martin' });
        cy.contains('app-user-form button', 'Create').click();

        cy.wait('@create').its('response.statusCode').should('equal', 200);
        cy.wait('@readAll');
        cy.get('app-user-form').should('not.exist');
        row(created.login).should('contain', 'Paul').and('contain', 'Martin');
        cy.loginByApi(created.login, created.password).its('status').should('equal', 200);
      });

      it('should display the required errors and send nothing when the form is empty', () => {
        cy.contains('app-user-form button', 'Create').click();

        cy.contains('First Name is required');
        cy.contains('password is required');
        cy.get('@create.all').should('have.length', 0);
      });

      it('should keep the form open and display an error when the login is taken', () => {
        cy.fillUserForm(other);
        cy.contains('app-user-form button', 'Create').click();

        cy.wait('@create').its('response.statusCode').should('equal', 400);
        cy.get('.alert-danger').should('contain', 'Unable to create user');
        cy.get('app-user-form').should('exist');

        cy.get('.alert-danger button.close').click();
        cy.get('.alert-danger').should('not.exist');
      });

      it('should close the form when clicking Cancel', () => {
        cy.contains('app-user-form button', 'Cancel').click();

        cy.get('app-user-form').should('not.exist');
        cy.get('@create.all').should('have.length', 0);
      });
    });

    describe('update', () => {
      beforeEach(() => {
        row(other.login).contains('button', 'Edit').click();
      });

      it('should open a form prefilled with the user values', () => {
        cy.contains('app-user-form .card-header', 'Edit User');
        cy.get('input[formcontrolname="firstName"]').should('have.value', other.firstName);
        cy.get('input[formcontrolname="lastName"]').should('have.value', other.lastName);
        cy.get('input[formcontrolname="login"]').should('have.value', other.login);
        cy.get('input[formcontrolname="password"]').should('have.value', '');
        cy.contains('leave empty to keep current');
      });

      it('should update the user and keep the current password when left empty', () => {
        cy.fillUserForm({ firstName: 'Edited', lastName: 'Name' });
        cy.contains('app-user-form button', 'Save').click();

        cy.wait('@update').then(({ request, response }) => {
          expect(request.body.password).to.equal(null);
          expect(response?.statusCode).to.equal(200);
        });
        cy.wait('@readAll');
        cy.get('app-user-form').should('not.exist');
        row(other.login).should('contain', 'Edited').and('contain', 'Name');
        cy.loginByApi(other.login, other.password).its('status').should('equal', 200);
      });

      it('should change the password', () => {
        cy.fillUserForm({ password: 'new-password' });
        cy.contains('app-user-form button', 'Save').click();

        cy.wait('@update').its('response.statusCode').should('equal', 200);
        cy.loginByApi(other.login, other.password, false).its('status').should('equal', 401);
        cy.loginByApi(other.login, 'new-password').its('status').should('equal', 200);
      });

      it('should keep the form open and display an error when the login is taken', () => {
        cy.fillUserForm({ login: me.login });
        cy.contains('app-user-form button', 'Save').click();

        cy.wait('@update').its('response.statusCode').should('equal', 400);
        cy.get('.alert-danger').should('contain', 'Unable to update user');
        cy.get('app-user-form').should('exist');
      });

      it('should close the form without saving when clicking Cancel', () => {
        cy.fillUserForm({ firstName: 'Discarded' });
        cy.contains('app-user-form button', 'Cancel').click();

        cy.get('app-user-form').should('not.exist');
        cy.get('@update.all').should('have.length', 0);
        row(other.login).should('not.contain', 'Discarded');
      });
    });

    describe('delete', () => {
      it('should delete the user after confirmation', () => {
        const confirm = cy.stub().as('confirm').returns(true);
        cy.on('window:confirm', confirm);

        row(other.login).contains('button', 'Delete').click();

        cy.get('@confirm').should('have.been.calledWith', `Delete user ${other.login}?`);
        cy.wait('@delete').its('response.statusCode').should('equal', 204);
        cy.wait('@readAll');
        cy.contains('tbody tr', other.login).should('not.exist');
        cy.loginByApi(other.login, other.password, false).its('status').should('equal', 401);
      });

      it('should keep the user when the deletion is refused', () => {
        cy.on('window:confirm', () => false);

        row(other.login).contains('button', 'Delete').click();

        cy.get('@delete.all').should('have.length', 0);
        row(other.login).should('be.visible');
      });

      it('should close the form when deleting the edited user', () => {
        row(other.login).contains('button', 'Edit').click();
        cy.get('app-user-form').should('exist');

        row(other.login).contains('button', 'Delete').click();

        cy.wait('@delete');
        cy.get('app-user-form').should('not.exist');
      });
    });
  });
});
