import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { TeamService } from '../../../core/services/team.service';
import { User } from '../../../core/models/user.model';
import { Team } from '../../../core/models/team.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, DropdownModule, ButtonModule, DividerModule],
  template: `
    <form [formGroup]="form" class="flex flex-column gap-3">
      @if (!isEdit) {
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Email <span class="text-red-500">*</span></label>
          <input pInputText formControlName="email" type="email" class="w-full" placeholder="user&#64;company.com">
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Password <span class="text-red-500">*</span></label>
          <p-password formControlName="password" [toggleMask]="true" [feedback]="false"
                      styleClass="w-full" inputStyleClass="w-full" placeholder="Min 8 characters"></p-password>
        </div>
      }

      <div class="flex gap-3">
        <div class="flex flex-column gap-2 flex-1">
          <label class="font-semibold text-sm">First Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="first_name" class="w-full">
        </div>
        <div class="flex flex-column gap-2 flex-1">
          <label class="font-semibold text-sm">Last Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="last_name" class="w-full">
        </div>
      </div>

      <div class="flex flex-column gap-2">
        <label class="font-semibold text-sm">Role <span class="text-red-500">*</span></label>
        <p-dropdown formControlName="role" [options]="roleOptions" optionLabel="label" optionValue="value"
                    styleClass="w-full"></p-dropdown>
      </div>

      <!-- Team Assignment -->
      <p-divider align="left"><span class="text-sm text-500 font-medium">Team Assignment</span></p-divider>

      <div class="flex flex-column gap-2">
        <label class="font-semibold text-sm">Assign to Team</label>
        <p-dropdown formControlName="team_id" [options]="teamOptions" optionLabel="label" optionValue="value"
                    placeholder="No team assigned" [showClear]="true" styleClass="w-full">
          <ng-template let-item pTemplate="item">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-users text-primary"></i>
              <div>
                <div class="font-medium">{{ item.label }}</div>
                <div class="text-xs text-500">Lead: {{ item.lead }}</div>
              </div>
            </div>
          </ng-template>
        </p-dropdown>
        <small class="text-500">
          The team lead of the selected team will review this user's timesheets.
        </small>
      </div>

      <div class="flex justify-content-end gap-2 mt-3">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="cancelled.emit()"></p-button>
        <p-button label="Save" icon="pi pi-check" [loading]="saving" [disabled]="form.invalid" (onClick)="save()"></p-button>
      </div>
    </form>
  `,
})
export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  isEdit = false;
  saving = false;
  teamOptions: { label: string; value: number; lead: string }[] = [];

  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Team Lead', value: 'team_lead' },
    { label: 'Employee', value: 'employee' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private teamService: TeamService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.user;

    this.form = this.fb.group({
      first_name: [this.user?.first_name || '', Validators.required],
      last_name: [this.user?.last_name || '', Validators.required],
      role: [this.user?.role || 'employee', Validators.required],
      team_id: [this.user?.team_id || null],
    });

    if (!this.isEdit) {
      this.form.addControl('email', this.fb.control('', [Validators.required, Validators.email]));
      this.form.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(8)]));
    }

    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teamOptions = teams.map(t => ({
          label: t.name,
          value: t.id,
          lead: t.lead_name,
        }));
      },
      error: () => {
        // Non-admin roles may not have access to teams list - ignore
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const request$ = this.isEdit
      ? this.userService.updateUser(this.user!.id, this.form.value)
      : this.userService.createUser(this.form.value);

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: `User ${this.isEdit ? 'updated' : 'created'}`, life: 2000 });
        this.saved.emit();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error?.message || 'Failed', life: 3000 });
      },
    });
  }
}
