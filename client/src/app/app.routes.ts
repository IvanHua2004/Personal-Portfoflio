import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Ivan Hua · Robotics, algorithms and AI',
    data: {
      description: 'Computer engineering student at Polytechnique Montreal, heading toward AI.',
    },
  },
  { path: 'projects', redirectTo: '', pathMatch: 'full' },
  { path: 'projects/:slug', redirectTo: '', pathMatch: 'full' },
  { path: 'about', redirectTo: '', pathMatch: 'full' },
  { path: 'contact', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Lost · Ivan Hua',
  },
];
