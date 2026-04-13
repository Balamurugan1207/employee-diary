import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmployeeDashboardData,
  TeamLeadDashboardData,
  AdminDashboardData,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getEmployeeDashboard(): Observable<EmployeeDashboardData> {
    return this.http.get<EmployeeDashboardData>(`${this.url}/employee`);
  }

  getTeamLeadDashboard(): Observable<TeamLeadDashboardData> {
    return this.http.get<TeamLeadDashboardData>(`${this.url}/team-lead`);
  }

  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(`${this.url}/admin`);
  }
}
