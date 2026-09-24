import { Injectable } from '@angular/core';
import { UserCreate } from '../models/UserCreate';
import { Login } from '../models/Login';
import { UserResponse } from '../models/UserResponse';
import { UserUpdate } from '../models/UserUpdate';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpClient: HttpClient) { }

  register(user: UserCreate): Observable<Object> {
    return this.httpClient.post('/api/register', user);
  }

  login(user: Login): Observable<Object> {
    return this.httpClient.post('/api/login', user);
  }

  create(user: UserCreate): Observable<UserResponse> {
    return this.httpClient.post<UserResponse>('/api/user/create', user);
  }

  readAll(): Observable<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>('/api/user/read/');
  }

  read(id: number): Observable<UserResponse> {
    return this.httpClient.get<UserResponse>(`/api/user/read/${id}`);
  }

  update(id: number, user: UserUpdate): Observable<UserResponse> {
    return this.httpClient.put<UserResponse>(`/api/user/update/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`/api/user/delete/${id}`);
  }
}
