/// <reference types="jest" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { UserService } from '../../core/service/user.service';
import { UserMockService } from '../../core/service/user-mock.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: UserService;
  let alertSpy: jest.SpyInstance;

  function typeIn(controlName: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: UserService, useClass: UserMockService },
      ]
    })
    .compileComponents();

    userService = TestBed.inject(UserService);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize an empty invalid form', () => {
    expect(component.loginForm.value).toEqual({ login: '', password: '' });
    expect(component.loginForm.invalid).toBe(true);
    expect(component.submitted).toBe(false);
  });

  it('should not call the service and display errors when the form is invalid', () => {
    const loginSpy = jest.spyOn(userService, 'login');

    submit();

    expect(component.submitted).toBe(true);
    expect(loginSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Login is required');
    expect(fixture.nativeElement.textContent).toContain('password is required');
  });

  it('should only display the error of the missing field', () => {
    typeIn('login', 'jdoe');
    submit();

    expect(fixture.nativeElement.textContent).not.toContain('Login is required');
    expect(fixture.nativeElement.textContent).toContain('password is required');
  });

  it('should call the service with the credentials and alert on success', () => {
    const loginSpy = jest.spyOn(userService, 'login');

    typeIn('login', 'jdoe');
    typeIn('password', 'password');
    submit();

    expect(loginSpy).toHaveBeenCalledWith({ login: 'jdoe', password: 'password' });
    expect(alertSpy).toHaveBeenCalledWith('SUCCESS!! :-)');
  });

  it('should reset the form when clicking Cancel', () => {
    typeIn('login', 'jdoe');
    submit();

    fixture.nativeElement.querySelector('button[type="reset"]').click();
    fixture.detectChanges();

    expect(component.submitted).toBe(false);
    expect(component.loginForm.value).toEqual({ login: null, password: null });
    expect(fixture.nativeElement.querySelectorAll('.invalid-feedback').length).toBe(0);
  });
});
