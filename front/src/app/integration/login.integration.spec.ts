import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { config } from 'rxjs';

import { LoginComponent } from '../pages/login/login.component';
import { clickButton, submitForm, typeIn } from './integration-helpers';

describe('Login (integration)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
    config.onUnhandledError = null;
  });

  it('should send the credentials to the back-end and alert on success', () => {
    typeIn(fixture, 'login', 'jdoe');
    typeIn(fixture, 'password', 'password');
    submitForm(fixture);

    const req = httpMock.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'jdoe', password: 'password' });
    req.flush(null, { status: 200, statusText: 'OK' });

    expect(alertSpy).toHaveBeenCalledWith('SUCCESS!! :-)');
  });

  it('should not send any request when the form is incomplete', () => {
    typeIn(fixture, 'login', 'jdoe');
    submitForm(fixture);

    httpMock.expectNone('/api/login');
    expect(fixture.nativeElement.textContent).toContain('password is required');
  });

  it('should not alert when the credentials are rejected', fakeAsync(() => {
    // The component has no error callback: RxJS reports the error as unhandled in a timeout
    const onUnhandledError = jest.fn();
    config.onUnhandledError = onUnhandledError;
    typeIn(fixture, 'login', 'jdoe');
    typeIn(fixture, 'password', 'wrong');
    submitForm(fixture);

    httpMock.expectOne('/api/login')
      .flush('401: Unauthorized\nBad credentials', { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(alertSpy).not.toHaveBeenCalled();
    expect(onUnhandledError).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  }));

  it('should clear the errors when clicking Cancel', () => {
    submitForm(fixture);
    expect(fixture.nativeElement.querySelectorAll('.invalid-feedback').length).toBe(2);

    clickButton(fixture, 'Cancel');

    expect(fixture.nativeElement.querySelectorAll('.invalid-feedback').length).toBe(0);
    httpMock.expectNone('/api/login');
  });
});
