import {UserCreate} from '../models/UserCreate';
import {Observable, of} from 'rxjs';


export class UserMockService {

  register(user: UserCreate): Observable<Object> {
    return of();
  }

  register(user: Login): Observable<Object> {
    return of();
  }
}
