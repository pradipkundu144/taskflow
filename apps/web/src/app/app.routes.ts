import { inject } from '@angular/core';
import { type Route, Router } from '@angular/router';
import { authGuard, homeForRole, roleGuard } from './core/auth/auth.guard';
import { AuthStore } from './core/auth/auth.store';
import { Shell } from './layout/shell';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/errors/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: '',
    component: Shell,
    canMatch: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const role = inject(AuthStore).role();
          return inject(Router).parseUrl(homeForRole(role));
        },
      },
      {
        path: 'tasks',
        canMatch: [roleGuard('manager', 'teamLead', 'employee')],
        loadChildren: () =>
          import('./features/tasks/tasks.routes').then((m) => m.tasksRoutes),
      },
      {
        path: 'team',
        canMatch: [roleGuard('admin')],
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      { path: 'users', pathMatch: 'full', redirectTo: 'team' },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found.page').then((m) => m.NotFoundPage),
  },
];
