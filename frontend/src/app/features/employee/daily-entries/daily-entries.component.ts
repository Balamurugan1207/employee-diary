import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { TimesheetService } from '../../../core/services/timesheet.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import {
  TimesheetEntry,
  TimesheetCreateRequest
} from '../../../core/models/timesheet.model';

@Component({
  selector: 'app-daily-entries',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    MessageModule,
    TooltipModule,
  ],
  template: `
    <div class="page-header flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h2>Daily Entry</h2>
        <div class="subtitle">Submit all your tasks for a single day</div>
      </div>

      <p-button
        label="Back to Diary"
        icon="pi pi-arrow-left"
        [text]="true"
        severity="secondary"
        (onClick)="router.navigate(['/diary'])">
      </p-button>
    </div>

    <div class="surface-card border-round-xl shadow-1 p-4 mb-4">
      <div class="flex align-items-center gap-4 flex-wrap">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-800 text-sm">
            DATE <span class="text-red-500">*</span>
          </label>

          <p-calendar
            [(ngModel)]="selectedDate"
            [showIcon]="true"
            dateFormat="yy-mm-dd"
            placeholder="Select date"
            [showOnFocus]="false"
            styleClass="w-15rem"
            (onSelect)="onDateChange()">
          </p-calendar>
        </div>

        <div class="flex align-items-end gap-2 mt-3">
          <span class="text-sm text-500">Total Hours:</span>
          <span class="text-xl font-bold text-primary">{{ getTotalHours() }}h</span>
          <span class="text-sm text-500 ml-3">Entries:</span>
          <span class="text-xl font-bold text-900">{{ entries.length }}</span>
        </div>
      </div>
    </div>

    <div *ngIf="loadingEntries" class="mb-3">
      <p-message severity="info" text="Loading entries for selected date..."></p-message>
    </div>

    <ng-container *ngIf="selectedDate">
      <div *ngFor="let entry of entries.controls; let i = index" class="surface-card border-round-xl shadow-1 p-4 mb-3">
        <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div class="flex align-items-center gap-3 flex-wrap">
            <span class="font-bold text-900">Task {{ i + 1 }}</span>

            <span
              class="text-xs px-2 py-1 border-round font-medium"
              [ngClass]="{
                'bg-blue-100 text-blue-800': getEntryStatus(i) === 'submitted',
                'bg-orange-100 text-orange-800': getEntryStatus(i) === 'draft',
                'bg-red-100 text-red-800': getEntryStatus(i) === 'rejected',
                'bg-green-100 text-green-800': getEntryStatus(i) === 'approved'
              }">
              {{ getEntryStatus(i) | titlecase }}
            </span>
          </div>

          <p-button
            *ngIf="entries.length > 1 && canDeleteEntry(i)"
            icon="pi pi-trash"
            [rounded]="true"
            [text]="true"
            severity="danger"
            pTooltip="Remove task"
            (onClick)="removeEntry(i)">
          </p-button>
        </div>

        <div *ngIf="!canEditEntry(i)" class="mb-3">
          <p-message severity="info" text="This entry is locked and cannot be edited."></p-message>
        </div>

        <div
          *ngIf="getEntryStatus(i) === 'rejected' && getEntryGroup(i).get('rejection_reason')?.getRawValue()"
          class="mb-3">
          <p-message
            severity="error"
            [text]="'Rejected reason: ' + getEntryGroup(i).get('rejection_reason')?.getRawValue()">
          </p-message>
        </div>

        <div [formGroup]="getEntryGroup(i)">
          <div class="grid mb-3">
            <div class="col-12 md:col-4">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  PROJECT <span class="text-red-500">*</span>
                </label>
                <p-dropdown
                  formControlName="project_id"
                  [options]="projectOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select project"
                  [filter]="true"
                  filterPlaceholder="Search..."
                  styleClass="w-full">
                </p-dropdown>
              </div>
            </div>

            <div class="col-12 md:col-4">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">CLIENT</label>
                <input
                  pInputText
                  formControlName="client_name"
                  class="w-full"
                  readonly>
              </div>
            </div>

            <div class="col-12 md:col-4">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  TASK DESCRIPTION <span class="text-red-500">*</span>
                </label>
                <input
                  pInputText
                  formControlName="task_description"
                  placeholder="What did you work on? (min 10 chars)"
                  class="w-full">
              </div>
            </div>
          </div>

          <div class="grid mb-3">
            <div class="col-6 md:col-2">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  START TIME <span class="text-red-500">*</span>
                </label>
                <p-calendar
                  formControlName="start_time"
                  [timeOnly]="true"
                  [showIcon]="true"
                  icon="pi pi-clock"
                  styleClass="w-full"
                  placeholder="HH:MM"
                  hourFormat="24">
                </p-calendar>
              </div>
            </div>

            <div class="col-6 md:col-2">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  END TIME <span class="text-red-500">*</span>
                </label>
                <p-calendar
                  formControlName="end_time"
                  [timeOnly]="true"
                  [showIcon]="true"
                  icon="pi pi-clock"
                  styleClass="w-full"
                  placeholder="HH:MM"
                  hourFormat="24">
                </p-calendar>

                <small
                  *ngIf="getEntryGroup(i).hasError('invalidTimeRange') && (getEntryGroup(i).get('end_time')?.touched || formSubmitted)"
                  class="text-red-500">
                  End time must be greater than start time
                </small>
              </div>
            </div>

            <div class="col-6 md:col-2">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  HOURS <span class="text-red-500">*</span>
                </label>
                <p-inputNumber
                  formControlName="hours_worked"
                  [min]="0.25"
                  [max]="24"
                  [step]="0.25"
                  [minFractionDigits]="1"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  styleClass="w-full"
                  suffix="h">
                </p-inputNumber>
                <small class="text-500">Auto-calculated</small>
              </div>
            </div>

            <div class="col-6 md:col-3">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">
                  CATEGORY <span class="text-red-500">*</span>
                </label>
                <p-dropdown
                  formControlName="category"
                  [options]="categories"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Category"
                  styleClass="w-full">
                </p-dropdown>
              </div>
            </div>

            <div class="col-6 md:col-3">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">PRIORITY</label>
                <p-dropdown
                  formControlName="priority"
                  [options]="priorities"
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-full">
                </p-dropdown>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="col-12 md:col-8">
              <div class="flex flex-column gap-2">
                <label class="font-semibold text-800 text-xs">NOTES</label>
                <input
                  pInputText
                  formControlName="notes"
                  placeholder="Optional notes"
                  class="w-full">
              </div>
            </div>

            <div class="col-12 md:col-4">
              <div class="flex align-items-center gap-2 mt-4">
                <p-checkbox
                  formControlName="is_billable"
                  [binary]="true"
                  [inputId]="'billable_' + i">
                </p-checkbox>
                <label [for]="'billable_' + i" class="font-medium cursor-pointer text-sm">
                  Billable
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
        <p-button
          label="Add Another Task"
          icon="pi pi-plus"
          [outlined]="true"
          severity="secondary"
          [disabled]="hasLockedOnlyEntries()"
          (onClick)="addEntry()">
        </p-button>

        <div class="flex gap-2">
          <p-button
            label="Save as Draft"
            icon="pi pi-save"
            [outlined]="true"
            severity="secondary"
            [loading]="saving"
            [disabled]="!selectedDate || entries.length === 0 || !hasAnyEditableEntries()"
            (onClick)="saveAll(false)">
          </p-button>

          <p-button
            label="Submit All ({{ getEditableEntriesCount() }})"
            icon="pi pi-send"
            [loading]="saving"
            [disabled]="!selectedDate || !hasAnyEditableEntries()"
            (onClick)="saveAll(true)">
          </p-button>
        </div>
      </div>

      <div *ngIf="formSubmitted && hasInvalidEditableEntries()" class="mt-3">
        <p-message
          severity="error"
          text="Please fill all required fields correctly in editable tasks before submitting.">
        </p-message>
      </div>
    </ng-container>
  `,
})
export class DailyEntriesComponent implements OnInit {
  selectedDate: Date | null = new Date();
  form!: FormGroup;
  projectOptions: { label: string; value: number }[] = [];
  projects: Project[] = [];
  saving = false;
  formSubmitted = false;
  loadingEntries = false;

