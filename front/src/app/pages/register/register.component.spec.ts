import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RegisterComponent } from './register.component';
import { UserService } from '../../core/service/user.service';
import { UserMockService } from '../../core/service/user-mock.service';
import { UserFormComponent } from '../../shared/components/user-form/user-form.component';
import { UserCreate } from '../../core/models/UserCreate';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let userService: UserService;
  let alertSpy: jest.SpyInstance;

  const newUser: UserCreate = { firstName: 'John', lastName: 'Doe', login: 'jdoe', password: 'password' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: UserService, useClass: UserMockService },
      ]
    })
    .compileComponents();

    userService = TestBed.inject(UserService);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the user form configured for registration', () => {
    const userForm: UserFormComponent = fixture.debugElement.query(By.directive(UserFormComponent)).componentInstance;

    expect(userForm.title).toBe('Registration Form');
    expect(userForm.submitLabel).toBe('Register');
    expect(userForm.user).toBeNull();
  });

  it('should register the user and alert on success', () => {
    const registerSpy = jest.spyOn(userService, 'register');

    component.onRegister(newUser);

    expect(registerSpy).toHaveBeenCalledWith(newUser);
    expect(alertSpy).toHaveBeenCalledWith('SUCCESS!! :-)');
  });

  it('should register the user emitted by the form', () => {
    const registerSpy = jest.spyOn(userService, 'register');
    const userForm: UserFormComponent = fixture.debugElement.query(By.directive(UserFormComponent)).componentInstance;

    userForm.created.emit(newUser);

    expect(registerSpy).toHaveBeenCalledWith(newUser);
  });
});
