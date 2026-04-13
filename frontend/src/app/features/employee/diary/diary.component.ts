import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { TimesheetService } from '../../../core/services/timesheet.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TimesheetEntry } from '../../../core/models/timesheet.model';
import { EmployeeDashboardData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, CardModule, SkeletonModule, ChartModule],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <h2>My Diary</h2>
      <div class="subtitle">Track your daily activities and timesheets</div>
    </div>

    <!-- Quick Stats -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="surface-card border-round-xl shadow-1 p-3 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon blue"><i class="pi pi-clock"></i></div>
            <div>
              <div class="text-sm text-500 font-medium">This Week</div>
              <div class="text-2xl font-bold text-900">{{ dashData?.week_hours || 0 }}h</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="surface-card border-round-xl shadow-1 p-3 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon orange"><i class="pi pi-file-edit"></i></div>
            <div>
              <div class="text-sm text-500 font-medium">Drafts</div>
              <div class="text-2xl font-bold text-900">{{ dashData?.pending_drafts || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="surface-card border-round-xl shadow-1 p-3 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon red"><i class="pi pi-exclamation-circle"></i></div>
            <div>
              <div class="text-sm text-500 font-medium">Rejected</div>
              <div class="text-2xl font-bold text-900">{{ dashData?.rejected_entries || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="surface-card border-round-xl shadow-1 p-3 stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
            <div>
              <div class="text-sm text-500 font-medium">Approval Rate</div>
              <div class="text-2xl font-bold" [style.color]="(dashData?.approval_rate || 0) >= 80 ? '#22c55e' : '#f97316'">
                {{ dashData?.approval_rate || 0 }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    @if (dailyHoursChart) {
      <div class="grid mb-4">
        <div class="col-12 md:col-6">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Daily Hours This Week</h4>
            <p-chart type="bar" [data]="dailyHoursChart" [options]="barOptions" height="250px"></p-chart>
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Hours by Category</h4>
            <p-chart type="doughnut" [data]="categoryChart" [options]="doughnutOptions" height="250px"></p-chart>
          </div>
        </div>
      </div>
    }

    @if (projectChart) {
      <div class="grid mb-4">
        <div class="col-12">
          <div class="surface-card border-round-xl shadow-1 p-4">
            <h4 class="mt-0 mb-3 text-900">Hours by Project (This Month)</h4>
            <p-chart type="bar" [data]="projectChart" [options]="horizontalBarOptions" height="250px"></p-chart>
          </div>
        </div>
      </div>
    }

    <!-- Calendar -->
    <div class="surface-card border-round-xl shadow-1 p-4">
      <div class="flex align-items-center justify-content-between mb-4">
        <div class="flex align-items-center gap-2">
          <p-button icon="pi pi-chevron-left" [rounded]="true" [text]="true" severity="secondary" (onClick)="prevMonth()"></p-button>
          <h3 class="m-0 text-lg font-bold text-900" style="min-width: 200px; text-align: center;">
            {{ monthNames[currentMonth - 1] }} {{ currentYear }}
          </h3>
          <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true" severity="secondary" (onClick)="nextMonth()"></p-button>
        </div>
        <p-button label="Today" [outlined]="true" severity="secondary" size="small" icon="pi pi-calendar"
                  (onClick)="goToToday()"></p-button>
      </div>

      @if (loading) {
        <div class="grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
          @for (i of skeletonCells; track i) {
            <p-skeleton height="110px" borderRadius="8px"></p-skeleton>
          }
        </div>
      } @else {
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
          @for (day of weekDays; track day) {
            <div class="text-center font-bold text-sm text-500 py-2">{{ day }}</div>
          }
          @for (cell of calendarCells; track $index) {
            <div class="day-cell" [class.today]="cell.isToday" [class.other-month]="!cell.currentMonth"
                 (click)="cell.currentMonth && onDayClick(cell.date)">
              <div class="flex justify-content-between align-items-center mb-1">
                <span class="font-bold text-sm" [class.text-primary]="cell.isToday">{{ cell.day }}</span>
                @if (cell.entries.length) {
                  <span class="text-xs text-500">{{ getTotalHours(cell.entries) }}h</span>
                }
              </div>
              @for (entry of cell.entries.slice(0, 3); track entry.id) {
                <div class="entry-pill" [class]="entry.status" [pTooltip]="entry.task_description" tooltipPosition="top">
                  {{ entry.project_name }}
                </div>
              }
              @if (cell.entries.length > 3) {
                <div class="text-xs text-primary font-medium mt-1">+{{ cell.entries.length - 3 }} more</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DiaryComponent implements OnInit {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  loading = false;
  entriesByDate: { [date: string]: TimesheetEntry[] } = {};
  calendarCells: any[] = [];
  dashData: EmployeeDashboardData | null = null;
  skeletonCells = Array.from({ length: 35 }, (_, i) => i);
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  dailyHoursChart: any;
  categoryChart: any;
  projectChart: any;

  barOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 2 } }, x: { grid: { display: false } } },
  };
  doughnutOptions = {
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
  };
  horizontalBarOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
  };

  constructor(
    private timesheetService: TimesheetService,
    private dashboardService: DashboardService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCalendar();
    this.dashboardService.getEmployeeDashboard().subscribe(d => {
      this.dashData = d;
      this.buildCharts(d);
    });
  }

  private buildCharts(d: EmployeeDashboardData): void {
    this.dailyHoursChart = {
      labels: d.daily_hours_this_week.map(x => x.day),
      datasets: [{
        label: 'Hours',
        data: d.daily_hours_this_week.map(x => x.hours),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barThickness: 28,
      }],
    };

    const catEntries = Object.entries(d.hours_by_category).filter(([, v]) => v > 0);
    const catColors = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#14b8a6', '#64748b'];
    this.categoryChart = {
      labels: catEntries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
      datasets: [{
        data: catEntries.map(([, v]) => v),
        backgroundColor: catColors.slice(0, catEntries.length),
      }],
    };

    if (d.hours_by_project.length) {
      const projColors = ['#6366f1', '#3b82f6', '#22c55e', '#f97316', '#a855f7'];
      this.projectChart = {
        labels: d.hours_by_project.map(p => p.project_name),
        datasets: [{
          label: 'Hours',
          data: d.hours_by_project.map(p => p.hours),
          backgroundColor: projColors.slice(0, d.hours_by_project.length),
          borderRadius: 6,
          barThickness: 22,
        }],
      };
    }
  }

  loadCalendar(): void {
    this.loading = true;
    this.timesheetService.getCalendar(this.currentYear, this.currentMonth).subscribe({
      next: (data) => { this.entriesByDate = data.entries; this.buildCalendar(); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const today = new Date();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    this.calendarCells = [];
    const prevMonthLast = new Date(this.currentYear, this.currentMonth - 1, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      this.calendarCells.push({ day: prevMonthLast.getDate() - i, currentMonth: false, date: '', entries: [], isToday: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === this.currentYear && today.getMonth() + 1 === this.currentMonth && today.getDate() === d;
      this.calendarCells.push({ day: d, currentMonth: true, date: dateStr, entries: this.entriesByDate[dateStr] || [], isToday });
    }
    const remaining = 7 - (this.calendarCells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        this.calendarCells.push({ day: d, currentMonth: false, date: '', entries: [], isToday: false });
      }
    }
  }

  getTotalHours(entries: TimesheetEntry[]): number {
    return entries.reduce((sum, e) => sum + e.hours_worked, 0);
  }

  prevMonth(): void { this.currentMonth--; if (this.currentMonth < 1) { this.currentMonth = 12; this.currentYear--; } this.loadCalendar(); }
  nextMonth(): void { this.currentMonth++; if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; } this.loadCalendar(); }
  goToToday(): void { this.currentYear = new Date().getFullYear(); this.currentMonth = new Date().getMonth() + 1; this.loadCalendar(); }
  onDayClick(date: string): void { if (date) this.router.navigate(['/diary/entry'], { queryParams: { date } }); }
  addEntry(): void { this.router.navigate(['/diary/entry'], { queryParams: { date: new Date().toISOString().split('T')[0] } }); }
}
