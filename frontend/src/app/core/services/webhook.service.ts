import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebhookConfig, WebhookLog } from '../models/webhook.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private url = `${environment.apiUrl}/webhooks`;

  constructor(private http: HttpClient) {}

  getWebhooks(): Observable<WebhookConfig[]> {
    return this.http.get<WebhookConfig[]>(this.url);
  }

  createWebhook(data: any): Observable<WebhookConfig> {
    return this.http.post<WebhookConfig>(this.url, data);
  }

  updateWebhook(id: number, data: any): Observable<WebhookConfig> {
    return this.http.put<WebhookConfig>(`${this.url}/${id}`, data);
  }

  deleteWebhook(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }

  testWebhook(id: number): Observable<any> {
    return this.http.post(`${this.url}/${id}/test`, {});
  }

  getLogs(id: number): Observable<WebhookLog[]> {
    return this.http.get<WebhookLog[]>(`${this.url}/${id}/logs`);
  }
}
