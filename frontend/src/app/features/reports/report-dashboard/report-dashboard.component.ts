import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, CalendarModule, ButtonModule, TabViewModule, TableModule],
  template: `
    <h2 class="mt-0">Reports</h2>

    <p-card styleClass="mb-3">
      <form [formGroup]="dateForm" class="flex align-items-end gap-3 flex-wrap">
        <div class="flex flex-column gap-2">
          <label>Start Date</label>
          <p-calendar formControlName="start_date" [showIcon]="true" dateFormat="yy-mm-dd"></p-calendar>
        </div>
        <div class="flex flex-column gap-2">
          <label>End Date</label>
          <p-calendar formControlName="end_date" [showIcon]="true" dateFormat="yy-mm-dd"></p-calendar>
        </div>
        <p-button label="Load Reports" icon="pi pi-refresh" [disabled]="dateForm.invalid" (onClick)="loadReports()"></p-button>
      </form>
    </p-card>

    <p-tabView>
      <p-tabPanel header="By Project">
        <p-table [value]="projectData" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr><th>Project</th><th>Code</th><th>Total Hours</th><th>Entries</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr><td>{{ r.project_name }}</td><td>{{ r.project_code }}</td><td>{{ r.total_hours }}h</td><td>{{ r.entry_count }}</td></tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4" class="text-center p-3 text-500">No data</td></tr>
          </ng-template>
        </p-table>
      </p-tabPanel>

      <p-tabPanel header="By Employee">
        <p-table [value]="employeeData" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr><th>Employee</th><th>Email</th><th>Total Hours</th><th>Entries</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr><td>{{ r.employee_name }}</td><td>{{ r.email }}</td><td>{{ r.total_hours }}h</td><td>{{ r.entry_count }}</td></tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4" class="text-center p-3 text-500">No data</td></tr>
          </ng-template>
        </p-table>
      </p-tabPanel>

      <p-tabPanel header="By Client">
        <p-table [value]="clientData" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr><th>Client</th><th>Total Hours</th><th>Entries</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr><td>{{ r.client_name }}</td><td>{{ r.total_hours }}h</td><td>{{ r.entry_count }}</td></tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="3" class="text-center p-3 text-500">No data</td></tr>
          </ng-template>
        </p-table>
      </p-tabPanel>
    </p-tabView>
  `,
})
export class ReportDashboardComponent implements OnInit {
  dateForm!: FormGroup;
  projectData: any[] = [];
  employeeData: any[] = [];
  clientData: any[] = [];

  constructor(private fb: FormBuilder, private reportService: ReportService) {}

  ngOnInit(): void {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.dateForm = this.fb.group({
      start_date: [firstOfMonth, Validators.required],
      end_date: [today, Validators.required],
    });

    this.loadReports();
  }

  loadReports(): void {
    const start = this.formatDate(this.dateForm.value.start_date);
    const end = this.formatDate(this.dateForm.value.end_date);

    this.reportService.getHoursByProject(start, end).subscribe(d => this.projectData = d);
    this.reportService.getHoursByEmployee(start, end).subscribe(d => this.employeeData = d);
    this.reportService.getHoursByClient(start, end).subscribe(d => this.clientData = d);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
