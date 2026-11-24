import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular/standalone';
import { DataService } from './data.service';
import { toLocalIso } from './calc';

const ID_RECORDATORIO = 1001;

/** Avisos del límite mensual (RF06, RF07) y recordatorio de lectura (RF12), con notificaciones locales. */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private num = new DecimalPipe('es-CO');

  constructor(private data: DataService, private toast: ToastController) {}

  async pedirPermiso(): Promise<boolean> {
    try {
      let p = await LocalNotifications.checkPermissions();
      if (p.display !== 'granted') p = await LocalNotifications.requestPermissions();
      return p.display === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Revisa el consumo del periodo frente al límite y envía cada aviso una sola vez por periodo.
   * Se llama cada vez que se guarda o edita una lectura, o cuando cambia el límite.
   */
  async verificar(): Promise<void> {
    const c = this.data.config();
    this.data.refrescarHora();
    const r = this.data.resumen();
    if (!c || !r || r.sinDatos) return;

    const periodo = toLocalIso(r.inicio).slice(0, 10);
    const previo = this.data.estadoAvisos();
    const estado = previo && previo.periodo === periodo ? { ...previo } : { periodo, a80: false, a100: false, proyeccion: false };
    const f = (n: number) => this.num.transform(n, '1.0-0');
    const mensajes: { titulo: string; cuerpo: string }[] = [];

    if (r.pct >= 100 && !estado.a100) {
      estado.a100 = true;
      estado.a80 = true;
      if (c.avisos.a100) {
        mensajes.push({
          titulo: 'Superaste tu límite mensual',
          cuerpo: `Llevas ${f(r.consumo)} de ${f(c.limiteKwh)} kWh y quedan ${r.diasRestantes} días del periodo.`,
        });
      }
    } else if (r.pct >= 80 && !estado.a80) {
      estado.a80 = true;
      if (c.avisos.a80) {
        mensajes.push({
          titulo: `Llegaste al ${f(r.pct)} % de tu límite`,
          cuerpo: `${f(r.consumo)} de ${f(c.limiteKwh)} kWh. Te quedan ${f(c.limiteKwh - r.consumo)} kWh para los ${r.diasRestantes} días que faltan.`,
        });
      }
    }
    if (r.superara && r.proyeccionConfiable && r.pct < 100 && !estado.proyeccion) {
      estado.proyeccion = true;
      if (c.avisos.proyeccion) {
        mensajes.push({
          titulo: 'A este ritmo superarás tu límite',
          cuerpo: `Proyección: ${f(r.proyeccion)} de ${f(c.limiteKwh)} kWh. Gasta hasta ${this.num.transform(r.kwhDiaPermitido, '1.1-1')} kWh por día.`,
        });
      }
    }

    await this.data.guardarEstadoAvisos(estado);
    for (const m of mensajes) {
      await this.notificar(m.titulo, m.cuerpo);
    }
  }

  /** Programa una notificación local inmediata y la muestra también dentro de la app. */
  async notificar(titulo: string, cuerpo: string): Promise<void> {
    const t = await this.toast.create({ header: titulo, message: cuerpo, duration: 5000, position: 'top', color: 'warning' });
    await t.present();
    if (!(await this.pedirPermiso())) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1_000_000),
            title: titulo,
            body: cuerpo,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch {
      /* en navegador puede no estar disponible; el toast ya se mostró */
    }
  }

  /** Programa (o cancela) el recordatorio repetitivo de lectura a las 7:00 p. m. (RF12). */
  async programarRecordatorio(): Promise<void> {
    const c = this.data.config();
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_RECORDATORIO }] });
      if (!c?.recordatorio.activo) return;
      if (!(await this.pedirPermiso())) return;
      const on = c.recordatorio.frecuencia === 'diaria' ? { hour: 19, minute: 0 } : { weekday: 2 /* lunes */, hour: 19, minute: 0 };
      await LocalNotifications.schedule({
        notifications: [
          {
            id: ID_RECORDATORIO,
            title: 'Vatio',
            body: 'Es hora de registrar la lectura de tu medidor.',
            schedule: { on, allowWhileIdle: true },
          },
        ],
      });
    } catch {
      /* no disponible en navegador */
    }
  }
}
