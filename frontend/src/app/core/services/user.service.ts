import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { PaginatedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(params?: any): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<User>>(this.url, { params: httpParams });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.url}/${id}`);
  }

  createUser(data: any): Observable<User> {
    return this.http.post<User>(this.url, data);
  }

  updateUser(id: number, data: any): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
