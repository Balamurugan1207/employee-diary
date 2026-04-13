export interface DayHours {
  date: string;
  day: string;
  hours: number;
}

export interface ProjectHours {
  project_name: string;
  project_code?: string;
  hours: number;
}

export interface MemberHours {
  name: string;
  user_id: number;
  hours: number;
}

export interface MemberInfo {
  user_id: number;
  name: string;
}

export interface EmployeeDashboardData {
  today_entries: any[];
  week_hours: number;
  pending_drafts: number;
  rejected_entries: number;
  daily_hours_this_week: DayHours[];
  hours_by_category: Record<string, number>;
  hours_by_project: ProjectHours[];
  approval_rate: number;
}

export interface TeamLeadDashboardData {
  pending_approvals: number;
  team_week_hours: number;
  team_size: number;
  today_submitted_count: number;
  member_hours_this_week: MemberHours[];
  daily_team_hours: DayHours[];
  entries_by_status: Record<string, number>;
  top_projects: ProjectHours[];
  members_not_submitted_today: MemberInfo[];
}

export interface WeekHoursTrend {
  week_label: string;
  hours: number;
}

export interface AdminDashboardData {
  total_users: number;
  entries_today: number;
  active_webhooks: number;
  recent_webhook_failures: number;
  users_by_role: Record<string, number>;
  weekly_hours_trend: WeekHoursTrend[];
  entries_by_status: Record<string, number>;
  top_projects: (ProjectHours & { project_code: string })[];
  entries_this_week: number;
  entries_last_week: number;
}
