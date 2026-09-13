import { Route } from '@angular/router';

export const usersRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./team-shell.component').then((m) => m.TeamShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./users.page').then((m) => m.UsersPage),
      },
      {
        path: 'managers',
        loadComponent: () => import('./managers-tab.component').then((m) => m.ManagersTab),
      },
      {
        path: 'team-leads',
        loadComponent: () => import('./team-leads-tab.component').then((m) => m.TeamLeadsTab),
      },
      {
        path: 'employees',
        loadComponent: () => import('./employees-tab.component').then((m) => m.EmployeesTab),
      },
    ],
  },
];
