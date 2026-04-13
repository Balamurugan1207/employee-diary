import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private url = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getHoursByProject(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/hours-by-project`, {
      params: { start_date: startDate, end_date: endDate },
    });
  }

  getHoursByEmployee(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/hours-by-employee`, {
      params: { start_date: startDate, end_date: endDate },
    });
  }

  getHoursByClient(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/hours-by-client`, {
      params: { start_date: startDate, end_date: endDate },
    });
  }

  getBillableSummary(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/billable-summary`, {
      params: { start_date: startDate, end_date: endDate },
    });
  }

  getMySummary(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.url}/my-summary`, {
      params: { start_date: startDate, end_date: endDate },
    });
  }
}
