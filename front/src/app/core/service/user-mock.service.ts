import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserCreate } from '../models/UserCreate';
import { Login } from '../models/Login';
import { UserResponse } from '../models/UserResponse';
import { UserUpdate } from '../models/UserUpdate';

export const MOCK_USERS: UserResponse[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    login: 'jdoe',
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-02T10:00:00'
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    login: 'jsmith',
    createdAt: '2026-02-01T10:00:00',
    updatedAt: '2026-02-02T10:00:00'
  }
];

// Replaces UserService in unit tests: every call succeeds without any HTTP request
@Injectable()
export class UserMockService {

  register(user: UserCreate): Observable<Object> {
    return of({});
  }

  login(user: Login): Observable<Object> {
    return of({});
  }

  create(user: UserCreate): Observable<UserResponse> {
    return of({ ...MOCK_USERS[0], id: 3, firstName: user.firstName, lastName: user.lastName, login: user.login });
  }

  readAll(): Observable<UserResponse[]> {
    return of(MOCK_USERS);
  }

  read(id: number): Observable<UserResponse> {
    return of({ ...MOCK_USERS[0], id });
  }

  update(id: number, user: UserUpdate): Observable<UserResponse> {
    return of({ ...MOCK_USERS[0], id, firstName: user.firstName, lastName: user.lastName, login: user.login });
  }

  delete(id: number): Observable<void> {
    return of(undefined);
  }
}
