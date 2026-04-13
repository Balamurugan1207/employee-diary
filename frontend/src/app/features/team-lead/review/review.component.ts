import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TimesheetService } from '../../../core/services/timesheet.service';
import { TimesheetEntry } from '../../../core/models/timesheet.model';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, InputTextareaModule, AvatarModule, TooltipModule],
  template: `
    <div class="page-header">
      <h2>Review Timesheets</h2>
      <div class="subtitle">Approve or reject submitted timesheet entries from your team</div>
    </div>

    <div class="surface-card border-round-xl shadow-1">
      <p-table [value]="entries" [paginator]="true" [rows]="20" [totalRecords]="totalEntries"
               [lazy]="true" (onLazyLoad)="onLazyLoad($event)" [rowHover]="true" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Project</th>
            <th>Task</th>
            <th>Hours</th>
            <th>Category</th>
            <th class="text-center">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td>
              <div class="flex align-items-center gap-2">
                <p-avatar [label]="e.user_name?.charAt(0) || '?'" shape="circle" size="normal"
                          [style]="{ 'background-color': '#6366f1', color: 'white' }"></p-avatar>
                <div>
                  <div class="font-semibold text-900">{{ e.user_name }}</div>
                  <div class="text-xs text-500">{{ e.user_email }}</div>
                </div>
              </div>
            </td>
            <td class="font-medium">{{ e.entry_date }}</td>
            <td class="text-700">{{ e.project_name }}</td>
            <td>
              <span class="max-w-12rem overflow-hidden text-overflow-ellipsis white-space-nowrap inline-block"
                    [pTooltip]="e.task_description">{{ e.task_description }}</span>
            </td>
            <td><span class="font-bold text-primary">{{ e.hours_worked }}h</span></td>
            <td><span class="capitalize">{{ e.category }}</span></td>
            <td class="text-center">
              <p-button icon="pi pi-check" [rounded]="true" severity="success" [outlined]="true"
                        pTooltip="Approve" (onClick)="approve(e)" class="mr-1"></p-button>
              <p-button icon="pi pi-times" [rounded]="true" severity="danger" [outlined]="true"
                        pTooltip="Reject" (onClick)="openRejectDialog(e)"></p-button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7">
              <div class="flex flex-column align-items-center py-6 text-500">
                <i class="pi pi-check-circle text-4xl mb-3 text-green-300"></i>
                <span class="text-lg font-medium">All caught up!</span>
                <span class="text-sm mt-1">No timesheets pending review</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog header="Reject Entry" [(visible)]="rejectDialogVisible" [modal]="true"
              [style]="{ width: '420px' }" [draggable]="false">
      <div class="flex flex-column gap-3">
        <div class="surface-100 border-round-lg p-3">
          <div class="text-sm text-500">Rejecting entry from</div>
          <div class="font-bold text-900">{{ selectedEntry?.user_name }} — {{ selectedEntry?.entry_date }}</div>
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-medium">Reason for rejection</label>
          <textarea pInputTextarea [(ngModel)]="rejectReason" rows="4" placeholder="Explain why this entry is being rejected..."
                    class="w-full"></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="rejectDialogVisible = false"></p-button>
        <p-button label="Reject Entry" severity="danger" icon="pi pi-times" [disabled]="!rejectReason"
                  (onClick)="confirmReject()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class ReviewComponent implements OnInit {
  entries: TimesheetEntry[] = [];
  totalEntries = 0;
  page = 1;
  rejectDialogVisible = false;
  rejectReason = '';
  selectedEntry: TimesheetEntry | null = null;

  constructor(private timesheetService: TimesheetService, private messageService: MessageService) {}

  ngOnInit(): void {}

  loadEntries(): void {
    this.timesheetService.getTeamEntries({ page: this.page, per_page: 20, status: 'submitted' }).subscribe(data => {
      this.entries = data.items;
      this.totalEntries = data.total;
    });
  }

  onLazyLoad(event: any): void {
    this.page = Math.floor((event.first || 0) / (event.rows || 20)) + 1;
    this.loadEntries();
  }

  approve(entry: TimesheetEntry): void {
    this.timesheetService.approveEntry(entry.id).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Approved', detail: `Entry by ${entry.user_name} approved`, life: 2000 });
      this.loadEntries();
    });
  }

  openRejectDialog(entry: TimesheetEntry): void {
    this.selectedEntry = entry;
    this.rejectReason = '';
    this.rejectDialogVisible = true;
  }

  confirmReject(): void {
    if (this.selectedEntry && this.rejectReason) {
      this.timesheetService.rejectEntry(this.selectedEntry.id, this.rejectReason).subscribe(() => {
        this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: 'Entry rejected', life: 2000 });
        this.rejectDialogVisible = false;
        this.loadEntries();
      });
    }
  }
}
