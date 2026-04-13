import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'diary', pathMatch: 'full' },
      {
        path: 'diary',
        loadChildren: () => import('./features/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES),
      },
      {
        path: 'team',
        canActivate: [roleGuard],
        data: { roles: ['team_lead', 'admin'] },
        loadChildren: () => import('./features/team-lead/team-lead.routes').then(m => m.TEAM_LEAD_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['team_lead', 'admin'] },
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'diary' },
];
