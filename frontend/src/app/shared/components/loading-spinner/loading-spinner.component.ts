import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="flex justify-content-center p-4">
      <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }"></p-progressSpinner>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
