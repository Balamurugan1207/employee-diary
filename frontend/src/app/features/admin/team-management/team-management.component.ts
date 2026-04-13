import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TeamService } from '../../../core/services/team.service';
import { UserService } from '../../../core/services/user.service';
import { Team } from '../../../core/models/team.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, TableModule, ButtonModule, TagModule,
    DialogModule, InputTextModule, DropdownModule, AvatarModule, TooltipModule,
  ],
  template: `
    <div class="page-header flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h2>Team Management</h2>
        <div class="subtitle">Create teams, assign leads, and manage members</div>
      </div>
      <p-button label="Create Team" icon="pi pi-plus" (onClick)="openTeamForm()" styleClass="shadow-2"></p-button>
    </div>

    @for (team of teams; track team.id) {
      <div class="surface-card border-round-xl shadow-1 mb-4 overflow-hidden">
        <!-- Team Header -->
        <div class="p-4 border-bottom-1 surface-border" style="background: linear-gradient(135deg, #f8fafc, #eef2ff);">
          <div class="flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon purple"><i class="pi pi-users"></i></div>
              <div>
                <h3 class="m-0 text-900">{{ team.name }}</h3>
                <div class="text-sm text-500 mt-1">
                  @if (team.lead_name) {
                    Lead: <strong class="text-primary">{{ team.lead_name }}</strong> &middot;
                  }
                  {{ team.members.length }} member{{ team.members.length !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <p-button icon="pi pi-user-plus" label="Add Member" [outlined]="true" size="small"
                        (onClick)="openAddMember(team)"></p-button>
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info"
                        pTooltip="Edit Team" (onClick)="openTeamForm(team)"></p-button>
              <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                        pTooltip="Delete Team" (onClick)="deleteTeam(team)"></p-button>
            </div>
          </div>
        </div>

        <!-- Members Table -->
        <p-table [value]="team.members" [rowHover]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th style="width: 10%" class="text-center">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td>
                <div class="flex align-items-center gap-3">
                  <p-avatar [label]="(m.first_name?.charAt(0) || '') + (m.last_name?.charAt(0) || '')"
                            shape="circle" [style]="{ 'background-color': '#6366f1', color: 'white', 'font-weight': '600', 'font-size': '0.8rem' }"></p-avatar>
                  <span class="font-medium text-900">{{ m.first_name }} {{ m.last_name }}</span>
                </div>
              </td>
              <td class="text-700">{{ m.email }}</td>
              <td class="text-center">
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                          pTooltip="Remove" (onClick)="removeMember(team, m)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="3" class="text-center py-4 text-500">
                <i class="pi pi-info-circle mr-2"></i>No members yet — click "Add Member" to assign employees
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    @if (teams.length === 0) {
      <div class="surface-card border-round-xl shadow-1 p-6 text-center">
        <i class="pi pi-users text-5xl text-300 mb-3"></i>
        <h3 class="text-900">No teams created</h3>
        <p class="text-500">Create a team first, then assign a team lead and add employee members.</p>
        <p-button label="Create Your First Team" icon="pi pi-plus" (onClick)="openTeamForm()"></p-button>
      </div>
    }

    <!-- Create/Edit Team Dialog -->
    <p-dialog [header]="editingTeam ? 'Edit Team' : 'Create Team'" [(visible)]="teamFormVisible"
              [modal]="true" [style]="{ width: '460px' }" [draggable]="false">
      <form [formGroup]="teamForm" class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Team Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="name" placeholder="e.g. Engineering" class="w-full">
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Team Lead <span class="text-400 font-normal">(optional)</span></label>
          <p-dropdown formControlName="lead_id" [options]="leadOptions" optionLabel="label" optionValue="value"
                      placeholder="Assign later" [showClear]="true" [filter]="true" filterPlaceholder="Search users..."
                      styleClass="w-full">
            <ng-template let-item pTemplate="item">
              <div class="flex align-items-center gap-2">
                <p-avatar [label]="item.initials" shape="circle" size="normal"
                          [style]="{ 'background-color': '#3b82f6', color: 'white', 'font-size': '0.75rem' }"></p-avatar>
                <div>
                  <div class="font-medium">{{ item.label }}</div>
                  <div class="text-xs text-500">{{ item.email }} &middot; {{ item.role }}</div>
                </div>
              </div>
            </ng-template>
          </p-dropdown>
          <small class="text-500">The lead can review and approve team members' timesheets. You can assign later.</small>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="teamFormVisible = false"></p-button>
        <p-button label="Save" icon="pi pi-check" [disabled]="teamForm.invalid" [loading]="saving"
                  (onClick)="saveTeam()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- Add Member Dialog -->
    <p-dialog header="Add Team Member" [(visible)]="addMemberVisible"
              [modal]="true" [style]="{ width: '420px' }" [draggable]="false">
      <div class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Select Employee</label>
          <p-dropdown [(ngModel)]="selectedUserId" [options]="availableUserOptions"
                      optionLabel="label" optionValue="value" placeholder="Choose an employee..."
                      [filter]="true" filterPlaceholder="Search..." styleClass="w-full">
            <ng-template let-item pTemplate="item">
              <div class="flex align-items-center gap-2">
                <p-avatar [label]="item.initials" shape="circle" size="normal"
                          [style]="{ 'background-color': '#22c55e', color: 'white', 'font-size': '0.75rem' }"></p-avatar>
                <div>
                  <div class="font-medium">{{ item.label }}</div>
                  <div class="text-xs text-500">{{ item.email }}</div>
                </div>
              </div>
            </ng-template>
          </p-dropdown>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="addMemberVisible = false"></p-button>
        <p-button label="Add to Team" icon="pi pi-user-plus" [disabled]="!selectedUserId" [loading]="saving"
                  (onClick)="confirmAddMember()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class TeamManagementComponent implements OnInit {
  teams: Team[] = [];
  allUsers: User[] = [];

  // Team form
  teamForm!: FormGroup;
  teamFormVisible = false;
  editingTeam: Team | null = null;
  leadOptions: { label: string; value: number; email: string; role: string; initials: string }[] = [];

  // Add member
  addMemberVisible = false;
  selectedTeam: Team | null = null;
  selectedUserId: number | null = null;
  availableUserOptions: { label: string; value: number; email: string; initials: string }[] = [];

  saving = false;

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      lead_id: [null],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.teamService.getTeams().subscribe(t => this.teams = t);
    this.userService.getUsers({ page: 1, per_page: 200 }).subscribe(data => {
      this.allUsers = data.items.filter((u: User) => u.is_active);
      this.leadOptions = this.allUsers
        .map((u: User) => ({
          label: `${u.first_name} ${u.last_name}`,
          value: u.id,
          email: u.email,
          role: u.role.replace('_', ' '),
          initials: (u.first_name?.charAt(0) || '') + (u.last_name?.charAt(0) || ''),
        }));
    });
  }

  openTeamForm(team?: Team): void {
    this.editingTeam = team || null;
    this.teamForm.reset({
      name: team?.name || '',
      lead_id: team?.lead_id || null,
    });
    this.teamFormVisible = true;
  }

  saveTeam(): void {
    if (this.teamForm.invalid) return;
    this.saving = true;

    const data = this.teamForm.value;
    const req$ = this.editingTeam
      ? this.teamService.updateTeam(this.editingTeam.id, data)
      : this.teamService.createTeam(data);

    req$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: `Team ${this.editingTeam ? 'updated' : 'created'}`, life: 2000 });
        this.teamFormVisible = false;
        this.saving = false;
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error?.message || 'Failed', life: 3000 });
      },
    });
  }

  openAddMember(team: Team): void {
    this.selectedTeam = team;
    this.selectedUserId = null;

    // Filter out users already in this team
    const memberIds = new Set(team.members.map(m => m.user_id));
    this.availableUserOptions = this.allUsers
      .filter((u: User) => !memberIds.has(u.id) && u.id !== team.lead_id)
      .map((u: User) => ({
        label: `${u.first_name} ${u.last_name}`,
        value: u.id,
        email: u.email,
        initials: (u.first_name?.charAt(0) || '') + (u.last_name?.charAt(0) || ''),
      }));

    this.addMemberVisible = true;
  }

  confirmAddMember(): void {
    if (!this.selectedTeam || !this.selectedUserId) return;
    this.saving = true;

    this.teamService.addMember(this.selectedTeam.id, this.selectedUserId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Member added to team', life: 2000 });
        this.addMemberVisible = false;
        this.saving = false;
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error?.message || 'Failed', life: 3000 });
      },
    });
  }

  deleteTeam(team: Team): void {
    this.confirmationService.confirm({
      message: `Delete team "${team.name}" and remove all memberships?`,
      header: 'Delete Team',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.teamService.deleteTeam(team.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Team deleted', life: 2000 });
          this.loadData();
        });
      },
    });
  }

  removeMember(team: Team, member: any): void {
    this.confirmationService.confirm({
      message: `Remove ${member.first_name} ${member.last_name} from ${team.name}?`,
      header: 'Remove Member',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.teamService.removeMember(team.id, member.user_id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Member removed', life: 2000 });
          this.loadData();
        });
      },
    });
  }
}
