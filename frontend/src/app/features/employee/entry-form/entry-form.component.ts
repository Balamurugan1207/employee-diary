import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { TimesheetService } from '../../../core/services/timesheet.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, InputTextModule, InputTextareaModule,
    InputNumberModule, DropdownModule, CalendarModule, CheckboxModule,
    ButtonModule, CardModule, MessageModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ isEdit ? 'Edit' : 'New' }} Timesheet Entry</h2>
      <div class="subtitle">{{ isEdit ? 'Update your existing entry' : 'Record your daily work activity' }}</div>
    </div>

    @if (projectsLoaded && projectOptions.length === 0) {
      <p-message severity="warn" styleClass="mb-4 w-full"
                 text="No projects available. Ask your admin to create projects first."></p-message>
    }

    <div class="surface-card border-round-xl shadow-1 p-5 max-w-50rem mx-auto">
      <form [formGroup]="form" class="flex flex-column gap-4">
        <!-- Date & Project -->
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">DATE <span class="text-red-500">*</span></label>
              <p-calendar formControlName="entry_date" [showIcon]="true" dateFormat="yy-mm-dd"
                          styleClass="w-full" placeholder="Select date" [showOnFocus]="false"></p-calendar>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">PROJECT <span class="text-red-500">*</span></label>
              <p-dropdown formControlName="project_id" [options]="projectOptions"
                          optionLabel="label" optionValue="value" placeholder="Select project"
                          [filter]="true" filterPlaceholder="Search projects..."
                          styleClass="w-full"></p-dropdown>
            </div>
          </div>
        </div>

        <!-- Task Description -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-800 text-sm">TASK DESCRIPTION <span class="text-red-500">*</span></label>
          <textarea pInputTextarea formControlName="task_description" rows="3"
                    placeholder="What did you work on? (minimum 10 characters)" class="w-full"></textarea>
          @if (form.get('task_description')?.dirty && form.get('task_description')?.hasError('minlength')) {
            <small class="text-red-500">Minimum 10 characters required</small>
          }
        </div>

        <!-- Time & Hours -->
        <div class="grid">
          <div class="col-12 md:col-4">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">START TIME <span class="text-red-500">*</span></label>
              <p-calendar formControlName="start_time" [timeOnly]="true" [showIcon]="true"
                          icon="pi pi-clock" styleClass="w-full" placeholder="HH:MM"
                          hourFormat="24"></p-calendar>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">END TIME <span class="text-red-500">*</span></label>
              <p-calendar formControlName="end_time" [timeOnly]="true" [showIcon]="true"
                          icon="pi pi-clock" styleClass="w-full" placeholder="HH:MM"
                          hourFormat="24"></p-calendar>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">HOURS WORKED <span class="text-red-500">*</span></label>
              <p-inputNumber formControlName="hours_worked" [min]="0.25" [max]="24"
                             [step]="0.25" [minFractionDigits]="1" [maxFractionDigits]="2"
                             mode="decimal" styleClass="w-full" placeholder="0.00"
                             suffix="h"></p-inputNumber>
            </div>
          </div>
        </div>

        <!-- Category & Priority -->
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">CATEGORY <span class="text-red-500">*</span></label>
              <p-dropdown formControlName="category" [options]="categories"
                          optionLabel="label" optionValue="value" placeholder="Select category"
                          styleClass="w-full"></p-dropdown>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">PRIORITY</label>
              <p-dropdown formControlName="priority" [options]="priorities"
                          optionLabel="label" optionValue="value" styleClass="w-full"></p-dropdown>
            </div>
          </div>
        </div>

        <!-- Client & Billable -->
        <div class="grid align-items-end">
          <div class="col-12 md:col-8">
            <div class="flex flex-column gap-2">
              <label class="font-semibold text-800 text-sm">CLIENT NAME <span class="text-400 font-normal text-xs">(auto-filled from project)</span></label>
              <input pInputText formControlName="client_name" placeholder="Auto-filled or type manually" class="w-full">
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="flex align-items-center gap-2 pb-1">
              <p-checkbox formControlName="is_billable" [binary]="true" inputId="billable"></p-checkbox>
              <label for="billable" class="font-medium cursor-pointer">Billable hours</label>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-800 text-sm">NOTES</label>
          <textarea pInputTextarea formControlName="notes" rows="2" placeholder="Any additional notes..." class="w-full"></textarea>
        </div>

        <!-- Validation summary -->
        @if (form.invalid && formSubmitted) {
          <p-message severity="error" styleClass="w-full"
                     text="Please fill all required fields marked with * before saving."></p-message>
        }

        <!-- Actions -->
        <div class="flex justify-content-between align-items-center border-top-1 surface-border pt-4 mt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" icon="pi pi-arrow-left" (onClick)="goBack()"></p-button>
          <div class="flex gap-2">
            <p-button label="Save as Draft" [outlined]="true" severity="secondary" icon="pi pi-save"
                      [loading]="saving" (onClick)="save(false)"></p-button>
            <p-button label="Save & Submit" icon="pi pi-send" [loading]="saving"
                      (onClick)="save(true)"></p-button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class EntryFormComponent implements OnInit {
  form!: FormGroup;
  projects: Project[] = [];
  projectOptions: { label: string; value: number }[] = [];
  projectsLoaded = false;
  isEdit = false;
  entryId: number | null = null;
  saving = false;
  formSubmitted = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      entry_date: [null, Validators.required],
      project_id: [null, Validators.required],
      task_description: ['', [Validators.required, Validators.minLength(10)]],
      hours_worked: [null, [Validators.required, Validators.min(0.25), Validators.max(24)]],
      start_time: [null, Validators.required],
      end_time: [null, Validators.required],
      category: [null, Validators.required],
      priority: ['medium', Validators.required],
      notes: [''],
      is_billable: [true],
      client_name: [''],
    });

    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.projectOptions = projects.map(p => ({ label: `${p.name} (${p.code})`, value: p.id }));
      this.projectsLoaded = true;
    });

    // Auto-fill client name when project changes
    this.form.get('project_id')?.valueChanges.subscribe(projectId => {
      if (projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project?.client_name) {
          this.form.patchValue({ client_name: project.client_name }, { emitEvent: false });
        }
      }
    });

    const date = this.route.snapshot.queryParams['date'];
    if (date) {
      this.form.patchValue({ entry_date: new Date(date) });
    }

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.entryId = +id;
      this.timesheetService.getEntry(this.entryId).subscribe(entry => {
        this.form.patchValue({
          ...entry,
          entry_date: new Date(entry.entry_date),
          start_time: this.parseTime(entry.start_time),
          end_time: this.parseTime(entry.end_time),
        });
      });
    }
  }

  save(andSubmit: boolean): void {
    this.formSubmitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    const formVal = this.form.value;
    const data: any = {
      entry_date: this.formatDate(formVal.entry_date),
      project_id: formVal.project_id,
      task_description: formVal.task_description,
      hours_worked: formVal.hours_worked,
      start_time: this.formatTime(formVal.start_time),
      end_time: this.formatTime(formVal.end_time),
      category: formVal.category,
      priority: formVal.priority,
      notes: formVal.notes || '',
      is_billable: formVal.is_billable,
      client_name: formVal.client_name || '',
    };

    const request$ = this.isEdit
      ? this.timesheetService.updateEntry(this.entryId!, data)
      : this.timesheetService.createEntry(data);

    request$.subscribe({
      next: (entry) => {
        if (andSubmit) {
          this.timesheetService.submitEntry(entry.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Entry submitted for approval!', life: 2000 });
              this.router.navigate(['/diary']);
            },
            error: (err) => {
              this.saving = false;
              const msg = err.error?.error?.message || 'Saved but failed to submit';
              this.messageService.add({ severity: 'warn', summary: 'Partial Success', detail: msg, life: 3000 });
            },
          });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Entry saved as draft', life: 2000 });
          this.router.navigate(['/diary']);
        }
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.error?.message || 'Failed to save entry';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/diary']);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private formatTime(date: Date | string | null): string {
    if (!date) return '00:00';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private parseTime(timeStr: string): Date | null {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return d;
  }
}
