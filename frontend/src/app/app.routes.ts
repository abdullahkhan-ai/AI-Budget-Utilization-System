import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { Layout } from './layout/layout';

import { Dashboard } from './dashboard/dashboard';
import { Expenditures } from './expenditures/expenditures';
import { Budgets } from './budgets/budgets';
import { Departments } from './departments/departments';
import { Alerts } from './alerts/alerts';
import { Reports } from './reports/reports';
import { Admin } from './admin/admin';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  {
    path: 'login',
    component: Login,
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],

    children: [

      {
        path: 'dashboard',
        component: Dashboard,
      },

      {
        path: 'budgets',
        component: Budgets,
      },

      {
        path: 'expenditures',
        component: Expenditures,
      },

      {
        path: 'departments',
        component: Departments,
      },

      {
        path: 'alerts',
        component: Alerts,
      },

      {
        path: 'reports',
        component: Reports,
      },

      {
        path: 'admin',
        component: Admin,
        canActivate: [adminGuard],
      },

    ],
  },

  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: '/dashboard',
  },

];