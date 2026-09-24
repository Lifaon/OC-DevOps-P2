import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserComponent } from '../pages/user/user.component';
import { UserResponse } from '../core/models/UserResponse';
import { clickButton, inputValue, submitForm, tableRows, typeIn } from './integration-helpers';

describe('User management (integration)', () => {
  const READ_ALL_URL = '/api/user/read/';

  let fixture: ComponentFixture<UserComponent>;
  let httpMock: HttpTestingController;
  let confirmSpy: jest.SpyInstance;

  const john: UserResponse = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    login: 'jdoe',
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00'
  };
  const jane: UserResponse = {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    login: 'jsmith',
    createdAt: '2026-02-01T10:00:00',
    updatedAt: '2026-02-01T10:00:00'
  };

  function answerReadAll(users: UserResponse[]): void {
    const req = httpMock.expectOne(READ_ALL_URL);
    expect(req.request.method).toBe('GET');
    req.flush(users);
    fixture.detectChanges();
  }

  function errorMessage(): string | null {
    return fixture.nativeElement.querySelector('.alert-danger')?.textContent ?? null;
  }

  function formTitle(): string | null {
    return fixture.nativeElement.querySelector('app-user-form .card-header')?.textContent ?? null;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    fixture = TestBed.createComponent(UserComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  describe('loading', () => {
    it('should display the users returned by the back-end', () => {
      answerReadAll([john, jane]);

      const rows = tableRows(fixture);
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('John');
      expect(rows[0].textContent).toContain('jdoe');
      expect(rows[1].textContent).toContain('Jane');
      expect(rows[1].textContent).toContain('jsmith');
    });

    it('should display a message when the back-end returns no user', () => {
      answerReadAll([]);

      expect(tableRows(fixture).length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('No users found.');
    });

    it('should display an error when the server is unreachable', () => {
      httpMock.expectOne(READ_ALL_URL).error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(errorMessage()).toContain('Unable to load users: server unreachable');
    });

    it('should display the back-end reason and let the user dismiss it', () => {
      httpMock.expectOne(READ_ALL_URL)
        .flush('401: Unauthorized\nFull authentication is required', { status: 401, statusText: 'Unauthorized' });
      fixture.detectChanges();

      expect(errorMessage()).toContain('Unable to load users: Full authentication is required');

      fixture.nativeElement.querySelector('.alert-danger button.close').click();
      fixture.detectChanges();

      expect(errorMessage()).toBeNull();
    });
  });

  describe('create', () => {
    beforeEach(() => {
      answerReadAll([john]);
      clickButton(fixture, 'Add User');
    });

    it('should open an empty creation form', () => {
      expect(formTitle()).toContain('Create User');
      expect(inputValue(fixture, 'firstName')).toBe('');
      expect(inputValue(fixture, 'login')).toBe('');
    });

    it('should create the user, close the form and refresh the list', () => {
      typeIn(fixture, 'firstName', 'Jane');
      typeIn(fixture, 'lastName', 'Smith');
      typeIn(fixture, 'login', 'jsmith');
      typeIn(fixture, 'password', 'password');
      submitForm(fixture);

      const req = httpMock.expectOne('/api/user/create');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        login: 'jsmith',
        password: 'password'
      });
      req.flush(jane);
      fixture.detectChanges();

      answerReadAll([john, jane]);

      expect(formTitle()).toBeNull();
      expect(tableRows(fixture).length).toBe(2);
      expect(tableRows(fixture)[1].textContent).toContain('jsmith');
    });

    it('should not send any request when the form is incomplete', () => {
      typeIn(fixture, 'firstName', 'Jane');
      submitForm(fixture);

      httpMock.expectNone('/api/user/create');
      expect(fixture.nativeElement.textContent).toContain('password is required');
    });

    it('should keep the form open and display the reason when the login is taken', () => {
      typeIn(fixture, 'firstName', 'John');
      typeIn(fixture, 'lastName', 'Doe');
      typeIn(fixture, 'login', 'jdoe');
      typeIn(fixture, 'password', 'password');
      submitForm(fixture);

      httpMock.expectOne('/api/user/create')
        .flush('400: Bad Request\nLogin not available', { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      httpMock.expectNone(READ_ALL_URL);
      expect(errorMessage()).toContain('Unable to create user: Login not available');
      expect(formTitle()).toContain('Create User');
    });

    it('should close the form without request when clicking Cancel', () => {
      clickButton(fixture, 'Cancel');

      expect(formTitle()).toBeNull();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      answerReadAll([john, jane]);
      clickButton(fixture, 'Edit', tableRows(fixture)[0]);
    });

    it('should open a form prefilled with the user values', () => {
      expect(formTitle()).toContain('Edit User');
      expect(inputValue(fixture, 'firstName')).toBe('John');
      expect(inputValue(fixture, 'lastName')).toBe('Doe');
      expect(inputValue(fixture, 'login')).toBe('jdoe');
      expect(inputValue(fixture, 'password')).toBe('');
    });

    it('should update the user without changing the password, then refresh the list', () => {
      expect(fixture.nativeElement.querySelector('app-user-form button.btn-primary').textContent).toContain('Save');
      typeIn(fixture, 'firstName', 'Johnny');
      submitForm(fixture);

      const req = httpMock.expectOne('/api/user/update/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        firstName: 'Johnny',
        lastName: 'Doe',
        login: 'jdoe',
        password: null
      });
      req.flush({ ...john, firstName: 'Johnny' });
      fixture.detectChanges();

      answerReadAll([{ ...john, firstName: 'Johnny' }, jane]);

      expect(formTitle()).toBeNull();
      expect(tableRows(fixture)[0].textContent).toContain('Johnny');
    });

    it('should send the new password when filled', () => {
      typeIn(fixture, 'password', 'new-password');
      submitForm(fixture);

      const req = httpMock.expectOne('/api/user/update/1');
      expect(req.request.body.password).toBe('new-password');
      req.flush(john);
      answerReadAll([john, jane]);
    });

    it('should switch to the other user when clicking its Edit button', () => {
      clickButton(fixture, 'Edit', tableRows(fixture)[1]);

      expect(inputValue(fixture, 'firstName')).toBe('Jane');
      expect(inputValue(fixture, 'login')).toBe('jsmith');
    });

    it('should keep the form open and display the reason on error', () => {
      typeIn(fixture, 'login', 'jsmith');
      submitForm(fixture);

      httpMock.expectOne('/api/user/update/1')
        .flush('400: Bad Request\nLogin not available', { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      httpMock.expectNone(READ_ALL_URL);
      expect(errorMessage()).toContain('Unable to update user: Login not available');
      expect(formTitle()).toContain('Edit User');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      answerReadAll([john, jane]);
    });

    it('should delete the user after confirmation and refresh the list', () => {
      clickButton(fixture, 'Delete', tableRows(fixture)[1]);

      expect(confirmSpy).toHaveBeenCalledWith('Delete user jsmith?');
      const req = httpMock.expectOne('/api/user/delete/2');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      answerReadAll([john]);

      expect(tableRows(fixture).length).toBe(1);
      expect(fixture.nativeElement.textContent).not.toContain('jsmith');
    });

    it('should not send any request when the deletion is refused', () => {
      confirmSpy.mockReturnValue(false);

      clickButton(fixture, 'Delete', tableRows(fixture)[1]);

      httpMock.expectNone('/api/user/delete/2');
      expect(tableRows(fixture).length).toBe(2);
    });

    it('should close the form when deleting the edited user', () => {
      clickButton(fixture, 'Edit', tableRows(fixture)[0]);
      expect(formTitle()).toContain('Edit User');

      clickButton(fixture, 'Delete', tableRows(fixture)[0]);
      httpMock.expectOne('/api/user/delete/1').flush(null, { status: 204, statusText: 'No Content' });
      answerReadAll([jane]);

      expect(formTitle()).toBeNull();
    });

    it('should display the reason on error', () => {
      clickButton(fixture, 'Delete', tableRows(fixture)[0]);

      httpMock.expectOne('/api/user/delete/1')
        .flush('404: Not Found\nNo user found with given ID', { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      httpMock.expectNone(READ_ALL_URL);
      expect(errorMessage()).toContain('Unable to delete user: No user found with given ID');
    });
  });
});
