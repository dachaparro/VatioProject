import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  NavController,
  ToastController,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DataService } from '../../core/data.service';
import { AvisosService } from '../../core/avisos.service';
import { Config } from '../../core/models';

/** Pantalla 8 — Ajustes: tarifa, periodo, recordatorio, exportar y borrar (RF12, RF13, RF14). */
@Component({
  selector: 'app-ajustes',
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
  templateUrl: './ajustes.page.html',
})
export class AjustesPage {
  private data = inject(DataService);
  private avisos = inject(AvisosService);
  private alert = inject(AlertController);
  private toast = inject(ToastController);
  private nav = inject(NavController);

  readonly dias = Array.from({ length: 28 }, (_, i) => i + 1);
  c: Config | null = null;

  ionViewWillEnter(): void {
    const c = this.data.config();
    this.c = c ? structuredClone(c) : null;
  }

  async guardar(): Promise<void> {
    if (!this.c) return;
    const tarifa = Number(this.c.tarifa);
    if (!(tarifa > 0)) return;
    const anterior = this.data.config();
    await this.data.guardarConfig({ ...this.c, tarifa, diaInicio: Number(this.c.diaInicio) });
    if (
      anterior?.recordatorio.activo !== this.c.recordatorio.activo ||
      anterior?.recordatorio.frecuencia !== this.c.recordatorio.frecuencia
    ) {
      await this.avisos.programarRecordatorio();
    }
  }

  async exportar(): Promise<void> {
    const csv = this.data.csv();
    const nombre = 'vatio-lecturas.csv';
    if (Capacitor.isNativePlatform()) {
      const r = await Filesystem.writeFile({ path: nombre, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: 'Lecturas de Vatio', url: r.uri, dialogTitle: 'Guardar o enviar el CSV' });
    } else {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async cargarDemo(): Promise<void> {
    const a = await this.alert.create({
      header: 'Cargar datos de ejemplo',
      message: 'Se reemplazarán tus datos actuales por un hogar de ejemplo con seis meses de lecturas.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cargar',
          handler: async () => {
            await this.data.cargarDemo();
            this.ionViewWillEnter();
            const t = await this.toast.create({ message: 'Datos de ejemplo cargados', duration: 1500, color: 'success' });
            await t.present();
          },
        },
      ],
    });
    await a.present();
  }

  async borrar(): Promise<void> {
    const a = await this.alert.create({
      header: 'Borrar todos los datos',
      message: 'Se eliminarán lecturas, fotos, electrodomésticos y configuración. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: async () => {
            await this.data.borrarTodo();
            await this.avisos.programarRecordatorio();
            this.nav.navigateRoot('/bienvenida');
          },
        },
      ],
    });
    await a.present();
  }
}
