import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { kwhEquipo, nuevoId } from '../../core/calc';

/** Formulario para agregar o editar un electrodoméstico (RF11). */
@Component({
  selector: 'app-equipo',
  imports: [
    DecimalPipe,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './equipo.page.html',
})
export class EquipoPage {
  private data = inject(DataService);
  private nav = inject(NavController);

  readonly id: string;
  readonly editando: boolean;
  nombre = '';
  readonly potencia = signal<number | null>(null);
  readonly horas = signal<number | null>(null);
  readonly dias = signal<number | null>(30);
  readonly error = signal('');

  readonly kwh = computed(() =>
    kwhEquipo({ potenciaW: Number(this.potencia()) || 0, horasDia: Number(this.horas()) || 0, diasMes: Number(this.dias()) || 0 }),
  );
  readonly costo = computed(() => this.kwh() * (this.data.config()?.tarifa ?? 0));

  constructor(route: ActivatedRoute) {
    const param = route.snapshot.paramMap.get('id') ?? 'nuevo';
    const e = param !== 'nuevo' ? this.data.equipo(param) : undefined;
    this.editando = !!e;
    this.id = e?.id ?? nuevoId();
    if (e) {
      this.nombre = e.nombre;
      this.potencia.set(e.potenciaW);
      this.horas.set(e.horasDia);
      this.dias.set(e.diasMes);
    }
  }

  async guardar(): Promise<void> {
    const p = Number(this.potencia());
    const h = Number(this.horas());
    const d = Number(this.dias());
    if (!this.nombre.trim()) return this.error.set('Escribe el nombre del electrodoméstico.');
    if (!(p > 0)) return this.error.set('La potencia debe ser mayor que cero (búscala en la etiqueta del equipo).');
    if (!(h > 0 && h <= 24)) return this.error.set('Las horas de uso deben estar entre 0 y 24.');
    if (!(d > 0 && d <= 31)) return this.error.set('Los días de uso deben estar entre 1 y 31.');
    await this.data.guardarEquipo({ id: this.id, nombre: this.nombre.trim(), potenciaW: p, horasDia: h, diasMes: d });
    this.nav.navigateBack('/tabs/equipos');
  }

  async eliminar(): Promise<void> {
    await this.data.eliminarEquipo(this.id);
    this.nav.navigateBack('/tabs/equipos');
  }
}
