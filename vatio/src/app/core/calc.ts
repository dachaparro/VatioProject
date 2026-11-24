import { Config, Equipo, Lectura } from './models';

/** Milisegundos en un día. */
export const DIA = 86_400_000;

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function mesCorto(d: Date): string {
  return MESES[d.getMonth()];
}

export function tiempo(l: Lectura): number {
  return new Date(l.fecha).getTime();
}

/** Convierte una fecha a ISO local sin zona horaria (el formato que usa ion-datetime). */
export function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Consumo de subsistencia según la Resolución UPME 0355 de 2004. */
export function subsistencia(altitudAlta: boolean): number {
  return altitudAlta ? 130 : 173;
}

/** Inicio del periodo de facturación que contiene la fecha de referencia. */
export function inicioPeriodo(ref: Date, dia: number): Date {
  let d = new Date(ref.getFullYear(), ref.getMonth(), dia);
  if (d.getTime() > ref.getTime()) {
    d = new Date(ref.getFullYear(), ref.getMonth() - 1, dia);
  }
  return d;
}

/** Inicio del periodo siguiente (fin exclusivo del periodo actual). */
export function siguientePeriodo(inicio: Date, dia: number): Date {
  return new Date(inicio.getFullYear(), inicio.getMonth() + 1, dia);
}

/**
 * Valor del medidor en un instante dado, interpolando linealmente entre lecturas.
 * Antes de la primera lectura devuelve la primera; después de la última, la última.
 */
export function valorEn(lecturas: Lectura[], t: number): number | null {
  if (!lecturas.length) return null;
  const primera = lecturas[0];
  const ultima = lecturas[lecturas.length - 1];
  if (t <= tiempo(primera)) return primera.valor;
  if (t >= tiempo(ultima)) return ultima.valor;
  for (let i = 1; i < lecturas.length; i++) {
    const a = lecturas[i - 1];
    const b = lecturas[i];
    const ta = tiempo(a);
    const tb = tiempo(b);
    if (t <= tb) {
      if (tb === ta) return b.valor;
      return a.valor + ((b.valor - a.valor) * (t - ta)) / (tb - ta);
    }
  }
  return ultima.valor;
}

/** kWh consumidos entre dos instantes (RF04). */
export function consumoEntre(lecturas: Lectura[], desde: number, hasta: number): number {
  const a = valorEn(lecturas, desde);
  const b = valorEn(lecturas, hasta);
  if (a === null || b === null) return 0;
  return Math.max(0, b - a);
}

export interface Resumen {
  inicio: Date;
  fin: Date;
  diasPeriodo: number;
  diaActual: number;
  diasRestantes: number;
  limite: number;
  ultima?: Lectura;
  sinDatos: boolean;
  consumo: number;
  promedioDiario: number;
  proyeccion: number;
  pct: number;
  costoActual: number;
  facturaProyectada: number;
  kwhDiaPermitido: number;
  superara: boolean;
  /** false si las lecturas cubren menos de un día: el ritmo diario aún no es confiable para proyectar. */
  proyeccionConfiable: boolean;
  /** kWh por encima del límite (0 si no se ha superado). */
  exceso: number;
}

/** Calcula el estado del periodo actual: consumo, proyección, factura y margen diario (RF04, RF07, RF08). */
export function calcularResumen(config: Config, lecturas: Lectura[], ahora: Date): Resumen {
  const inicio = inicioPeriodo(ahora, config.diaInicio);
  const fin = siguientePeriodo(inicio, config.diaInicio);
  const diasPeriodo = Math.round((fin.getTime() - inicio.getTime()) / DIA);
  const diaActual = Math.min(diasPeriodo, Math.floor((ahora.getTime() - inicio.getTime()) / DIA) + 1);
  const ultima = lecturas.at(-1);
  const base = {
    inicio,
    fin,
    diasPeriodo,
    diaActual,
    diasRestantes: diasPeriodo - diaActual,
    limite: config.limiteKwh,
    ultima,
  };

  if (lecturas.length < 2) {
    return {
      ...base,
      sinDatos: true,
      consumo: 0,
      promedioDiario: 0,
      proyeccion: 0,
      pct: 0,
      costoActual: 0,
      facturaProyectada: 0,
      kwhDiaPermitido: config.limiteKwh / diasPeriodo,
      superara: false,
      proyeccionConfiable: false,
      exceso: 0,
    };
  }

  const primera = lecturas[0];
  const t0 = Math.max(inicio.getTime(), tiempo(primera));
  const t1 = Math.min(ahora.getTime(), tiempo(ultima!));
  const consumo = t1 > t0 ? consumoEntre(lecturas, t0, t1) : 0;

  // Promedio diario: con lo medido en el periodo; si es menos de un día, con todo el historial.
  // Con menos de un día de historial el ritmo diario no es confiable (dos lecturas seguidas darían
  // un promedio enorme), así que no se proyecta hasta tener al menos un día.
  const diasMedidos = (t1 - t0) / DIA;
  const diasHistorial = (tiempo(ultima!) - tiempo(primera)) / DIA;
  const confiable = diasHistorial >= 1;
  let promedio = 0;
  if (diasMedidos >= 1) {
    promedio = consumo / diasMedidos;
  } else if (confiable) {
    promedio = (ultima!.valor - primera.valor) / diasHistorial;
  }

  const diasSinMedir = Math.max(0, (fin.getTime() - Math.max(t0, t1)) / DIA);
  const proyeccion = confiable ? consumo + promedio * diasSinMedir : consumo;
  const diasQueQuedan = Math.max(1, (fin.getTime() - ahora.getTime()) / DIA);

  return {
    ...base,
    sinDatos: false,
    consumo,
    promedioDiario: promedio,
    proyeccion,
    pct: config.limiteKwh > 0 ? (consumo / config.limiteKwh) * 100 : 0,
    costoActual: consumo * config.tarifa,
    facturaProyectada: proyeccion * config.tarifa,
    kwhDiaPermitido: Math.max(0, config.limiteKwh - consumo) / diasQueQuedan,
    superara: confiable && proyeccion > config.limiteKwh,
    proyeccionConfiable: confiable,
    exceso: Math.max(0, consumo - config.limiteKwh),
  };
}

