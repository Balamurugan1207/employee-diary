import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TeamLeadDashboardData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-tl-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, KnobModule, FormsModule, ChartModule],
  template: `
    <div class="page-header">
      <h2>Team Dashboard</h2>
      <div class="subtitle">Monitor your team's timesheet activity</div>
    </div>

    <!-- Stat Cards -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon orange"><i class="pi pi-inbox"></i></div>
            <div class="flex-1">
              <div class="text-sm text-500 font-medium mb-1">Pending Approvals</div>
              <div class="text-3xl font-bold text-900">{{ data?.pending_approvals || 0 }}</div>
            </div>
          </div>
          <a routerLink="/team/review" class="flex align-items-center gap-1 mt-3 text-primary font-medium text-sm no-underline hover:underline">
            Review now <i class="pi pi-arrow-right text-xs"></i>
          </a>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon blue"><i class="pi pi-clock"></i></div>
            <div class="flex-1">
              <div class="text-sm text-500 font-medium mb-1">Team Hours (Week)</div>
              <div class="text-3xl font-bold text-900">{{ data?.team_week_hours || 0 }}h</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon purple"><i class="pi pi-users"></i></div>
            <div class="flex-1">
              <div class="text-sm text-500 font-medium mb-1">Team Size</div>
              <div class="text-3xl font-bold text-900">{{ data?.team_size || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card border-round-xl shadow-1 p-4 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
            <div class="flex-1">
              <div class="text-sm text-500 font-medium mb-1">Submitted Today</div>
              <div class="text-3xl font-bold text-900">
                {{ data?.today_submitted_count || 0 }}
                <span class="text-lg text-500 font-normal">/ {{ data?.team_size || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row 1: Member Hours + Daily Trend -->
    @if (memberHoursChart) {
      <div class="grid mt-4">
        <div class="col-12 lg:col-6">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Team Member Hours (This Week)</h4>
            <p-chart type="bar" [data]="memberHoursChart" [options]="horizontalBarOptions" height="300px"></p-chart>
          </div>
        </div>
        <div class="col-12 lg:col-6">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Daily Team Hours (This Week)</h4>
            <p-chart type="line" [data]="dailyTrendChart" [options]="lineOptions" height="300px"></p-chart>
          </div>
        </div>
      </div>
    }

    <!-- Charts Row 2: Status Doughnut + Top Projects -->
    @if (statusChart) {
      <div class="grid mt-4">
        <div class="col-12 md:col-5">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Entries by Status</h4>
            <p-chart type="doughnut" [data]="statusChart" [options]="doughnutOptions" height="280px"></p-chart>
          </div>
        </div>
        <div class="col-12 md:col-7">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Top Projects</h4>
            <p-chart type="bar" [data]="topProjectsChart" [options]="barOptions" height="280px"></p-chart>
          </div>
        </div>
      </div>
    }

    <!-- Members Not Submitted Today -->
    @if (data?.members_not_submitted_today?.length) {
      <div class="surface-card border-round-xl shadow-1 p-4 mt-4">
        <h4 class="mt-0 mb-3 text-900">
          <i class="pi pi-exclamation-circle text-orange-500 mr-2"></i>
          Not Submitted Today ({{ data!.members_not_submitted_today.length }})
        </h4>
        <div class="flex gap-2 flex-wrap">
          @for (m of data!.members_not_submitted_today; track m.user_id) {
            <div class="flex align-items-center gap-2 surface-100 border-round-lg px-3 py-2">
              <div class="user-avatar" style="background: linear-gradient(135deg, #f97316, #ea580c); width: 28px; height: 28px;">
                <i class="pi pi-user text-xs"></i>
              </div>
              <span class="text-sm font-medium text-900">{{ m.name }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Submission Rate Knob -->
    @if (data?.team_size) {
      <div class="surface-card border-round-xl shadow-1 p-4 mt-4">
        <h4 class="mt-0 mb-3 text-900">Today's Submission Rate</h4>
        <div class="flex justify-content-center">
          <p-knob [(ngModel)]="submissionRate" [readonly]="true" [size]="150" valueColor="#22c55e"
                  rangeColor="#e2e8f0" [strokeWidth]="8"></p-knob>
        </div>
      </div>
    }
  `,
})
export class TlDashboardComponent implements OnInit {
  data: TeamLeadDashboardData | null = null;
  submissionRate = 0;

  memberHoursChart: any;
  dailyTrendChart: any;
  statusChart: any;
  topProjectsChart: any;

  barOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } }, x: { grid: { display: false } } },
  };
  horizontalBarOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
  };
  lineOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };
  doughnutOptions = {
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getTeamLeadDashboard().subscribe(d => {
      this.data = d;
      this.submissionRate = d.team_size ? Math.round((d.today_submitted_count / d.team_size) * 100) : 0;
      this.buildCharts(d);
    });
  }

  private buildCharts(d: TeamLeadDashboardData): void {
    // Member hours - horizontal bar
    this.memberHoursChart = {
      labels: d.member_hours_this_week.map(m => m.name),
      datasets: [{
        label: 'Hours',
        data: d.member_hours_this_week.map(m => m.hours),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barThickness: 22,
      }],
    };

    // Daily trend - line
    this.dailyTrendChart = {
      labels: d.daily_team_hours.map(x => x.day),
      datasets: [{
        label: 'Team Hours',
        data: d.daily_team_hours.map(x => x.hours),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#6366f1',
      }],
    };

    // Status doughnut
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

    // Top projects bar
    const projColors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6'];
    this.topProjectsChart = {
      labels: d.top_projects.map(p => p.project_name),
      datasets: [{
        label: 'Hours',
        data: d.top_projects.map(p => p.hours),
        backgroundColor: projColors.slice(0, d.top_projects.length),
        borderRadius: 6,
        barThickness: 28,
      }],
    };
  }
}
