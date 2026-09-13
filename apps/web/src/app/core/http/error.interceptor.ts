import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../ui/toast.service';
import { isAuthEndpoint, toErrorMessage } from './error-message';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        const skip =
          isAuthEndpoint(req.url) || err.status === 401 || err.status === 422 || err.status === 400;
        if (!skip) {
          toast.error(toErrorMessage(err));
        }
      } else {
        toast.error('unexpected error');
      }
      return throwError(() => err);
    }),
  );
};
