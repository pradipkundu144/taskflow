import { Route } from '@angular/router';

export const tasksRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./tasks.page').then((m) => m.TasksPage),
  },
];
