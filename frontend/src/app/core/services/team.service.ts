import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, TeamMember } from '../models/team.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private url = `${environment.apiUrl}/teams`;

  constructor(private http: HttpClient) {}

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.url);
  }

  createTeam(data: any): Observable<Team> {
    return this.http.post<Team>(this.url, data);
  }

  updateTeam(id: number, data: any): Observable<Team> {
    return this.http.put<Team>(`${this.url}/${id}`, data);
  }

  getMembers(teamId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.url}/${teamId}/members`);
  }

  addMember(teamId: number, userId: number): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${this.url}/${teamId}/members`, { user_id: userId });
  }

  removeMember(teamId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.url}/${teamId}/members/${userId}`);
  }

  deleteTeam(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
