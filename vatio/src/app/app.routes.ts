import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { DataService } from './core/data.service';

/** Si el hogar no está configurado, envía a la configuración inicial (flujo: ¿Primer uso?). */
const configurado: CanActivateFn = async () => {
  const data = inject(DataService);
  const router = inject(Router);
  await data.whenReady();
  return data.config() ? true : router.parseUrl('/bienvenida');
};

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  {
    path: 'bienvenida',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'tabs',
    canActivate: [configurado],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage) },
      { path: 'historial', loadComponent: () => import('./pages/historial/historial.page').then((m) => m.HistorialPage) },
      { path: 'limite', loadComponent: () => import('./pages/limite/limite.page').then((m) => m.LimitePage) },
      { path: 'equipos', loadComponent: () => import('./pages/equipos/equipos.page').then((m) => m.EquiposPage) },
      { path: 'ajustes', loadComponent: () => import('./pages/ajustes/ajustes.page').then((m) => m.AjustesPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  {
    path: 'lectura/:id',
    canActivate: [configurado],
    loadComponent: () => import('./pages/lectura/lectura.page').then((m) => m.LecturaPage),
  },
  {
    path: 'equipo/:id',
    canActivate: [configurado],
    loadComponent: () => import('./pages/equipo/equipo.page').then((m) => m.EquipoPage),
  },
  { path: '**', redirectTo: 'tabs/inicio' },
];
