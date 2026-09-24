import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFormComponent } from './user-form.component';
import { UserResponse } from '../../../core/models/UserResponse';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  const user: UserResponse = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    login: 'jdoe',
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-02T10:00:00'
  };

  function typeIn(controlName: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fillForm(firstName: string, lastName: string, login: string, password: string): void {
    typeIn('firstName', firstName);
    typeIn('lastName', lastName);
    typeIn('login', login);
    typeIn('password', password);
  }

  function submit(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function editUser(value: UserResponse | null): void {
    fixture.componentRef.setInput('user', value);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title and the submit label', () => {
    fixture.componentRef.setInput('title', 'Registration Form');
    fixture.componentRef.setInput('submitLabel', 'Register');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.card-header').textContent).toContain('Registration Form');
    expect(fixture.nativeElement.querySelector('button.btn-primary').textContent).toContain('Register');
  });

  describe('create mode', () => {
    it('should be invalid when empty', () => {
      expect(component.userForm.invalid).toBe(true);
    });

    it('should require all the fields', () => {
      expect(component.form['firstName'].hasError('required')).toBe(true);
      expect(component.form['lastName'].hasError('required')).toBe(true);
      expect(component.form['login'].hasError('required')).toBe(true);
      expect(component.form['password'].hasError('required')).toBe(true);
    });

    it('should not display errors before submit', () => {
      expect(fixture.nativeElement.querySelectorAll('.invalid-feedback').length).toBe(0);
    });

    it('should display errors and not emit when submitting an invalid form', () => {
      const created = jest.spyOn(component.created, 'emit');

      submit();

      expect(component.submitted).toBe(true);
      expect(created).not.toHaveBeenCalled();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('First Name is required');
      expect(text).toContain('Last Name is required');
      expect(text).toContain('Login is required');
      expect(text).toContain('password is required');
      expect(fixture.nativeElement.querySelectorAll('input.is-invalid').length).toBe(4);
    });

    it('should emit the new user when submitting a valid form', () => {
      const created = jest.spyOn(component.created, 'emit');
      const updated = jest.spyOn(component.updated, 'emit');

      fillForm('John', 'Doe', 'jdoe', 'password');
      submit();

      expect(created).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        login: 'jdoe',
        password: 'password'
      });
      expect(updated).not.toHaveBeenCalled();
    });

    it('should not show the optional password hint', () => {
      expect(fixture.nativeElement.textContent).not.toContain('leave empty to keep current');
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      editUser(user);
    });

    it('should prefill the form with the user values', () => {
      expect(component.userForm.value).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        login: 'jdoe',
        password: null
      });
    });

    it('should make the password optional', () => {
      expect(component.form['password'].hasError('required')).toBe(false);
      expect(component.userForm.valid).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('leave empty to keep current');
    });

    it('should emit a null password when the password is left empty', () => {
      const updated = jest.spyOn(component.updated, 'emit');
      const created = jest.spyOn(component.created, 'emit');

      typeIn('firstName', 'Johnny');
      submit();

      expect(updated).toHaveBeenCalledWith({
        firstName: 'Johnny',
        lastName: 'Doe',
        login: 'jdoe',
        password: null
      });
      expect(created).not.toHaveBeenCalled();
    });

    it('should emit the new password when filled', () => {
      const updated = jest.spyOn(component.updated, 'emit');

      typeIn('password', 'new-password');
      submit();

      expect(updated).toHaveBeenCalledWith(expect.objectContaining({ password: 'new-password' }));
    });

    it('should not emit when a required field is cleared', () => {
      const updated = jest.spyOn(component.updated, 'emit');

      typeIn('login', '');
      submit();

      expect(updated).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Login is required');
    });

    it('should require the password again when switching back to create mode', () => {
      editUser(null);

      expect(component.userForm.value).toEqual({
        firstName: null,
        lastName: null,
        login: null,
        password: null
      });
      expect(component.form['password'].hasError('required')).toBe(true);
    });

    it('should reset the submitted state when the user changes', () => {
      typeIn('login', '');
      submit();
      expect(component.submitted).toBe(true);

      editUser({ ...user, id: 2, login: 'other' });

      expect(component.submitted).toBe(false);
      expect(component.form['login'].value).toBe('other');
    });
  });

  it('should reset the form and emit cancelled when clicking Cancel', () => {
    const cancelled = jest.spyOn(component.cancelled, 'emit');
    fillForm('John', 'Doe', 'jdoe', 'password');
    submit();

    fixture.nativeElement.querySelector('button[type="reset"]').click();
    fixture.detectChanges();

    expect(cancelled).toHaveBeenCalled();
    expect(component.submitted).toBe(false);
    expect(component.userForm.value).toEqual({
      firstName: null,
      lastName: null,
      login: null,
      password: null
    });
  });
});
