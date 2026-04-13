import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ChartModule } from 'primeng/chart';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AdminDashboardData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChipModule, ChartModule],
  template: `
    <div class="page-header">
      <h2>Admin Dashboard</h2>
      <div class="subtitle">System overview and health monitoring</div>
    </div>

    <!-- Stat Cards -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon blue"><i class="pi pi-users"></i></div>
            <div><div class="text-sm text-500 font-medium mb-1">Total Users</div>
              <div class="text-3xl font-bold text-900">{{ data?.total_users || 0 }}</div></div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon green"><i class="pi pi-file"></i></div>
            <div><div class="text-sm text-500 font-medium mb-1">Entries Today</div>
              <div class="text-3xl font-bold text-900">{{ data?.entries_today || 0 }}</div></div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon purple"><i class="pi pi-link"></i></div>
            <div><div class="text-sm text-500 font-medium mb-1">Active Webhooks</div>
              <div class="text-3xl font-bold text-900">{{ data?.active_webhooks || 0 }}</div></div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon" [class.red]="data?.recent_webhook_failures" [class.teal]="!data?.recent_webhook_failures">
              <i class="pi" [class.pi-exclamation-triangle]="data?.recent_webhook_failures" [class.pi-check]="!data?.recent_webhook_failures"></i>
            </div>
            <div><div class="text-sm text-500 font-medium mb-1">Webhook Failures</div>
              <div class="text-3xl font-bold" [class.text-red-500]="data?.recent_webhook_failures"
                   [class.text-green-600]="!data?.recent_webhook_failures">{{ data?.recent_webhook_failures || 0 }}</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Activity Comparison -->
    @if (data) {
      <div class="surface-card border-round-xl shadow-1 p-4 mt-4">
        <h4 class="mt-0 mb-3 text-900">Weekly Activity</h4>
        <div class="flex align-items-center gap-4">
          <div>
            <div class="text-sm text-500">Entries This Week</div>
            <div class="text-3xl font-bold text-900">{{ data.entries_this_week }}</div>
          </div>
          <div class="text-sm font-medium px-3 py-2 border-round-lg"
               [class.text-green-700]="data.entries_this_week >= data.entries_last_week"
               [class.bg-green-50]="data.entries_this_week >= data.entries_last_week"
               [class.text-red-700]="data.entries_this_week < data.entries_last_week"
               [class.bg-red-50]="data.entries_this_week < data.entries_last_week">
            <i class="pi mr-1"
               [class.pi-arrow-up]="data.entries_this_week >= data.entries_last_week"
               [class.pi-arrow-down]="data.entries_this_week < data.entries_last_week"></i>
            vs {{ data.entries_last_week }} last week
          </div>
        </div>
      </div>
    }

    <!-- Users by Role -->
    @if (roleEntries.length) {
      <div class="surface-card border-round-xl shadow-1 p-4 mt-4">
        <h4 class="mt-0 mb-3 text-900">Users by Role</h4>
        <div class="flex gap-4 flex-wrap">
          @for (entry of roleEntries; track entry[0]) {
            <div class="flex align-items-center gap-3 surface-100 border-round-lg px-4 py-3">
              <div class="user-avatar" [style.background]="getRoleColor(entry[0])">
                <i class="pi pi-user text-sm"></i>
              </div>
              <div>
                <div class="font-bold text-2xl text-900">{{ entry[1] }}</div>
                <div class="text-sm text-500 capitalize">{{ entry[0].replace('_', ' ') }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Charts Row 1: Weekly Trend + Status Doughnut -->
    @if (weeklyTrendChart) {
      <div class="grid mt-4">
        <div class="col-12 lg:col-8">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Weekly Hours Trend (Last 4 Weeks)</h4>
            <p-chart type="bar" [data]="weeklyTrendChart" [options]="barOptions" height="300px"></p-chart>
          </div>
        </div>
        <div class="col-12 lg:col-4">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Entries by Status</h4>
            <p-chart type="doughnut" [data]="statusChart" [options]="doughnutOptions" height="300px"></p-chart>
          </div>
        </div>
      </div>
    }

    <!-- Charts Row 2: Top Projects -->
    @if (topProjectsChart) {
      <div class="grid mt-4">
        <div class="col-12">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Top Projects by Hours (Last 4 Weeks)</h4>
            <p-chart type="bar" [data]="topProjectsChart" [options]="horizontalBarOptions" height="250px"></p-chart>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  data: AdminDashboardData | null = null;
  roleEntries: [string, number][] = [];

  weeklyTrendChart: any;
  statusChart: any;
  topProjectsChart: any;

  barOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };
  horizontalBarOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
  };
  doughnutOptions = {
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getAdminDashboard().subscribe(d => {
      this.data = d;
      this.roleEntries = Object.entries(d.users_by_role || {}) as [string, number][];
      this.buildCharts(d);
    });
  }

  private buildCharts(d: AdminDashboardData): void {
    // Weekly hours trend
    this.weeklyTrendChart = {
      labels: d.weekly_hours_trend.map(w => w.week_label),
      datasets: [{
        label: 'Total Hours',
        data: d.weekly_hours_trend.map(w => w.hours),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barThickness: 40,
      }],
    };

    // Entries by status doughnut
    const statusColors: Record<string, string> = {
      draft: '#64748b', submitted: '#3b82f6', approved: '#22c55e', rejected: '#ef4444',
    };
    const statusEntries = Object.entries(d.entries_by_status);
    this.statusChart = {
      labels: statusEntries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
      datasets: [{
        data: statusEntries.map(([, v]) => v),
        backgroundColor: statusEntries.map(([k]) => statusColors[k] || '#64748b'),
      }],
    };

    // Top projects horizontal bar
    const projColors = ['#6366f1', '#3b82f6', '#22c55e', '#f97316', '#a855f7'];
    this.topProjectsChart = {
      labels: d.top_projects.map(p => `${p.project_name} (${p.project_code})`),
      datasets: [{
        label: 'Hours',
        data: d.top_projects.map(p => p.hours),
        backgroundColor: projColors.slice(0, d.top_projects.length),
        borderRadius: 6,
        barThickness: 22,
      }],
    };
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = { admin: '#ef4444', team_lead: '#3b82f6', employee: '#22c55e' };
    return colors[role] || '#64748b';
  }
}
