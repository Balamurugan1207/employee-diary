import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private url = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.url);
  }

  createClient(data: any): Observable<Client> {
    return this.http.post<Client>(this.url, data);
  }

  updateClient(id: number, data: any): Observable<Client> {
    return this.http.put<Client>(`${this.url}/${id}`, data);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
