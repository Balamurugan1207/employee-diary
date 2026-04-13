export interface TimesheetEntry {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  entry_date: string;
  project_id: number;
  project_name: string;
  task_description: string;
  hours_worked: number;
  start_time: string;
  end_time: string;
  category: 'dev' | 'meeting' | 'review' | 'testing' | 'deployment' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string | null;
  is_billable: boolean;
  client_name: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimesheetCreateRequest {
  entry_date: string;
  project_id: number;
  task_description: string;
  hours_worked: number;
  start_time: string;
  end_time: string;
  category: string;
  priority: string;
  notes?: string;
  is_billable: boolean;
  client_name?: string;
}

export interface CalendarResponse {
  year: number;
  month: number;
  entries: { [date: string]: TimesheetEntry[] };
}
