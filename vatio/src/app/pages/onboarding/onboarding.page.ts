import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { AvisosService } from '../../core/avisos.service';
import { nuevoId, subsistencia, toLocalIso } from '../../core/calc';

/** Pantalla 1 — Configuración inicial (RF01, RF05). Solo aparece en el primer uso. */
@Component({
  selector: 'app-onboarding',
  imports: [
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './onboarding.page.html',
})
export class OnboardingPage {
  private data = inject(DataService);
  private avisos = inject(AvisosService);
  private router = inject(Router);

  readonly dias = Array.from({ length: 28 }, (_, i) => i + 1);

  tarifa: number | null = null;
  diaInicio = 1;
  altitud: 'baja' | 'alta' = 'alta';
  lectura: number | null = null;
  limite: number | null = 130;
  private limiteTocado = false;

  readonly error = signal('');
  readonly guardando = signal(false);

  cambiarAltitud(): void {
    if (!this.limiteTocado) this.limite = subsistencia(this.altitud === 'alta');
  }

  tocarLimite(): void {
    this.limiteTocado = true;
  }

  get sugerido(): number {
    return subsistencia(this.altitud === 'alta');
  }

  async comenzar(): Promise<void> {
    if (!this.tarifa || this.tarifa <= 0) return this.error.set('Ingresa la tarifa del kWh de tu último recibo.');
    if (this.lectura === null || this.lectura < 0) return this.error.set('Ingresa la lectura actual de tu medidor.');
    if (!this.limite || this.limite <= 0) return this.error.set('Define un límite mensual mayor que cero.');
    this.error.set('');
    this.guardando.set(true);
    await this.data.guardarConfig({
      tarifa: this.tarifa,
      diaInicio: this.diaInicio,
      altitudAlta: this.altitud === 'alta',
      limiteKwh: this.limite,
      avisos: { a80: true, a100: true, proyeccion: true },
      recordatorio: { activo: false, frecuencia: 'semanal' },
    });
    await this.data.guardarLectura({ id: nuevoId(), fecha: toLocalIso(new Date()), valor: this.lectura });
    await this.avisos.pedirPermiso();
    this.guardando.set(false);
    this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }

  async probarDemo(): Promise<void> {
    await this.data.cargarDemo();
    this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }
}
