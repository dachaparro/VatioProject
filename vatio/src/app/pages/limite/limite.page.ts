import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { AvisosService } from '../../core/avisos.service';
import { promedioPeriodosCompletos, subsistencia } from '../../core/calc';

/** Pantalla 6 — Límite mensual de kWh y avisos (RF05, RF06, RF07). Propuesta de la docente en el foro. */
@Component({
  selector: 'app-limite',
  imports: [
    DecimalPipe,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
  templateUrl: './limite.page.html',
  styles: `
    .stepper { display: flex; align-items: center; gap: 8px; padding: 0 16px; }
    .stepper ion-input { text-align: center; font-size: 1.8rem; font-weight: 700; }
  `,
})
export class LimitePage {
  private data = inject(DataService);
  private avisos = inject(AvisosService);
  private toast = inject(ToastController);

  limite = 130;
  a80 = true;
  a100 = true;
  proyeccion = true;

  readonly tarifa = computed(() => this.data.config()?.tarifa ?? 0);
  readonly subsistencia = computed(() => subsistencia(this.data.config()?.altitudAlta ?? true));
  readonly promedio = computed(() => {
    const c = this.data.config();
    const p = promedioPeriodosCompletos(this.data.lecturas(), this.data.ahora(), c?.diaInicio ?? 1);
    if (p !== null) return Math.round(p);
    const r = this.data.resumen();
    return r && !r.sinDatos ? Math.round(r.promedioDiario * 30) : null;
  });

  ionViewWillEnter(): void {
    this.data.refrescarHora();
    const c = this.data.config();
    if (!c) return;
    this.limite = c.limiteKwh;
    this.a80 = c.avisos.a80;
    this.a100 = c.avisos.a100;
    this.proyeccion = c.avisos.proyeccion;
  }

  cambiar(delta: number): void {
    this.limite = Math.max(5, Math.round((Number(this.limite) || 0) + delta));
  }

  usar(valor: number): void {
    this.limite = valor;
  }

  async guardar(): Promise<void> {
    const c = this.data.config();
    const lim = Number(this.limite);
    if (!c || !lim || lim <= 0) return;
    const cambioLimite = lim !== c.limiteKwh;
    await this.data.guardarConfig({ ...c, limiteKwh: lim, avisos: { a80: this.a80, a100: this.a100, proyeccion: this.proyeccion } });
    // Con un límite nuevo, los avisos del periodo vuelven a evaluarse desde cero.
    const e = this.data.estadoAvisos();
    if (cambioLimite && e) await this.data.guardarEstadoAvisos({ ...e, a80: false, a100: false, proyeccion: false });
    const t = await this.toast.create({ message: 'Límite guardado', duration: 1500, position: 'bottom', color: 'success' });
    await t.present();
    await this.avisos.pedirPermiso();
    await this.avisos.verificar();
  }
}
