import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TeamService } from '../../../core/services/team.service';
import { Team } from '../../../core/models/team.model';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, AvatarModule, TagModule],
  template: `
    <div class="page-header">
      <h2>Team Members</h2>
      <div class="subtitle">View your team composition</div>
    </div>

    @for (team of teams; track team.id) {
      <div class="surface-card border-round-xl shadow-1 mb-4 overflow-hidden">
        <div class="p-4 border-bottom-1 surface-border" style="background: linear-gradient(135deg, #f8fafc, #eef2ff);">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon purple"><i class="pi pi-users"></i></div>
            <div>
              <h3 class="m-0 text-900">{{ team.name }}</h3>
              <div class="text-sm text-500 mt-1">Lead: <strong>{{ team.lead_name }}</strong> · {{ team.members.length }} members</div>
            </div>
          </div>
        </div>
        <p-table [value]="team.members" [rowHover]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr><th>Member</th><th>Email</th></tr>
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
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="2" class="text-center p-4 text-500">No members in this team</td></tr>
          </ng-template>
        </p-table>
      </div>
    }
  `,
})
export class TeamMembersComponent implements OnInit {
  teams: Team[] = [];

  constructor(private teamService: TeamService) {}

  ngOnInit(): void {
    this.teamService.getTeams().subscribe(teams => this.teams = teams);
  }
}
