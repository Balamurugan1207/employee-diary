import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RippleModule, BadgeModule],
  template: `
    <div class="flex flex-column h-full py-3 px-2">
      <!-- Main nav -->
      <div class="flex flex-column gap-1">
        @for (item of mainItems; track item.route) {
          <a [routerLink]="item.route" routerLinkActive="active-link"
             [routerLinkActiveOptions]="{ exact: item.exact || false }"
             class="sidebar-link flex align-items-center gap-3 px-3 py-3" pRipple>
            <i [class]="item.icon" class="text-lg" style="width: 20px; text-align: center;"></i>
            <span class="font-medium">{{ item.label }}</span>
          </a>
        }
      </div>

      @if (authService.hasRole('team_lead', 'admin')) {
        <div class="mt-4 mb-2 px-3">
          <span class="text-xs font-bold text-500 uppercase letter-spacing">Team</span>
        </div>
        <div class="flex flex-column gap-1">
          @for (item of teamItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active-link"
               class="sidebar-link flex align-items-center gap-3 px-3 py-3" pRipple>
              <i [class]="item.icon" class="text-lg" style="width: 20px; text-align: center;"></i>
              <span class="font-medium">{{ item.label }}</span>
            </a>
          }
        </div>
      }

      @if (authService.hasRole('team_lead', 'admin')) {
        <div class="mt-4 mb-2 px-3">
          <span class="text-xs font-bold text-500 uppercase letter-spacing">Analytics</span>
        </div>
        <div class="flex flex-column gap-1">
          <a routerLink="/reports" routerLinkActive="active-link"
             class="sidebar-link flex align-items-center gap-3 px-3 py-3" pRipple>
            <i class="pi pi-chart-line text-lg" style="width: 20px; text-align: center;"></i>
            <span class="font-medium">Reports</span>
          </a>
        </div>
      }

      @if (authService.hasRole('admin')) {
        <div class="mt-4 mb-2 px-3">
          <span class="text-xs font-bold text-500 uppercase letter-spacing">Administration</span>
        </div>
        <div class="flex flex-column gap-1">
          @for (item of adminItems; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active-link"
               class="sidebar-link flex align-items-center gap-3 px-3 py-3" pRipple>
              <i [class]="item.icon" class="text-lg" style="width: 20px; text-align: center;"></i>
              <span class="font-medium">{{ item.label }}</span>
            </a>
          }
        </div>
      }

      <!-- Footer -->
      <div class="mt-auto pt-3 px-3 border-top-1 surface-border">
        <div class="text-xs text-400 text-center">Employee Diary v1.0</div>
      </div>
    </div>
  `,
})
export class SidebarComponent {
  constructor(public authService: AuthService) {}

  mainItems: NavItem[] = [
    { label: 'My Diary', icon: 'pi pi-calendar', route: '/diary', exact: true },
    { label: 'Daily Entry', icon: 'pi pi-list', route: '/diary/daily' },
    { label: 'History', icon: 'pi pi-history', route: '/diary/history' },
  ];

  teamItems: NavItem[] = [
    { label: 'Team Dashboard', icon: 'pi pi-chart-bar', route: '/team/dashboard' },
    { label: 'Review Timesheets', icon: 'pi pi-check-square', route: '/team/review' },
    { label: 'Team Members', icon: 'pi pi-users', route: '/team/members' },
  ];

  adminItems: NavItem[] = [
    { label: 'Admin Dashboard', icon: 'pi pi-th-large', route: '/admin/dashboard' },
    { label: 'User Management', icon: 'pi pi-user-edit', route: '/admin/users' },
    { label: 'Teams', icon: 'pi pi-sitemap', route: '/admin/teams' },
    { label: 'Projects', icon: 'pi pi-folder', route: '/admin/projects' },
    { label: 'Webhooks', icon: 'pi pi-link', route: '/admin/webhooks' },
  ];
}
