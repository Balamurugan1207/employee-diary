export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'team_lead' | 'employee';
  is_active: boolean;
  team_id: number | null;
  team_name: string | null;
  lead_name: string | null;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
