import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { kwhEquipo } from '../../core/calc';

/** Pantalla 7 — Calculadora de consumo por electrodoméstico (RF11). */
@Component({
  selector: 'app-equipos',
  imports: [
    DecimalPipe,
    RouterLink,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './equipos.page.html',
  styles: `
    ion-progress-bar { margin-top: 6px; height: 4px; border-radius: 2px; }
    .derecha { text-align: right; }
  `,
})
export class EquiposPage {
  private data = inject(DataService);
  readonly tarifa = computed(() => this.data.config()?.tarifa ?? 0);

  /** Equipos ordenados de mayor a menor consumo mensual. */
  readonly lista = computed(() => {
    const items = this.data.equipos().map((e) => ({ ...e, kwh: kwhEquipo(e) }));
    const max = Math.max(1, ...items.map((e) => e.kwh));
    return items.sort((a, b) => b.kwh - a.kwh).map((e) => ({ ...e, proporcion: e.kwh / max }));
  });

  readonly total = computed(() => this.lista().reduce((s, e) => s + e.kwh, 0));
}
