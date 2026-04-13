export interface WebhookConfig {
  id: number;
  url: string;
  has_secret: boolean;
  events: string[];
  is_active: boolean;
  created_by: number;
  created_at: string;
}

export interface WebhookLog {
  id: number;
  webhook_id: number;
  event: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  attempted_at: string;
  retry_count: number;
}
