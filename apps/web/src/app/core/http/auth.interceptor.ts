import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { API_PATHS } from '@taskflow/shared';
import { AuthStore } from '../auth/auth.store';

const AUTH_PATHS = new Set<string>([
  API_PATHS.auth.login,
  API_PATHS.auth.register,
  API_PATHS.auth.refresh,
  API_PATHS.auth.logout,
]);

let refreshInFlight: Promise<string> | null = null;

type Store = ReturnType<typeof injectStore>;
function injectStore() {
  return inject(AuthStore);
}

function withAuthHeader<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function refreshOnce(store: Store): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      await store.hydrate();
      const token = store.accessToken();
      if (!token) throw new Error('refresh failed');
      return token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = injectStore();
  const isAuthPath = AUTH_PATHS.has(req.url);
  const token = store.accessToken();
  const first = !isAuthPath && token ? withAuthHeader(req, token) : req;

  return next(first).pipe(
    catchError((err) => {
      const shouldTryRefresh =
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isAuthPath &&
        store.accessToken() !== null;
      if (!shouldTryRefresh) {
        return throwError(() => err);
      }
      return from(refreshOnce(store)).pipe(
        switchMap((newToken) => next(withAuthHeader(req, newToken))),
        catchError((refreshErr) => {
          store.clear();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
