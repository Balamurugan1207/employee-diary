import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastModule, NavbarComponent, SidebarComponent, ConfirmDialogComponent],
  template: `
    <p-toast position="top-right"></p-toast>
    <app-confirm-dialog></app-confirm-dialog>
    <div class="flex flex-column h-screen">
      <app-navbar (toggleSidenav)="sidebarVisible = !sidebarVisible"></app-navbar>
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <div class="surface-card border-right-1 surface-border overflow-y-auto flex-shrink-0"
             [style.width.px]="sidebarVisible ? 260 : 0"
             [style.opacity]="sidebarVisible ? 1 : 0"
             style="transition: width 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;">
          @if (sidebarVisible) {
            <app-sidebar></app-sidebar>
          }
        </div>
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto" style="background: #f1f5f9;">
          <div class="p-4 md:p-5 max-w-80rem mx-auto">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  sidebarVisible = true;
}
