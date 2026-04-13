import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private url = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.url);
  }

  createProject(data: any): Observable<Project> {
    return this.http.post<Project>(this.url, data);
  }

  updateProject(id: number, data: any): Observable<Project> {
    return this.http.put<Project>(`${this.url}/${id}`, data);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
