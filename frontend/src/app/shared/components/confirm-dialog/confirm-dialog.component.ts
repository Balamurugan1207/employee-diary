import { Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ConfirmDialogModule],
  template: `<p-confirmDialog></p-confirmDialog>`,
})
export class ConfirmDialogComponent {}
