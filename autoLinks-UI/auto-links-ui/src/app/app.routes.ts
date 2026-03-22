import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./views/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./views/auth/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    data: {
      pageTitle: 'Dashboard',
      pageSubtitle: 'Manage your automation pipelines',
    },
  },
  {
    path: 'pipelines/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/pipeline/create-pipeline/create-pipeline.component').then(
        (m) => m.CreatePipelineComponent,
      ),
    data: {
      pageTitle: 'Create Pipeline',
      pageSubtitle: 'Set up a new automation pipeline with subscribers',
      backLink: '/dashboard',
    },
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
