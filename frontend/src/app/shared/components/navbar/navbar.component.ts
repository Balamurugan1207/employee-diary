import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, AsyncPipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, AsyncPipe, UpperCasePipe, ReactiveFormsModule,
    ButtonModule, AvatarModule, OverlayPanelModule, RippleModule,
    DividerModule, DialogModule, PasswordModule,
  ],
  template: `
    <div class="flex align-items-center justify-content-between px-4 py-2 shadow-2"
         style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); min-height: 56px;">
      <div class="flex align-items-center gap-3">
        <button pButton pRipple icon="pi pi-bars"
                class="p-button-rounded p-button-text text-white hover:bg-white-alpha-20"
                (click)="toggleSidenav.emit()"></button>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-book text-white text-xl"></i>
          <span class="text-white text-xl font-bold">Employee Diary</span>
        </div>
      </div>

      @if (authService.currentUser$ | async; as user) {
        <div class="flex align-items-center gap-3">
          <span class="hidden md:inline text-white-alpha-80 text-sm">
            {{ greeting() }}
          </span>
          <div class="flex align-items-center gap-2 cursor-pointer px-3 py-2 border-round-lg hover:bg-white-alpha-10"
               (click)="op.toggle($event)">
            <p-avatar [label]="getInitials(user.first_name, user.last_name)"
                      shape="circle" size="normal"
                      [style]="{ 'background-color': '#60a5fa', color: 'white', 'font-weight': '600' }"></p-avatar>
            <div class="hidden md:block">
              <div class="text-white font-semibold text-sm line-height-2">{{ user.first_name }} {{ user.last_name }}</div>
              <div class="text-white-alpha-70 text-xs">{{ user.role.replace('_', ' ') | uppercase }}</div>
            </div>
            <i class="pi pi-chevron-down text-white-alpha-70 text-xs ml-1"></i>
          </div>

          <p-overlayPanel #op>
            <div class="flex flex-column" style="min-width: 220px;">
              <div class="flex align-items-center gap-3 px-3 py-2">
                <p-avatar [label]="getInitials(user.first_name, user.last_name)"
                          shape="circle" size="large"
                          [style]="{ 'background-color': '#3b82f6', color: 'white', 'font-weight': '600' }"></p-avatar>
                <div>
                  <div class="font-bold text-900">{{ user.first_name }} {{ user.last_name }}</div>
                  <div class="text-sm text-500">{{ user.email }}</div>
                </div>
              </div>
              <p-divider styleClass="my-1"></p-divider>
              <div class="px-1">
                <a class="flex align-items-center gap-2 p-3 border-round cursor-pointer text-700 hover:surface-100 no-underline transition-colors transition-duration-200"
                   (click)="openChangePassword(); op.hide()">
                  <i class="pi pi-lock"></i>
                  <span>Change Password</span>
                </a>
                <a class="flex align-items-center gap-2 p-3 border-round cursor-pointer text-700 hover:surface-100 no-underline transition-colors transition-duration-200"
                   (click)="authService.logout(); op.hide()">
                  <i class="pi pi-sign-out"></i>
                  <span>Sign Out</span>
                </a>
              </div>
            </div>
          </p-overlayPanel>
        </div>
      }
    </div>

    <!-- Change Password Dialog -->
    <p-dialog header="Change Password" [(visible)]="pwDialogVisible" [modal]="true"
              [style]="{ width: '400px' }" [draggable]="false">
      <form [formGroup]="pwForm" class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Current Password <span class="text-red-500">*</span></label>
          <p-password formControlName="oldPassword" [toggleMask]="true" [feedback]="false"
                      placeholder="Enter current password" styleClass="w-full" inputStyleClass="w-full"></p-password>
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">New Password <span class="text-red-500">*</span></label>
          <p-password formControlName="newPassword" [toggleMask]="true" [feedback]="true"
                      placeholder="Min 8 characters" styleClass="w-full" inputStyleClass="w-full"></p-password>
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Confirm New Password <span class="text-red-500">*</span></label>
          <p-password formControlName="confirmPassword" [toggleMask]="true" [feedback]="false"
                      placeholder="Re-enter new password" styleClass="w-full" inputStyleClass="w-full"></p-password>
        </div>
        @if (pwForm.hasError('mismatch')) {
          <small class="text-red-500">Passwords do not match</small>
        }
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="pwDialogVisible = false"></p-button>
        <p-button label="Change Password" icon="pi pi-check" [disabled]="pwForm.invalid"
                  [loading]="pwSaving" (onClick)="submitChangePassword()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class NavbarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  pwDialogVisible = false;
  pwSaving = false;
  pwForm: FormGroup;

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
  ) {
    this.pwForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const pw = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    if (pw && confirm && pw !== confirm) {
      return { mismatch: true };
    }
    return null;
  }

  openChangePassword(): void {
    this.pwForm.reset();
    this.pwDialogVisible = true;
  }

  submitChangePassword(): void {
    if (this.pwForm.invalid) return;
    this.pwSaving = true;
    const { oldPassword, newPassword } = this.pwForm.value;
    this.authService.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Password changed successfully', life: 2000 });
        this.pwDialogVisible = false;
        this.pwSaving = false;
      },
      error: (err) => {
        this.pwSaving = false;
        const msg = err.error?.error?.message || 'Failed to change password';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
      },
    });
  }

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
