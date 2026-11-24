import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { DataService } from '../../core/data.service';
import { FotoService } from '../../core/foto.service';
import { AvisosService } from '../../core/avisos.service';
import { Lectura } from '../../core/models';
import { nuevoId, tiempo, toLocalIso } from '../../core/calc';

/** Pantalla 3 — Registrar lectura (RF02, RF03) y edición/eliminación de una lectura (RF10). */
@Component({
  selector: 'app-lectura',
  imports: [
    DecimalPipe,
    DatePipe,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './lectura.page.html',
  styles: `
    .foto {
      margin: 16px;
      border: 2px dashed var(--ion-color-medium-tint);
      border-radius: 12px;
      min-height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      overflow: hidden;
      background: var(--ion-color-light);
    }
    .foto img { width: 100%; max-height: 260px; object-fit: cover; }
    .botones-foto { display: flex; gap: 8px; }
    .valor ion-input { font-size: 1.6rem; font-weight: 700; }
    .info { padding: 8px 16px; }
  `,
})
export class LecturaPage {
  private data = inject(DataService);
  private fotos = inject(FotoService);
  private avisos = inject(AvisosService);
  private nav = inject(NavController);
  private alert = inject(AlertController);

  readonly id: string;
  readonly editando: boolean;

  valor: number | null = null;
  fecha = toLocalIso(new Date());
  readonly maxFecha = toLocalIso(new Date(Date.now() + 60_000));
  readonly fotoVista = signal<string | null>(null);
  private fotoNueva: string | null = null;
  private fotoRuta?: string;

  readonly error = signal('');
  readonly fechaSel = signal(this.fecha);
  readonly valorSel = signal<number | null>(null);

  /** Lectura anterior a la fecha elegida, para mostrar el consumo desde entonces. */
  readonly anterior = computed(() => {
    const t = new Date(this.fechaSel()).getTime();
    return this.data
      .lecturas()
      .filter((l) => l.id !== this.id && tiempo(l) <= t)
      .at(-1);
  });

  readonly siguiente = computed(() => {
    const t = new Date(this.fechaSel()).getTime();
    return this.data.lecturas().find((l) => l.id !== this.id && tiempo(l) > t);
  });

  readonly consumoDesde = computed(() => {
    const a = this.anterior();
    const v = this.valorSel();
    return a && v !== null ? v - a.valor : null;
  });

  constructor(route: ActivatedRoute) {
    const param = route.snapshot.paramMap.get('id') ?? 'nueva';
    const existente = param !== 'nueva' ? this.data.lectura(param) : undefined;
    this.editando = !!existente;
    this.id = existente?.id ?? nuevoId();
    if (existente) {
      this.valor = existente.valor;
      this.fecha = existente.fecha;
      this.fechaSel.set(existente.fecha);
      this.valorSel.set(existente.valor);
      this.fotoRuta = existente.foto;
      if (existente.foto) this.fotos.cargar(existente.foto).then((url) => this.fotoVista.set(url));
    }
  }

  cambiarValor(): void {
    this.error.set('');
    this.valorSel.set(this.valor === null || (this.valor as unknown) === '' ? null : Number(this.valor));
  }

  cambiarFecha(): void {
    this.fechaSel.set(this.fecha);
  }

  async tomarFoto(origen: 'camara' | 'galeria'): Promise<void> {
    const base64 = await this.fotos.tomar(origen);
    if (!base64) return;
    this.fotoNueva = base64;
    this.fotoVista.set(`data:image/jpeg;base64,${base64}`);
  }

  async guardar(): Promise<void> {
    const v = this.valorSel();
    if (v === null || isNaN(v) || v < 0) return this.error.set('Ingresa el valor que marca el medidor.');
    if (new Date(this.fecha).getTime() > Date.now() + 60_000) return this.error.set('La fecha no puede estar en el futuro.');
    const a = this.anterior();
    const s = this.siguiente();
    if (a && v < a.valor) {
      return this.error.set(`La lectura no puede ser menor que la anterior (${a.valor} kWh). Revisa el medidor.`);
    }
    if (s && v > s.valor) {
      return this.error.set(`La lectura no puede ser mayor que la siguiente registrada (${s.valor} kWh).`);
    }
    this.error.set('');

    let foto = this.fotoRuta;
    if (this.fotoNueva) foto = await this.fotos.guardar(this.id, this.fotoNueva);
    const lectura: Lectura = { id: this.id, fecha: this.fecha.slice(0, 19), valor: v, foto };
    await this.data.guardarLectura(lectura);
    await this.avisos.verificar();
    this.nav.back();
  }

  async eliminar(): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar lectura',
      message: 'Los cálculos de consumo se actualizarán sin esta lectura.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.data.eliminarLectura(this.id);
            this.nav.back();
          },
        },
      ],
    });
    await a.present();
  }
}
