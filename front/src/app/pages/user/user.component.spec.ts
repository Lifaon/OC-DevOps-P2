import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { UserComponent } from './user.component';
import { UserService } from '../../core/service/user.service';
import { MOCK_USERS, UserMockService } from '../../core/service/user-mock.service';
import { UserFormComponent } from '../../shared/components/user-form/user-form.component';
import { UserCreate } from '../../core/models/UserCreate';
import { UserUpdate } from '../../core/models/UserUpdate';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let userService: UserService;
  let confirmSpy: jest.SpyInstance;

  const newUser: UserCreate = { firstName: 'Paul', lastName: 'Martin', login: 'pmartin', password: 'password' };
  const userUpdate: UserUpdate = { firstName: 'Johnny', lastName: 'Doe', login: 'jdoe', password: null };

  function httpError(status: number, error: unknown = null, statusText = 'Error'): HttpErrorResponse {
    return new HttpErrorResponse({ status, error, statusText });
  }

  function userForm(): UserFormComponent | null {
    return fixture.debugElement.query(By.directive(UserFormComponent))?.componentInstance ?? null;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        { provide: UserService, useClass: UserMockService },
      ]
    })
    .compileComponents();

    userService = TestBed.inject(UserService);
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('users list', () => {
    it('should load the users on init', () => {
      const readAllSpy = jest.spyOn(userService, 'readAll');

      fixture.detectChanges();

      expect(readAllSpy).toHaveBeenCalledTimes(1);
      expect(component.users).toEqual(MOCK_USERS);
    });

    it('should display a row per user', () => {
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(MOCK_USERS.length);
      expect(rows[0].textContent).toContain('John');
      expect(rows[0].textContent).toContain('Doe');
      expect(rows[0].textContent).toContain('jdoe');
      expect(rows[1].textContent).toContain('jsmith');
    });

    it('should display a message when there is no user', () => {
      jest.spyOn(userService, 'readAll').mockReturnValue(of([]));

      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('table')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('No users found.');
    });

    it('should display an error when the users cannot be loaded', () => {
      jest.spyOn(userService, 'readAll').mockReturnValue(throwError(() => httpError(401, null, 'Unauthorized')));

      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load users: Unauthorized');
      expect(fixture.nativeElement.querySelector('.alert-danger').textContent).toContain('Unable to load users: Unauthorized');
    });

    it('should close the error message', () => {
      component.errorMessage = 'Some error';
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.alert-danger button.close').click();
      fixture.detectChanges();

      expect(component.errorMessage).toBeNull();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    });
  });

  describe('form display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should hide the form by default', () => {
      expect(component.showForm).toBe(false);
      expect(userForm()).toBeNull();
    });

    it('should open an empty form when clicking Add User', () => {
      component.errorMessage = 'Some error';
      fixture.nativeElement.querySelector('.card-header button').click();
      fixture.detectChanges();

      expect(component.showForm).toBe(true);
      expect(component.editedUser).toBeNull();
      expect(component.errorMessage).toBeNull();
      expect(userForm()?.title).toBe('Create User');
      expect(userForm()?.submitLabel).toBe('Create');
      expect(userForm()?.user).toBeNull();
    });

    it('should open a prefilled form when clicking Edit', () => {
      const editButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('tbody tr')[1].querySelector('button.btn-primary');
      editButton.click();
      fixture.detectChanges();

      expect(component.showForm).toBe(true);
      expect(component.editedUser).toEqual(MOCK_USERS[1]);
      expect(userForm()?.title).toBe('Edit User');
      expect(userForm()?.submitLabel).toBe('Save');
      expect(userForm()?.user).toEqual(MOCK_USERS[1]);
    });

    it('should close the form when the form is cancelled', () => {
      component.onEdit(MOCK_USERS[0]);
      fixture.detectChanges();

      userForm()?.cancelled.emit();
      fixture.detectChanges();

      expect(component.showForm).toBe(false);
      expect(component.editedUser).toBeNull();
      expect(userForm()).toBeNull();
    });
  });

  describe('create', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onCreate();
      fixture.detectChanges();
    });

    it('should create the user, close the form and reload the users', () => {
      const createSpy = jest.spyOn(userService, 'create');
      const readAllSpy = jest.spyOn(userService, 'readAll');

      userForm()?.created.emit(newUser);

      expect(createSpy).toHaveBeenCalledWith(newUser);
      expect(component.showForm).toBe(false);
      expect(readAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should keep the form open and display the back-end reason on error', () => {
      jest.spyOn(userService, 'create').mockReturnValue(
        throwError(() => httpError(400, '400: Bad Request\nLogin not available', 'Bad Request'))
      );
      const readAllSpy = jest.spyOn(userService, 'readAll');

      component.createUser(newUser);

      expect(component.errorMessage).toBe('Unable to create user: Login not available');
      expect(component.showForm).toBe(true);
      expect(readAllSpy).not.toHaveBeenCalled();
    });

    it('should display a specific message when the server is unreachable', () => {
      jest.spyOn(userService, 'create').mockReturnValue(throwError(() => httpError(0)));

      component.createUser(newUser);

      expect(component.errorMessage).toBe('Unable to create user: server unreachable');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update the edited user, close the form and reload the users', () => {
      const updateSpy = jest.spyOn(userService, 'update');
      const readAllSpy = jest.spyOn(userService, 'readAll');
      component.onEdit(MOCK_USERS[0]);
      fixture.detectChanges();

      userForm()?.updated.emit(userUpdate);

      expect(updateSpy).toHaveBeenCalledWith(MOCK_USERS[0].id, userUpdate);
      expect(component.showForm).toBe(false);
      expect(component.editedUser).toBeNull();
      expect(readAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when no user is edited', () => {
      const updateSpy = jest.spyOn(userService, 'update');

      component.updateUser(userUpdate);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should use the status text when the error body is not a string', () => {
      jest.spyOn(userService, 'update').mockReturnValue(
        throwError(() => httpError(500, { message: 'boom' }, 'Internal Server Error'))
      );
      component.onEdit(MOCK_USERS[0]);

      component.updateUser(userUpdate);

      expect(component.errorMessage).toBe('Unable to update user: Internal Server Error');
      expect(component.showForm).toBe(true);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should ask for confirmation and do nothing when refused', () => {
      confirmSpy.mockReturnValue(false);
      const deleteSpy = jest.spyOn(userService, 'delete');

      component.onDelete(MOCK_USERS[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Delete user jdoe?');
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should delete the user and reload the users when confirmed', () => {
      const deleteSpy = jest.spyOn(userService, 'delete');
      const readAllSpy = jest.spyOn(userService, 'readAll');

      const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('tbody tr')[1].querySelector('button.btn-secondary');
      deleteButton.click();

      expect(deleteSpy).toHaveBeenCalledWith(MOCK_USERS[1].id);
      expect(readAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should close the form when deleting the edited user', () => {
      component.onEdit(MOCK_USERS[0]);

      component.onDelete(MOCK_USERS[0]);

      expect(component.showForm).toBe(false);
      expect(component.editedUser).toBeNull();
    });

    it('should keep the form open when deleting another user', () => {
      component.onEdit(MOCK_USERS[0]);

      component.onDelete(MOCK_USERS[1]);

      expect(component.showForm).toBe(true);
      expect(component.editedUser).toEqual(MOCK_USERS[0]);
    });

    it('should display the back-end reason on error', () => {
      jest.spyOn(userService, 'delete').mockReturnValue(
        throwError(() => httpError(404, '404: Not Found\nNo user found with given ID', 'Not Found'))
      );

      component.onDelete(MOCK_USERS[0]);

      expect(component.errorMessage).toBe('Unable to delete user: No user found with given ID');
    });
  });
});
