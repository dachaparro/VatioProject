import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Config, Equipo, EstadoAvisos, Lectura } from './models';
import { calcularResumen, nuevoId, tiempo, toLocalIso } from './calc';
import { FotoService } from './foto.service';

const K_CONFIG = 'vatio.config';
const K_LECTURAS = 'vatio.lecturas';
const K_EQUIPOS = 'vatio.equipos';
const K_AVISOS = 'vatio.avisos';

/**
 * Fuente única de datos de la app. Persiste todo en el dispositivo con
 * Capacitor Preferences (almacenamiento local nativo), sin servidores (RNF02, RNF03).
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  readonly config = signal<Config | null>(null);
  readonly lecturas = signal<Lectura[]>([]);
  readonly equipos = signal<Equipo[]>([]);
  readonly estadoAvisos = signal<EstadoAvisos | null>(null);
  /** Momento de referencia para los cálculos; se refresca al entrar a cada pantalla. */
  readonly ahora = signal(new Date());

  readonly resumen = computed(() => {
    const c = this.config();
    return c ? calcularResumen(c, this.lecturas(), this.ahora()) : null;
  });

  private readonly listo: Promise<void>;

  constructor(private fotos: FotoService) {
    this.listo = this.cargar();
  }

  whenReady(): Promise<void> {
    return this.listo;
  }

  refrescarHora(): void {
    this.ahora.set(new Date());
  }

  private async leer<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? (JSON.parse(value) as T) : null;
  }

  private async escribir(key: string, valor: unknown): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(valor) });
  }

  private async cargar(): Promise<void> {
    this.config.set(await this.leer<Config>(K_CONFIG));
    this.lecturas.set(ordenar((await this.leer<Lectura[]>(K_LECTURAS)) ?? []));
    this.equipos.set((await this.leer<Equipo[]>(K_EQUIPOS)) ?? []);
    this.estadoAvisos.set(await this.leer<EstadoAvisos>(K_AVISOS));
  }

  // ---- Configuración ----

  async guardarConfig(c: Config): Promise<void> {
    this.config.set(c);
    await this.escribir(K_CONFIG, c);
  }

  async guardarEstadoAvisos(e: EstadoAvisos): Promise<void> {
    this.estadoAvisos.set(e);
    await this.escribir(K_AVISOS, e);
  }

  // ---- Lecturas ----

  lectura(id: string): Lectura | undefined {
    return this.lecturas().find((l) => l.id === id);
  }

  async guardarLectura(l: Lectura): Promise<void> {
    const otras = this.lecturas().filter((x) => x.id !== l.id);
    const lista = ordenar([...otras, l]);
    this.lecturas.set(lista);
    await this.escribir(K_LECTURAS, lista);
  }

  async eliminarLectura(id: string): Promise<void> {
    const l = this.lectura(id);
    if (l?.foto) await this.fotos.eliminar(l.foto);
    const lista = this.lecturas().filter((x) => x.id !== id);
    this.lecturas.set(lista);
    await this.escribir(K_LECTURAS, lista);
  }

  // ---- Electrodomésticos ----

  equipo(id: string): Equipo | undefined {
    return this.equipos().find((e) => e.id === id);
  }

  async guardarEquipo(e: Equipo): Promise<void> {
    const lista = [...this.equipos().filter((x) => x.id !== e.id), e];
    this.equipos.set(lista);
    await this.escribir(K_EQUIPOS, lista);
  }

  async eliminarEquipo(id: string): Promise<void> {
    const lista = this.equipos().filter((x) => x.id !== id);
    this.equipos.set(lista);
    await this.escribir(K_EQUIPOS, lista);
  }

  // ---- Exportar y borrar ----

  /** Genera el CSV de lecturas con el consumo entre cada par (RF14). */
  csv(): string {
    const filas = ['fecha,lectura_kwh,consumo_desde_anterior_kwh'];
    let anterior: Lectura | undefined;
    for (const l of this.lecturas()) {
      const consumo = anterior ? (l.valor - anterior.valor).toFixed(1) : '';
      filas.push(`${l.fecha.replace('T', ' ')},${l.valor},${consumo}`);
      anterior = l;
    }
    return filas.join('\n');
  }

  async borrarTodo(): Promise<void> {
    await this.fotos.eliminarTodas();
    await Preferences.clear();
    this.config.set(null);
    this.lecturas.set([]);
    this.equipos.set([]);
    this.estadoAvisos.set(null);
  }

  /** Carga un hogar de ejemplo (Bogotá, 130 kWh de límite) para demostrar la app. */
  async cargarDemo(): Promise<void> {
    const ahora = new Date();
    const config: Config = {
      tarifa: 900,
      diaInicio: 1,
      altitudAlta: true,
      limiteKwh: 130,
      avisos: { a80: true, a100: true, proyeccion: true },
      recordatorio: { activo: false, frecuencia: 'semanal' },
    };
    // kWh por día de cada mes, del más antiguo al actual; agosto supera el límite.
    const ritmo = [4.0, 4.0, 4.9, 4.1, 4.0, 4.6];
    const lecturas: Lectura[] = [];
    let valor = 3800;
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1, 7, 30);
    let d = new Date(inicio);
    let i = 0;
    while (d.getTime() <= ahora.getTime()) {
      lecturas.push({ id: nuevoId(), fecha: toLocalIso(d), valor: Math.round(valor) });
      const mes = (d.getFullYear() - inicio.getFullYear()) * 12 + d.getMonth() - inicio.getMonth();
      const r = ritmo[Math.min(mes, ritmo.length - 1)] * (1 + 0.05 * Math.sin(i * 1.7));
      valor += r * 3;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3, 7, 30);
      i++;
    }
    const equipos: Equipo[] = [
      { id: nuevoId(), nombre: 'Nevera', potenciaW: 150, horasDia: 8, diasMes: 30 },
      { id: nuevoId(), nombre: 'Ducha eléctrica', potenciaW: 3500, horasDia: 0.3, diasMes: 30 },
      { id: nuevoId(), nombre: 'Televisor', potenciaW: 100, horasDia: 5, diasMes: 30 },
      { id: nuevoId(), nombre: 'Computador', potenciaW: 65, horasDia: 6, diasMes: 30 },
      { id: nuevoId(), nombre: 'Lavadora', potenciaW: 500, horasDia: 0.5, diasMes: 30 },
    ];
    await this.borrarTodo();
    await this.guardarConfig(config);
    this.lecturas.set(lecturas);
    await this.escribir(K_LECTURAS, lecturas);
    this.equipos.set(equipos);
    await this.escribir(K_EQUIPOS, equipos);
    this.refrescarHora();
  }
}

function ordenar(lista: Lectura[]): Lectura[] {
  return [...lista].sort((a, b) => tiempo(a) - tiempo(b));
}
