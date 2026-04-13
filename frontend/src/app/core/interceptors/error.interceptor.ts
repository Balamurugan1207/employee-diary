import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 403) {
        messageService.add({ severity: 'error', summary: 'Access Denied', detail: 'You do not have permission', life: 3000 });
      } else if (err.status >= 500) {
        messageService.add({ severity: 'error', summary: 'Server Error', detail: 'Please try again', life: 3000 });
      }
      return throwError(() => err);
    })
  );
};
