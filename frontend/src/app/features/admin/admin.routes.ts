import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserListComponent } from './user-management/user-list.component';
import { ProjectListComponent } from './project-management/project-list.component';
import { TeamManagementComponent } from './team-management/team-management.component';
import { WebhookConfigComponent } from './webhook-config/webhook-config.component';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'users', component: UserListComponent },
  { path: 'projects', component: ProjectListComponent },
  { path: 'teams', component: TeamManagementComponent },
  { path: 'webhooks', component: WebhookConfigComponent },
];
