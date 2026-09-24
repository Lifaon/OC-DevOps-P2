import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { routes } from '../app.routes';
import { LoginComponent } from '../pages/login/login.component';
import { RegisterComponent } from '../pages/register/register.component';
import { UserComponent } from '../pages/user/user.component';

describe('Routing (integration)', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display the login page on /login', async () => {
    const component = await harness.navigateByUrl('/login', LoginComponent);

    expect(component).toBeInstanceOf(LoginComponent);
    expect(harness.routeNativeElement?.querySelector('input[formcontrolname="login"]')).not.toBeNull();
  });

  it('should display the registration page on /register', async () => {
    const component = await harness.navigateByUrl('/register', RegisterComponent);

    expect(component).toBeInstanceOf(RegisterComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Registration Form');
  });

  it('should display the users page on /users and load the users', async () => {
    const component = await harness.navigateByUrl('/users', UserComponent);

    httpMock.expectOne('/api/user/read/').flush([]);
    harness.detectChanges();

    expect(component).toBeInstanceOf(UserComponent);
    expect(harness.routeNativeElement?.textContent).toContain('No users found.');
  });
});
