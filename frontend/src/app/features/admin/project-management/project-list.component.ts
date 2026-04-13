import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectService } from '../../../core/services/project.service';
import { ClientService } from '../../../core/services/client.service';
import { Project, Client } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, TagModule,
    DialogModule, InputTextModule, DropdownModule, TooltipModule,
  ],
  template: `
    <div class="page-header flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h2>Project Management</h2>
        <div class="subtitle">Create and manage projects for timesheet tracking</div>
      </div>
      <div class="flex gap-2">
        <p-button label="Add Client" icon="pi pi-building" [outlined]="true" (onClick)="openClientForm()"></p-button>
        <p-button label="Add Project" icon="pi pi-plus" (onClick)="openProjectForm()" styleClass="shadow-2"></p-button>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="surface-card border-round-xl shadow-1">
      <p-table [value]="projects" [rowHover]="true" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 25%">Project Name</th>
            <th style="width: 15%">Code</th>
            <th style="width: 20%">Client</th>
            <th style="width: 10%">Status</th>
            <th style="width: 15%" class="text-center">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p let-i="rowIndex">
          <tr>
            <td class="text-500">{{ i + 1 }}</td>
            <td>
              <div class="flex align-items-center gap-2">
                <div class="flex align-items-center justify-content-center border-round-lg surface-200"
                     style="width: 32px; height: 32px;">
                  <i class="pi pi-folder text-primary text-sm"></i>
                </div>
                <span class="font-semibold text-900">{{ p.name }}</span>
              </div>
            </td>
            <td><code class="surface-100 px-2 py-1 border-round text-sm font-bold">{{ p.code }}</code></td>
            <td class="text-700">{{ p.client_name || '—' }}</td>
            <td>
              <p-tag [value]="p.is_active ? 'Active' : 'Inactive'"
                     [severity]="p.is_active ? 'success' : 'danger'" [rounded]="true"></p-tag>
            </td>
            <td class="text-center">
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info"
                        pTooltip="Edit" (onClick)="openProjectForm(p)"></p-button>
              <p-button icon="pi pi-ban" [rounded]="true" [text]="true" severity="danger"
                        [disabled]="!p.is_active" pTooltip="Deactivate" (onClick)="deactivateProject(p)"></p-button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6">
              <div class="flex flex-column align-items-center py-6 text-500">
                <i class="pi pi-folder-open text-4xl mb-3"></i>
                <span class="text-lg font-medium">No projects yet</span>
                <span class="text-sm mt-1">Create your first project to start tracking time</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Clients Section -->
    @if (clients.length) {
      <h3 class="text-900 mt-5 mb-3">Clients</h3>
      <div class="surface-card border-round-xl shadow-1">
        <p-table [value]="clients" [rowHover]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Client Name</th>
              <th style="width: 15%">Status</th>
              <th style="width: 15%" class="text-center">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td>
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-building text-500"></i>
                  <span class="font-medium text-900">{{ c.name }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="c.is_active ? 'Active' : 'Inactive'"
                       [severity]="c.is_active ? 'success' : 'danger'" [rounded]="true"></p-tag>
              </td>
              <td class="text-center">
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info"
                          pTooltip="Edit" (onClick)="openClientForm(c)"></p-button>
                <p-button icon="pi pi-ban" [rounded]="true" [text]="true" severity="danger"
                          [disabled]="!c.is_active" pTooltip="Deactivate" (onClick)="deactivateClient(c)"></p-button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- Project Form Dialog -->
    <p-dialog [header]="editingProject ? 'Edit Project' : 'New Project'" [(visible)]="projectFormVisible"
              [modal]="true" [style]="{ width: '480px' }" [draggable]="false">
      <form [formGroup]="projectForm" class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Project Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="name" placeholder="e.g. Mobile App" class="w-full">
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Project Code <span class="text-red-500">*</span></label>
          <input pInputText formControlName="code" placeholder="e.g. MOB-001" class="w-full" style="text-transform: uppercase;">
        </div>
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Client (optional)</label>
          <p-dropdown formControlName="client_id" [options]="clientOptions"
                      optionLabel="label" optionValue="value" placeholder="No client"
                      [showClear]="true" styleClass="w-full"></p-dropdown>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="projectFormVisible = false"></p-button>
        <p-button label="Save Project" icon="pi pi-check" [disabled]="projectForm.invalid"
                  [loading]="saving" (onClick)="saveProject()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- Client Form Dialog -->
    <p-dialog [header]="editingClient ? 'Edit Client' : 'New Client'" [(visible)]="clientFormVisible"
              [modal]="true" [style]="{ width: '400px' }" [draggable]="false">
      <form [formGroup]="clientForm" class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="font-semibold text-sm">Client Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="name" placeholder="e.g. Acme Corp" class="w-full">
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="clientFormVisible = false"></p-button>
        <p-button label="Save Client" icon="pi pi-check" [disabled]="clientForm.invalid"
                  [loading]="saving" (onClick)="saveClient()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  clients: Client[] = [];
  clientOptions: { label: string; value: number }[] = [];

  projectForm!: FormGroup;
  clientForm!: FormGroup;
  projectFormVisible = false;
  clientFormVisible = false;
  editingProject: Project | null = null;
  editingClient: Client | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private clientService: ClientService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      client_id: [null],
    });
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.projectService.getProjects().subscribe(p => this.projects = p);
    this.clientService.getClients().subscribe(c => {
      this.clients = c;
      this.clientOptions = c.map(cl => ({ label: cl.name, value: cl.id }));
    });
  }

  openProjectForm(project?: Project): void {
    this.editingProject = project || null;
    this.projectForm.reset({
      name: project?.name || '',
      code: project?.code || '',
      client_id: project?.client_id || null,
    });
    this.projectFormVisible = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid) return;
    this.saving = true;
    const data = this.projectForm.value;

    const req$ = this.editingProject
      ? this.projectService.updateProject(this.editingProject.id, data)
      : this.projectService.createProject(data);

    req$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: `Project ${this.editingProject ? 'updated' : 'created'}`, life: 2000 });
        this.projectFormVisible = false;
        this.saving = false;
        this.loadAll();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error?.message || 'Failed', life: 3000 });
      },
    });
  }

  deactivateProject(project: Project): void {
    this.confirmationService.confirm({
      message: `Deactivate project "${project.name}"?`,
      header: 'Deactivate Project',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.projectService.deleteProject(project.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Project deactivated', life: 2000 });
          this.loadAll();
        });
      },
    });
  }

  deactivateClient(client: Client): void {
    this.confirmationService.confirm({
      message: `Deactivate client "${client.name}"?`,
      header: 'Deactivate Client',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clientService.deleteClient(client.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Client deactivated', life: 2000 });
          this.loadAll();
        });
      },
    });
  }

  openClientForm(client?: Client): void {
    this.editingClient = client || null;
    this.clientForm.reset({ name: client?.name || '' });
    this.clientFormVisible = true;
  }

  saveClient(): void {
    if (this.clientForm.invalid) return;
    this.saving = true;
    const data = this.clientForm.value;

    const req$ = this.editingClient
      ? this.clientService.updateClient(this.editingClient.id, data)
      : this.clientService.createClient(data);

    req$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: `Client ${this.editingClient ? 'updated' : 'created'}`, life: 2000 });
        this.clientFormVisible = false;
        this.saving = false;
        this.loadAll();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error?.message || 'Failed', life: 3000 });
      },
    });
  }
}
