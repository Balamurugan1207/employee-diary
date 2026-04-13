import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TimesheetService } from '../../../core/services/timesheet.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimesheetEntry } from '../../../core/models/timesheet.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, DropdownModule, TooltipModule, FormsModule],
  template: `
    <div class="page-header flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h2>Entry History</h2>
        <div class="subtitle">{{ isAdmin ? 'View and manage all timesheet entries' : 'View and manage all your timesheet entries' }}</div>
      </div>
      <div class="flex gap-2 flex-wrap">
        @if (isAdmin) {
          <p-dropdown [options]="userOptions" [(ngModel)]="userFilter" (onChange)="loadEntries()"
                      placeholder="All Users" [showClear]="true" [filter]="true"
                      filterPlaceholder="Search user..." styleClass="w-14rem"></p-dropdown>
        }
        <p-dropdown [options]="statusOptions" [(ngModel)]="statusFilter" (onChange)="loadEntries()"
                    placeholder="All Status" [showClear]="true" styleClass="w-12rem"></p-dropdown>
      </div>
    </div>

    <div class="surface-card border-round-xl shadow-1">
      <p-table [value]="entries" [paginator]="true" [rows]="20" [totalRecords]="totalEntries"
               [lazy]="true" (onLazyLoad)="onLazyLoad($event)" [rowsPerPageOptions]="[10, 20, 50]"
               [rowHover]="true" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Date</th>
            @if (isAdmin) {
              <th>Employee</th>
            }
            <th>Project</th>
            <th>Task</th>
            <th>Hours</th>
            <th>Category</th>
            <th>Status</th>
            <th class="text-center">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td class="font-medium text-900">{{ e.entry_date }}</td>
            @if (isAdmin) {
              <td>
                <span class="text-700">{{ e.user_name }}</span>
              </td>
            }
            <td>
              <span class="font-medium text-700">{{ e.project_name }}</span>
            </td>
            <td>
              <span class="max-w-20rem overflow-hidden text-overflow-ellipsis white-space-nowrap inline-block"
                    [pTooltip]="e.task_description" tooltipPosition="top">{{ e.task_description }}</span>
            </td>
            <td><span class="font-bold text-primary">{{ e.hours_worked }}h</span></td>
            <td><span class="capitalize text-700">{{ e.category }}</span></td>
            <td>
              <p-tag [value]="e.status" [severity]="getStatusSeverity(e.status)" [rounded]="true"></p-tag>
            </td>
            <td class="text-center">
              @if (!isAdmin && (e.status === 'draft' || e.status === 'rejected')) {
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info"
                          pTooltip="Edit" (onClick)="editEntry(e)"></p-button>
              }
              @if (!isAdmin && e.status === 'draft') {
                <p-button icon="pi pi-send" [rounded]="true" [text]="true" severity="success"
                          pTooltip="Submit" (onClick)="submitEntry(e)"></p-button>
              }
              @if (isAdmin) {
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                          pTooltip="Delete" (onClick)="deleteEntry(e)"></p-button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="isAdmin ? 8 : 7">
              <div class="flex flex-column align-items-center py-6 text-500">
                <i class="pi pi-file text-4xl mb-3"></i>
                <span class="text-lg">No entries found</span>
                <span class="text-sm mt-1">{{ isAdmin ? 'No timesheet entries match the selected filters' : 'Start by creating a new entry from your diary' }}</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  entries: TimesheetEntry[] = [];
  totalEntries = 0;
  page = 1;
  statusFilter: string | null = null;
  userFilter: number | null = null;
  userOptions: { label: string; value: number }[] = [];
  isAdmin = false;

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  constructor(
    private timesheetService: TimesheetService,
    private userService: UserService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin');
    if (this.isAdmin) {
      this.userService.getUsers({ page: 1, per_page: 200 }).subscribe(data => {
        this.userOptions = data.items.map((u: any) => ({
          label: `${u.first_name} ${u.last_name}`,
          value: u.id,
        }));
      });
    }
  }

  loadEntries(): void {
    const params: any = { page: this.page, per_page: 20 };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.isAdmin) {
      params.all = 'true';
      if (this.userFilter) params.user_id = this.userFilter;
    }
    this.timesheetService.getEntries(params).subscribe(data => {
      this.entries = data.items;
      this.totalEntries = data.total;
    });
  }

  onLazyLoad(event: any): void {
    this.page = Math.floor((event.first || 0) / (event.rows || 20)) + 1;
    this.loadEntries();
  }

  editEntry(entry: TimesheetEntry): void {
    this.router.navigate(['/diary/entry', entry.id]);
  }

  submitEntry(entry: TimesheetEntry): void {
    this.timesheetService.submitEntry(entry.id).subscribe(() => this.loadEntries());
  }

  deleteEntry(entry: TimesheetEntry): void {
    this.confirmationService.confirm({
      message: `Delete entry "${entry.task_description}" by ${entry.user_name} on ${entry.entry_date}?`,
      header: 'Delete Entry',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.timesheetService.deleteEntry(entry.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Entry deleted', life: 2000 });
            this.loadEntries();
          },
          error: (err) => {
            const msg = err.error?.error?.message || 'Failed to delete';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
          },
        });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    return { draft: 'warning' as const, submitted: 'info' as const, approved: 'success' as const, rejected: 'danger' as const }[status];
  }
}
