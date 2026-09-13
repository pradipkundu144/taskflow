import { Route } from '@angular/router';
import { noAuthGuard } from '../../core/auth/auth.guard';

export const authRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canMatch: [noAuthGuard],
    loadComponent: () => import('./login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canMatch: [noAuthGuard],
    loadComponent: () => import('./register.page').then((m) => m.RegisterPage),
  },
];