  categories = [
    { label: 'Development', value: 'dev' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Code Review', value: 'review' },
    { label: 'Testing', value: 'testing' },
    { label: 'Deployment', value: 'deployment' },
    { label: 'Other', value: 'other' },
  ];

  priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' },
  ];

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private projectService: ProjectService,
    private messageService: MessageService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      entries: this.fb.array([]),
    });

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.projectOptions = projects.map((p) => ({
          label: `${p.name} (${p.code})`,
          value: p.id
        }));

        if (this.selectedDate) {
          this.loadEntriesForDate(this.selectedDate);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load projects',
          life: 4000
        });
      }
    });
  }

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  getEntryGroup(index: number): FormGroup {
    return this.entries.at(index) as FormGroup;
  }

  getEntryStatus(index: number): 'draft' | 'submitted' | 'rejected' | 'approved' {
    return this.getEntryGroup(index).get('status')?.getRawValue() || 'draft';
  }

  canEditEntry(index: number): boolean {
    const status = this.getEntryStatus(index);
    return status === 'draft' || status === 'rejected';
  }

  canDeleteEntry(index: number): boolean {
    const group = this.getEntryGroup(index);
    const status = this.getEntryStatus(index);
    const id = group.get('id')?.getRawValue();
    return !id && (status === 'draft' || status === 'rejected');
  }

  hasAnyEditableEntries(): boolean {
    return this.entries.controls.some((_, index) => this.canEditEntry(index));
  }

  getEditableEntriesCount(): number {
    return this.entries.controls.filter((_, index) => this.canEditEntry(index)).length;
  }

  hasLockedOnlyEntries(): boolean {
    return this.entries.length > 0 && !this.hasAnyEditableEntries();
  }

  onDateChange(): void {
    this.formSubmitted = false;
    if (this.selectedDate) {
      this.loadEntriesForDate(this.selectedDate);
    }
  }

  loadEntriesForDate(date: Date): void {
    this.loadingEntries = true;
    this.entries.clear();

    const dateStr = this.formatDate(date);

    this.timesheetService.getEntriesByDate(dateStr).subscribe({
      next: (entries: TimesheetEntry[]) => {
        if (entries.length > 0) {
          entries.forEach((entry) => this.addEntry(entry));
        } else {
          this.addEntry();
        }
        this.loadingEntries = false;
      },
      error: () => {
        this.loadingEntries = false;
        this.addEntry();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load entries for selected date',
          life: 4000
        });
      }
    });
  }

  addEntry(entry?: TimesheetEntry): void {
    const group = this.fb.group(
      {
        id: [entry?.id ?? null],
        project_id: [entry?.project_id ?? null, Validators.required],
        client_name: [{ value: entry?.client_name ?? '', disabled: true }],
        task_description: [entry?.task_description ?? '', [Validators.required, Validators.minLength(10)]],
        hours_worked: [{ value: entry?.hours_worked ?? null, disabled: true }, [Validators.required, Validators.min(0.25), Validators.max(24)]],
        start_time: [entry ? this.toTimeDate(entry.start_time) : null, Validators.required],
        end_time: [entry ? this.toTimeDate(entry.end_time) : null, Validators.required],
        category: [entry?.category ?? null, Validators.required],
        priority: [entry?.priority ?? 'medium', Validators.required],
        notes: [entry?.notes ?? ''],
        is_billable: [entry?.is_billable ?? true],
        status: [entry?.status ?? 'draft'],
        rejection_reason: [entry?.rejection_reason ?? null],
      },
      { validators: [this.timeRangeValidator()] }
    );

    this.entries.push(group);
    this.setupProjectAutoFill(group);
    this.setupHoursAutoCalculation(group);
    this.applyEditState(group);
  }

  removeEntry(index: number): void {
    this.entries.removeAt(index);
    if (this.entries.length === 0) {
      this.addEntry();
    }
  }

  getTotalHours(): number {
    const total = this.entries.controls.reduce((sum, ctrl) => {
      const value = Number((ctrl as FormGroup).get('hours_worked')?.getRawValue() || 0);
      return sum + value;
    }, 0);

    return Math.round(total * 100) / 100;
  }

  hasInvalidEditableEntries(): boolean {
    let invalid = false;

    this.entries.controls.forEach((ctrl, index) => {
      if (!this.canEditEntry(index)) {
        return;
      }

      const group = ctrl as FormGroup;
      group.markAllAsTouched();

      if (group.invalid) {
        invalid = true;
      }
    });

    return invalid;
  }

  saveAll(submit: boolean): void {
    this.formSubmitted = true;

    if (!this.selectedDate) {
      return;
    }

    const editableEntries = this.entries.controls.filter((_, index) => this.canEditEntry(index));

    if (editableEntries.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Editable Entries',
        detail: 'There are no draft or rejected entries to save.',
        life: 3000
      });
      return;
    }

    if (this.hasInvalidEditableEntries()) {
      return;
    }

    this.saving = true;
    const dateStr = this.formatDate(this.selectedDate);

    const saveRequests: Observable<TimesheetEntry>[] = editableEntries.map((ctrl) => {
      const group = ctrl as FormGroup;
      const raw = group.getRawValue();
      const entryId = raw.id as number | null;

      const payload: TimesheetCreateRequest = {
        entry_date: dateStr,
        project_id: raw.project_id,
        task_description: raw.task_description,
        hours_worked: raw.hours_worked,
        start_time: this.formatTime(raw.start_time),
        end_time: this.formatTime(raw.end_time),
        category: raw.category,
        priority: raw.priority,
        notes: raw.notes ?? '',
        is_billable: raw.is_billable,
        client_name: raw.client_name ?? '',
      };

      if (entryId) {
        return submit
          ? this.timesheetService.updateAndSubmitEntry(entryId, payload)
          : this.timesheetService.updateEntry(entryId, payload);
      }

      return submit
        ? this.timesheetService.createAndSubmitEntry(payload)
        : this.timesheetService.createEntry(payload);
    });

    forkJoin(saveRequests).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: submit ? 'Submitted' : 'Saved',
          detail: submit
            ? 'Entries submitted successfully'
            : 'Entries saved as draft successfully',
          life: 3000
        });

        if (this.selectedDate) {
          this.loadEntriesForDate(this.selectedDate);
        }
      },
      error: (err) => {
        this.saving = false;
        const message = err?.error?.error?.message || err?.error?.message || 'Failed to save entries';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
          life: 4000
        });
      }
    });
  }

  private setupProjectAutoFill(group: FormGroup): void {
    const projectIdControl = group.get('project_id');
    const clientNameControl = group.get('client_name');

    projectIdControl?.valueChanges.subscribe((projectId: number) => {
      const project = this.projects.find((p) => p.id === projectId);
      clientNameControl?.setValue(project?.client_name ?? '', { emitEvent: false });
    });

    const initialProjectId = projectIdControl?.value;
    if (initialProjectId) {
      const project = this.projects.find((p) => p.id === initialProjectId);
      clientNameControl?.setValue(project?.client_name ?? '', { emitEvent: false });
    }
  }

  private setupHoursAutoCalculation(group: FormGroup): void {
    const startCtrl = group.get('start_time');
    const endCtrl = group.get('end_time');
    const hoursCtrl = group.get('hours_worked');

    const calculate = () => {
      const start = startCtrl?.value as Date | null;
      const end = endCtrl?.value as Date | null;

      if (!start || !end) {
        hoursCtrl?.setValue(null, { emitEvent: false });
        return;
      }

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      if (endMinutes <= startMinutes) {
        hoursCtrl?.setValue(null, { emitEvent: false });
        return;
      }

      const diffMinutes = endMinutes - startMinutes;
      const roundedHours = Math.round((diffMinutes / 60) * 4) / 4;
      hoursCtrl?.setValue(roundedHours, { emitEvent: false });
    };

    startCtrl?.valueChanges.subscribe(() => calculate());
    endCtrl?.valueChanges.subscribe(() => calculate());

    calculate();
  }

  private applyEditState(group: FormGroup): void {
    const status = group.get('status')?.getRawValue();

    if (status === 'submitted' || status === 'approved') {
      [
        'project_id',
        'task_description',
        'start_time',
        'end_time',
        'category',
        'priority',
        'notes',
        'is_billable',
      ].forEach((field) => {
        group.get(field)?.disable({ emitEvent: false });
      });
    }
  }

  private timeRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const start = control.get('start_time')?.value as Date | null;
      const end = control.get('end_time')?.value as Date | null;

      if (!start || !end) {
        return null;
      }

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      if (endMinutes <= startMinutes) {
        return { invalidTimeRange: true };
      }

      return null;
    };
  }

  private toTimeDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatTime(value: Date | string | null): string {
    if (!value) return '00:00';

    if (typeof value === 'string') {
      return value.length >= 5 ? value.slice(0, 5) : value;
    }

    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}