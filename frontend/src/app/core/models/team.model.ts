export interface Team {
  id: number;
  name: string;
  lead_id: number;
  lead_name: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}
