import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';

/** Pantalla 2 — Inicio: consumo vs. límite, proyección y factura (RF04, RF07, RF08). */
@Component({
  selector: 'app-inicio',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonProgressBar,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './inicio.page.html',
  styles: `
    .aviso { margin: 0 16px 16px; }
    .aviso ion-card-content { display: flex; gap: 12px; align-items: flex-start; }
    .aviso ion-icon { font-size: 1.5rem; flex-shrink: 0; }
    ion-progress-bar { height: 10px; border-radius: 5px; margin: 12px 0; }
    h2 { margin: 0; font-size: 1rem; font-weight: 600; }
  `,
})
export class InicioPage {
  readonly data = inject(DataService);
  readonly r = this.data.resumen;
  readonly config = this.data.config;

  readonly colorBarra = computed(() => {
    const pct = this.r()?.pct ?? 0;
    return pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'primary';
  });

  ionViewWillEnter(): void {
    this.data.refrescarHora();
  }
}
