import {Register} from '../models/Register';
import {Observable, of} from 'rxjs';


export class UserMockService {

  register(user: Register): Observable<Object> {
    return of();
  }

  register(user: Login): Observable<Object> {
    return of();
  }
}
