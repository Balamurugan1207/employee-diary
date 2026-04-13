export interface Project {
  id: number;
  name: string;
  code: string;
  client_id: number | null;
  client_name: string | null;
  is_active: boolean;
}

export interface Client {
  id: number;
  name: string;
  is_active: boolean;
}
