import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimesheetEntry, TimesheetCreateRequest, CalendarResponse } from '../models/timesheet.model';
import { PaginatedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private url = `${environment.apiUrl}/timesheets`;

  constructor(private http: HttpClient) {}

  getEntries(params?: any): Observable<PaginatedResponse<TimesheetEntry>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<TimesheetEntry>>(this.url, { params: httpParams });
  }

  getEntry(id: number): Observable<TimesheetEntry> {
    return this.http.get<TimesheetEntry>(`${this.url}/${id}`);
  }

  createEntry(data: TimesheetCreateRequest): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(this.url, data);
  }

  updateEntry(id: number, data: Partial<TimesheetCreateRequest>): Observable<TimesheetEntry> {
    return this.http.put<TimesheetEntry>(`${this.url}/${id}`, data);
  }

  createAndSubmitEntry(payload: TimesheetCreateRequest): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.url}/submit`, payload);
  }

  updateAndSubmitEntry(id: number, payload: TimesheetCreateRequest): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.url}/${id}/submit`, payload);
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }

  submitEntry(id: number): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.url}/${id}/submit`, {});
  }

  approveEntry(id: number): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.url}/${id}/approve`, {});
  }

  rejectEntry(id: number, reason: string): Observable<TimesheetEntry> {
    return this.http.post<TimesheetEntry>(`${this.url}/${id}/reject`, { reason });
  }

  getEntriesByDate(date: string) {
  return this.http.get<any[]>(`${this.url}/by-date/${date}`);
  }

  getTeamEntries(params?: any): Observable<PaginatedResponse<TimesheetEntry>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<TimesheetEntry>>(`${this.url}/team`, { params: httpParams });
  }

  createBulkEntries(entries: TimesheetCreateRequest[], submit: boolean = true): Observable<any> {
    return this.http.post(`${this.url}/bulk`, { entries, submit });
  }

  getCalendar(year: number, month: number): Observable<CalendarResponse> {
    return this.http.get<CalendarResponse>(`${this.url}/calendar`, {
      params: { year: year.toString(), month: month.toString() },
    });
  }
}
