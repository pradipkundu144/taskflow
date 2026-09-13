import { inject } from '@angular/core';
import {
  type CanMatchFn,
  Router,
  type UrlTree,
} from '@angular/router';
import type { Role } from '@taskflow/shared';
import { AuthStore } from './auth.store';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const store = inject(AuthStore);
  const router = inject(Router);
  return store.isAuthenticated() ? true : router.parseUrl('/login');
};

export const noAuthGuard: CanMatchFn = (): boolean | UrlTree => {
  const store = inject(AuthStore);
  const router = inject(Router);
  return store.isAuthenticated()
    ? router.parseUrl(homeForRole(store.role()))
    : true;
};

export function roleGuard(...allowed: Role[]): CanMatchFn {
  return (): boolean | UrlTree => {
    const store = inject(AuthStore);
    const router = inject(Router);
    if (!store.isAuthenticated()) return router.parseUrl('/login');
    const role = store.role();
    return role && allowed.includes(role) ? true : router.parseUrl('/403');
  };
}

export function homeForRole(role: Role | null): string {
  return role === 'admin' ? '/team' : '/tasks';
}
