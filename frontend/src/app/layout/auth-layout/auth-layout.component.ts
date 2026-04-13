import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <p-toast position="top-right"></p-toast>
    <div class="auth-wrapper">
      <!-- Left Panel - Branding -->
      <div class="auth-left">
        <div class="auth-left-content">
          <!-- Floating shapes background -->
          <div class="auth-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
          </div>

          <div class="auth-brand">
            <div class="brand-icon">
              <i class="pi pi-book"></i>
            </div>
            <h1>Employee Diary</h1>
            <p>Your daily work companion for seamless timesheet tracking, team collaboration, and productivity insights.</p>

            <div class="feature-list">
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-calendar"></i></div>
                <div>
                  <strong>Daily Tracking</strong>
                  <span>Log your activities with an intuitive calendar view</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-users"></i></div>
                <div>
                  <strong>Team Oversight</strong>
                  <span>Review and approve timesheets with one click</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-chart-line"></i></div>
                <div>
                  <strong>Smart Reports</strong>
                  <span>Gain insights with powerful analytics dashboards</span>
                </div>
              </div>
            </div>
          </div>

          <div class="auth-left-footer">
            &copy; 2026 Employee Diary &middot; Built for productive teams
          </div>
        </div>
      </div>

      <!-- Right Panel - Form -->
      <div class="auth-right">
        <div class="auth-right-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      min-height: 100vh;
    }

    /* --- Left Branding Panel --- */
    .auth-left {
      flex: 1;
      background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%);
      position: relative;
      overflow: hidden;
      display: none;
    }
    @media (min-width: 960px) {
      .auth-left { display: flex; }
    }

    .auth-left-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 4rem;
      height: 100%;
    }

    .auth-brand h1 {
      color: white;
      font-size: 2.2rem;
      font-weight: 800;
      margin: 1.5rem 0 0.75rem;
      letter-spacing: -0.5px;
    }
    .auth-brand p {
      color: rgba(255,255,255,0.7);
      font-size: 1.05rem;
      line-height: 1.7;
      margin: 0 0 2.5rem;
      max-width: 400px;
    }

    .brand-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-icon i {
      font-size: 1.8rem;
      color: white;
    }

    /* Feature list */
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .feature-icon i { color: #93c5fd; font-size: 1rem; }
    .feature-item strong {
      display: block;
      color: white;
      font-size: 0.95rem;
      margin-bottom: 2px;
    }
    .feature-item span {
      color: rgba(255,255,255,0.55);
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .auth-left-footer {
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
      margin-top: 3rem;
    }

    /* Floating shapes */
    .auth-shapes { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }
    .shape-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
    .shape-2 { width: 250px; height: 250px; bottom: 10%; left: -60px; background: rgba(99,102,241,0.15); }
    .shape-3 { width: 150px; height: 150px; top: 40%; right: 10%; background: rgba(59,130,246,0.1); }
    .shape-4 { width: 300px; height: 300px; bottom: -80px; right: 20%; background: rgba(255,255,255,0.02); }

    /* --- Right Form Panel --- */
    .auth-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 2rem;
    }
    @media (min-width: 960px) {
      .auth-right { max-width: 540px; }
    }

    .auth-right-content {
      width: 100%;
      max-width: 400px;
    }
  `],
})
export class AuthLayoutComponent {}
