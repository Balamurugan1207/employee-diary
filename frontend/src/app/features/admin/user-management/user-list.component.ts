import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UserFormComponent } from './user-form.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, DialogModule, AvatarModule, TooltipModule, UserFormComponent],
  template: `
    <div class="page-header flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h2>User Management</h2>
        <div class="subtitle">Manage system users, roles and team assignments</div>
      </div>
      <p-button label="Add User" icon="pi pi-user-plus" (onClick)="openForm()" styleClass="shadow-2"></p-button>
    </div>

    <div class="surface-card border-round-xl shadow-1">
      <p-table [value]="users" [paginator]="true" [rows]="20"
               [rowHover]="true" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Team</th>
            <th>Reports To</th>
            <th>Status</th>
            <th class="text-center">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr>
            <td>
              <div class="flex align-items-center gap-3">
                <p-avatar [label]="getInitials(u)" shape="circle"
                          [style]="{ 'background-color': getAvatarColor(u), color: 'white', 'font-weight': '600' }"></p-avatar>
                <span class="font-semibold text-900">{{ u.first_name }} {{ u.last_name }}</span>
              </div>
            </td>
            <td class="text-700">{{ u.email }}</td>
            <td>
              <p-tag [value]="formatRole(u.role)" [severity]="getRoleSeverity(u.role)" [rounded]="true"></p-tag>
            </td>
            <td>
              @if (u.team_name) {
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-users text-primary text-sm"></i>
                  <span class="text-700">{{ u.team_name }}</span>
                </div>
              } @else {
                <span class="text-400">—</span>
              }
            </td>
            <td>
              @if (u.lead_name) {
                <span class="text-700">{{ u.lead_name }}</span>
              } @else {
                <span class="text-400">—</span>
              }
            </td>
            <td>
              <p-tag [value]="u.is_active ? 'Active' : 'Inactive'"
                     [severity]="u.is_active ? 'success' : 'danger'" [rounded]="true"></p-tag>
            </td>
            <td class="text-center">
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info"
                        pTooltip="Edit" (onClick)="openForm(u)"></p-button>
              <p-button icon="pi pi-ban" [rounded]="true" [text]="true" severity="danger"
                        [disabled]="!u.is_active" pTooltip="Deactivate" (onClick)="deactivate(u)"></p-button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7">
              <div class="flex flex-column align-items-center py-6 text-500">
                <i class="pi pi-users text-4xl mb-3"></i>
                <span class="text-lg">No users found</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [header]="editingUser ? 'Edit User' : 'Create User'" [(visible)]="formVisible"
              [modal]="true" [style]="{ width: '540px' }" [draggable]="false" [resizable]="false">
      @if (formVisible) {
        <app-user-form [user]="editingUser" (saved)="onSaved()" (cancelled)="formVisible = false"></app-user-form>
      }
    </p-dialog>
  `,
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  formVisible = false;
  editingUser: User | null = null;

  constructor(
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers({ page: 1, per_page: 100 }).subscribe(data => {
      this.users = data.items;
    });
  }

  openForm(user?: User): void {
    this.editingUser = user || null;
    this.formVisible = true;
  }

  onSaved(): void {
    this.formVisible = false;
    this.loadUsers();
  }

  deactivate(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate ${user.first_name} ${user.last_name}?`,
      header: 'Deactivate User',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'User deactivated', life: 2000 });
          this.loadUsers();
        });
      },
    });
  }

  getInitials(u: User): string {
    return (u.first_name?.charAt(0) || '') + (u.last_name?.charAt(0) || '');
  }

  getAvatarColor(u: User): string {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#ec4899', '#6366f1'];
    return colors[u.id % colors.length];
  }

  formatRole(role: string): string {
    return role.replace('_', ' ');
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    return { admin: 'danger' as const, team_lead: 'info' as const, employee: 'success' as const }[role];
  }
}
