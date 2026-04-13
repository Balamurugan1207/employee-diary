import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WebhookService } from '../../../core/services/webhook.service';
import { WebhookConfig } from '../../../core/models/webhook.model';

@Component({
  selector: 'app-webhook-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, TagModule,
    DialogModule, InputTextModule, CheckboxModule, InputSwitchModule, TooltipModule,
  ],
  template: `
    <div class="flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">Webhook Configuration</h2>
      <p-button label="Add Webhook" icon="pi pi-plus" (onClick)="openForm()"></p-button>
    </div>

    <p-table [value]="webhooks" styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th>URL</th>
          <th>Events</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-w>
        <tr>
          <td class="max-w-20rem overflow-hidden text-overflow-ellipsis white-space-nowrap">{{ w.url }}</td>
          <td>
            @for (event of w.events; track event) {
              <p-tag [value]="event" styleClass="mr-1 mb-1" severity="info"></p-tag>
            }
          </td>
          <td>
            <p-inputSwitch [(ngModel)]="w.is_active" (onChange)="toggleActive(w)"></p-inputSwitch>
          </td>
          <td>
            <p-button icon="pi pi-play" [rounded]="true" [text]="true" pTooltip="Test" (onClick)="testWebhook(w)"></p-button>
            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" pTooltip="Edit" (onClick)="openForm(w)"></p-button>
            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" (onClick)="deleteWebhook(w)"></p-button>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="4" class="text-center p-4 text-500">No webhooks configured</td></tr>
      </ng-template>
    </p-table>

    <p-dialog [header]="editingWebhook ? 'Edit Webhook' : 'Add Webhook'" [(visible)]="formVisible" [modal]="true" [style]="{ width: '500px' }">
      <form [formGroup]="form" class="flex flex-column gap-3">
        <div class="flex flex-column gap-2">
          <label>Webhook URL</label>
          <input pInputText formControlName="url" placeholder="https://example.com/webhook" class="w-full">
        </div>
        <div class="flex flex-column gap-2">
          <label>Secret (optional)</label>
          <input pInputText formControlName="secret" placeholder="HMAC signing secret" class="w-full">
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-bold">Events</label>
          <div class="flex flex-column gap-2">
            @for (evt of availableEvents; track evt.value) {
              <div class="flex align-items-center gap-2">
                <p-checkbox [value]="evt.value" [(ngModel)]="selectedEvents" [ngModelOptions]="{standalone: true}"
                            [inputId]="evt.value"></p-checkbox>
                <label [for]="evt.value">{{ evt.label }}</label>
              </div>
            }
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" (onClick)="formVisible = false"></p-button>
        <p-button label="Save" icon="pi pi-check" [disabled]="form.invalid || selectedEvents.length === 0"
                  (onClick)="saveWebhook()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class WebhookConfigComponent implements OnInit {
  webhooks: WebhookConfig[] = [];
  formVisible = false;
  editingWebhook: WebhookConfig | null = null;
  form!: FormGroup;
  selectedEvents: string[] = [];

  availableEvents = [
    { label: 'Timesheet Submitted', value: 'timesheet.submitted' },
    { label: 'Timesheet Approved', value: 'timesheet.approved' },
    { label: 'Timesheet Rejected', value: 'timesheet.rejected' },
    { label: 'Missed Entry Reminder', value: 'missed_entry.reminder' },
  ];

  constructor(
    private fb: FormBuilder,
    private webhookService: WebhookService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      url: ['', Validators.required],
      secret: [''],
    });
  }

  ngOnInit(): void {
    this.loadWebhooks();
  }

  loadWebhooks(): void {
    this.webhookService.getWebhooks().subscribe(w => this.webhooks = w);
  }

  openForm(webhook?: WebhookConfig): void {
    this.editingWebhook = webhook || null;
    this.form.reset({ url: webhook?.url || '', secret: '' });
    this.selectedEvents = webhook?.events ? [...webhook.events] : [];
    this.formVisible = true;
  }

  saveWebhook(): void {
    const data = { ...this.form.value, events: this.selectedEvents };
    const req$ = this.editingWebhook
      ? this.webhookService.updateWebhook(this.editingWebhook.id, data)
      : this.webhookService.createWebhook(data);

    req$.subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Webhook saved', life: 2000 });
      this.formVisible = false;
      this.loadWebhooks();
    });
  }

  testWebhook(webhook: WebhookConfig): void {
    this.webhookService.testWebhook(webhook.id).subscribe(result => {
      const severity = result.success ? 'success' : 'error';
      const msg = result.success ? 'Test successful!' : `Test failed: ${result.response_status}`;
      this.messageService.add({ severity, summary: 'Webhook Test', detail: msg, life: 3000 });
    });
  }

  toggleActive(webhook: WebhookConfig): void {
    this.webhookService.updateWebhook(webhook.id, { is_active: webhook.is_active }).subscribe();
  }

  deleteWebhook(webhook: WebhookConfig): void {
    this.confirmationService.confirm({
      message: `Delete webhook for ${webhook.url}?`,
      header: 'Delete Webhook',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.webhookService.deleteWebhook(webhook.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Webhook deleted', life: 2000 });
          this.loadWebhooks();
        });
      },
    });
  }
}
