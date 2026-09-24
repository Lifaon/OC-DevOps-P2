import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { config } from 'rxjs';

import { RegisterComponent } from '../pages/register/register.component';
import { submitForm, typeIn } from './integration-helpers';

describe('Register (integration)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let alertSpy: jest.SpyInstance;

  function fillForm(): void {
    typeIn(fixture, 'firstName', 'John');
    typeIn(fixture, 'lastName', 'Doe');
    typeIn(fixture, 'login', 'jdoe');
    typeIn(fixture, 'password', 'password');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
    config.onUnhandledError = null;
  });

  it('should display the registration form', () => {
    expect(fixture.nativeElement.querySelector('.card-header').textContent).toContain('Registration Form');
    expect(fixture.nativeElement.querySelector('button.btn-primary').textContent).toContain('Register');
  });

  it('should send the new user to the back-end and alert on success', () => {
    fillForm();
    submitForm(fixture);

    const req = httpMock.expectOne('/api/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      login: 'jdoe',
      password: 'password'
    });
    req.flush(null, { status: 201, statusText: 'Created' });

    expect(alertSpy).toHaveBeenCalledWith('SUCCESS!! :-)');
  });

  it('should not send any request when the form is incomplete', () => {
    typeIn(fixture, 'firstName', 'John');
    submitForm(fixture);

    httpMock.expectNone('/api/register');
    expect(fixture.nativeElement.textContent).toContain('Login is required');
  });

  it('should not alert when the login is already taken', fakeAsync(() => {
    // The component has no error callback: RxJS reports the error as unhandled in a timeout
    const onUnhandledError = jest.fn();
    config.onUnhandledError = onUnhandledError;
    fillForm();
    submitForm(fixture);

    httpMock.expectOne('/api/register')
      .flush('400: Bad Request\nLogin not available', { status: 400, statusText: 'Bad Request' });
    tick();

    expect(alertSpy).not.toHaveBeenCalled();
    expect(onUnhandledError).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  }));
});
