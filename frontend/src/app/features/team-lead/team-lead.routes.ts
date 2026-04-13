import { Routes } from '@angular/router';
import { TlDashboardComponent } from './dashboard/tl-dashboard.component';
import { ReviewComponent } from './review/review.component';
import { TeamMembersComponent } from './team-members/team-members.component';

export const TEAM_LEAD_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: TlDashboardComponent },
  { path: 'review', component: ReviewComponent },
  { path: 'members', component: TeamMembersComponent },
];
