import { Routes } from '@angular/router';
import { DiaryComponent } from './diary/diary.component';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { DailyEntriesComponent } from './daily-entries/daily-entries.component';
import { HistoryComponent } from './history/history.component';

export const EMPLOYEE_ROUTES: Routes = [
  { path: '', component: DiaryComponent },
  { path: 'entry', component: EntryFormComponent },
  { path: 'entry/:id', component: EntryFormComponent },
  { path: 'daily', component: DailyEntriesComponent },
  { path: 'history', component: HistoryComponent },
];
