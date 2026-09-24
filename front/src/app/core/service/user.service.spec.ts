import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserCreate } from '../models/UserCreate';
import { Login } from '../models/Login';
import { UserUpdate } from '../models/UserUpdate';
import { UserResponse } from '../models/UserResponse';
import { MOCK_USERS } from './user-mock.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const userCreate: UserCreate = { firstName: 'John', lastName: 'Doe', login: 'jdoe', password: 'password' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('register should POST the user to /api/register', () => {
    const next = jest.fn();
    service.register(userCreate).subscribe(next);

    const req = httpMock.expectOne('/api/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userCreate);
    req.flush(null, { status: 201, statusText: 'Created' });

    expect(next).toHaveBeenCalled();
  });

  it('login should POST the credentials to /api/login', () => {
    const credentials: Login = { login: 'jdoe', password: 'password' };
    const next = jest.fn();
    service.login(credentials).subscribe(next);

    const req = httpMock.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(null);

    expect(next).toHaveBeenCalled();
  });

  it('create should POST the user to /api/user/create and return the created user', () => {
    let result: UserResponse | UserResponse[] | undefined;
    service.create(userCreate).subscribe(user => result = user);

    const req = httpMock.expectOne('/api/user/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userCreate);
    req.flush(MOCK_USERS[0]);

    expect(result).toEqual(MOCK_USERS[0]);
  });

  it('readAll should GET /api/user/read/ and return the users', () => {
    let result: UserResponse | UserResponse[] | undefined;
    service.readAll().subscribe(users => result = users);

    const req = httpMock.expectOne('/api/user/read/');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_USERS);

    expect(result).toEqual(MOCK_USERS);
  });

  it('read should GET /api/user/read/{id} and return the user', () => {
    let result: UserResponse | UserResponse[] | undefined;
    service.read(2).subscribe(user => result = user);

    const req = httpMock.expectOne('/api/user/read/2');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_USERS[1]);

    expect(result).toEqual(MOCK_USERS[1]);
  });

  it('update should PUT the user to /api/user/update/{id} and return the updated user', () => {
    const userUpdate: UserUpdate = { firstName: 'Johnny', lastName: 'Doe', login: 'jdoe', password: null };
    let result: UserResponse | UserResponse[] | undefined;
    service.update(1, userUpdate).subscribe(user => result = user);

    const req = httpMock.expectOne('/api/user/update/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(userUpdate);
    req.flush({ ...MOCK_USERS[0], firstName: 'Johnny' });

    expect(result).toEqual({ ...MOCK_USERS[0], firstName: 'Johnny' });
  });

  it('delete should DELETE /api/user/delete/{id}', () => {
    const next = jest.fn();
    service.delete(1).subscribe(next);

    const req = httpMock.expectOne('/api/user/delete/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(next).toHaveBeenCalled();
  });

  it('should forward HTTP errors to the subscriber', () => {
    const error = jest.fn();
    service.read(99).subscribe({ error });

    httpMock.expectOne('/api/user/read/99')
      .flush('404: Not Found\nNo user found with given ID', { status: 404, statusText: 'Not Found' });

    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });
});
