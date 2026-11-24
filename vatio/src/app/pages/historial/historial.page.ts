import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { serieDiaria, serieMensual, serieSemanal } from '../../core/calc';
import { GraficaBarrasComponent } from '../../shared/grafica-barras.component';

type Vista = 'dia' | 'semana' | 'mes';

/** Pantalla 5 — Historial con gráficas y lista de lecturas (RF09, RF10). */
@Component({
  selector: 'app-historial',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    GraficaBarrasComponent,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './historial.page.html',
})
export class HistorialPage {
  private data = inject(DataService);
  readonly vista = signal<Vista>('mes');
  vistaModelo: Vista = 'mes';

  readonly barras = computed(() => {
    const l = this.data.lecturas();
    const ahora = this.data.ahora();
    const c = this.data.config();
    switch (this.vista()) {
      case 'dia':
        return serieDiaria(l, ahora);
      case 'semana':
        return serieSemanal(l, ahora);
      default:
        return serieMensual(l, ahora, c?.diaInicio ?? 1);
    }
  });

  /** Línea de referencia: el límite mensual, o su equivalente por día o semana. */
  readonly referencia = computed(() => {
    const lim = this.data.config()?.limiteKwh ?? 0;
    const v = this.vista();
    return v === 'mes' ? lim : v === 'semana' ? (lim / 30) * 7 : lim / 30;
  });

  readonly etiquetaRef = computed(() => {
    const v = this.vista();
    const n = Math.round(this.referencia() * 10) / 10;
    return v === 'mes' ? `Límite ${n} kWh` : v === 'semana' ? `Meta semanal ${n} kWh` : `Meta diaria ${n} kWh`;
  });

  readonly unidad = computed(() => ({ dia: 'kWh por día', semana: 'kWh por semana', mes: 'kWh por periodo' })[this.vista()]);

  /** Lecturas de la más reciente a la más antigua, con el consumo respecto a la anterior. */
  readonly lista = computed(() => {
    const l = this.data.lecturas();
    return l
      .map((x, i) => ({ ...x, consumo: i > 0 ? x.valor - l[i - 1].valor : null }))
      .reverse();
  });

  cambiarVista(): void {
    this.vista.set(this.vistaModelo);
  }

  ionViewWillEnter(): void {
    this.data.refrescarHora();
  }
}