export interface Barra {
  etiqueta: string;
  valor: number | null;
  actual?: boolean;
}

function cubierto(lecturas: Lectura[], desde: number, hasta: number): boolean {
  return lecturas.length >= 2 && hasta > tiempo(lecturas[0]) && desde < tiempo(lecturas[lecturas.length - 1]);
}

/** Consumo de los últimos n días (RF09). */
export function serieDiaria(lecturas: Lectura[], ahora: Date, n = 14): Barra[] {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const barras: Barra[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
    const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    barras.push({
      etiqueta: String(d.getDate()),
      valor: cubierto(lecturas, d.getTime(), e.getTime()) ? consumoEntre(lecturas, d.getTime(), e.getTime()) : null,
      actual: i === 0,
    });
  }
  return barras;
}

/** Consumo de las últimas n semanas móviles (RF09). */
export function serieSemanal(lecturas: Lectura[], ahora: Date, n = 8): Barra[] {
  const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
  const barras: Barra[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const fin = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate() - 7 * i);
    const ini = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 7);
    barras.push({
      etiqueta: `${ini.getDate()} ${mesCorto(ini)}`,
      valor: cubierto(lecturas, ini.getTime(), fin.getTime()) ? consumoEntre(lecturas, ini.getTime(), fin.getTime()) : null,
      actual: i === 0,
    });
  }
  return barras;
}

/** Consumo de los últimos n periodos de facturación (RF09). */
export function serieMensual(lecturas: Lectura[], ahora: Date, dia: number, n = 6): Barra[] {
  const actual = inicioPeriodo(ahora, dia);
  const barras: Barra[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const ini = new Date(actual.getFullYear(), actual.getMonth() - k, dia);
    const fin = siguientePeriodo(ini, dia);
    barras.push({
      etiqueta: mesCorto(ini),
      valor: cubierto(lecturas, ini.getTime(), fin.getTime()) ? consumoEntre(lecturas, ini.getTime(), fin.getTime()) : null,
      actual: k === 0,
    });
  }
  return barras;
}

/** Promedio de los periodos completos anteriores; sirve como sugerencia de límite (RF05). */
export function promedioPeriodosCompletos(lecturas: Lectura[], ahora: Date, dia: number): number | null {
  if (lecturas.length < 2) return null;
  const actual = inicioPeriodo(ahora, dia);
  const primera = tiempo(lecturas[0]);
  const ultima = tiempo(lecturas[lecturas.length - 1]);
  const valores: number[] = [];
  for (let k = 1; k <= 6; k++) {
    const ini = new Date(actual.getFullYear(), actual.getMonth() - k, dia);
    const fin = siguientePeriodo(ini, dia);
    if (primera <= ini.getTime() && ultima >= fin.getTime()) {
      valores.push(consumoEntre(lecturas, ini.getTime(), fin.getTime()));
    }
  }
  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/** kWh al mes de un electrodoméstico: potencia × horas al día × días al mes (RF11). */
export function kwhEquipo(e: Pick<Equipo, 'potenciaW' | 'horasDia' | 'diasMes'>): number {
  return (e.potenciaW * e.horasDia * e.diasMes) / 1000;
}
