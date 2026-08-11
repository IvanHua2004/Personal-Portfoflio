import { Routes } from '@angular/router';

/**
 * The site is a single page. Projects, About and Contact are sections of the
 * home route reached by fragment, and each project's whole write-up is on that
 * page — so there are no per-project routes to click through to. Old paths
 * redirect home so anything already shared still lands somewhere sensible.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Ivan Hua — Portfolio',
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
    title: 'Page not found',
  },
];
