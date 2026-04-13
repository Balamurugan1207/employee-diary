import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputTextModule, PasswordModule, ButtonModule, CheckboxModule],
  template: `
    <!-- Mobile-only logo -->
    <div class="flex align-items-center gap-3 mb-5 lg:hidden">
      <div class="flex align-items-center justify-content-center border-round-xl"
           style="width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #7c3aed);">
        <i class="pi pi-book text-white text-xl"></i>
      </div>
      <div>
        <div class="text-xl font-bold text-900">Employee Diary</div>
        <div class="text-xs text-500">Timesheet Management</div>
      </div>
    </div>

    <div class="mb-5">
      <h2 class="text-900 font-bold text-3xl mt-0 mb-2">Welcome back</h2>
      <p class="text-500 m-0 text-base line-height-3">Enter your credentials to access your account</p>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-column gap-4">
      <div class="flex flex-column gap-2">
        <label for="email" class="font-semibold text-800 text-sm">EMAIL ADDRESS</label>
        <div class="p-input-icon-left w-full">
          <i class="pi pi-at"></i>
          <input id="email" pInputText formControlName="email"
                 class="w-full py-3 pl-5 border-round-lg"
                 placeholder="name&#64;company.com">
        </div>
        @if (form.get('email')?.dirty && form.get('email')?.hasError('email')) {
          <small class="text-red-500 flex align-items-center gap-1">
            <i class="pi pi-exclamation-circle text-xs"></i> Please enter a valid email address
          </small>
        }
      </div>

      <div class="flex flex-column gap-2">
        <label for="password" class="font-semibold text-800 text-sm">PASSWORD</label>
        <p-password id="password" formControlName="password" [toggleMask]="true"
                    [feedback]="false" styleClass="w-full"
                    inputStyleClass="w-full py-3 border-round-lg"
                    placeholder="Enter your password"></p-password>
      </div>

      <div class="flex align-items-center gap-2">
        <p-checkbox [(ngModel)]="rememberMe" [ngModelOptions]="{ standalone: true }"
                    [binary]="true" inputId="remember"></p-checkbox>
        <label for="remember" class="text-sm text-700 cursor-pointer">Remember me on this device</label>
      </div>

      <p-button type="submit" [loading]="loading" [disabled]="form.invalid"
                styleClass="w-full py-3 font-bold text-base border-round-lg shadow-3">
        <ng-template pTemplate="content">
          <span class="flex align-items-center justify-content-center gap-2 w-full">
            @if (!loading) { <i class="pi pi-sign-in"></i> }
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </span>
        </ng-template>
      </p-button>
    </form>
  `,
  styles: [`
    :host ::ng-deep .p-password-input { padding-left: 1rem !important; }
    :host ::ng-deep .p-button.shadow-3 {
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      transition: box-shadow 0.2s ease, transform 0.15s ease;
    }
    :host ::ng-deep .p-button.shadow-3:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
      transform: translateY(-1px);
    }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Welcome!', detail: `Signed in as ${res.user.first_name}`, life: 2000 });
        this.router.navigate(['/diary']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error?.message || 'Invalid credentials';
        this.messageService.add({ severity: 'error', summary: 'Sign In Failed', detail: msg, life: 4000 });
      },
    });
  }
}
