/** Configuración del hogar (RF01, RF05, RF12, RF13). */
export interface Config {
  /** Tarifa del kWh tomada del último recibo, en pesos colombianos. */
  tarifa: number;
  /** Día del mes en que inicia el periodo de facturación (1 a 28). */
  diaInicio: number;
  /** true si la ciudad está a 1.000 m o más (subsistencia 130 kWh), false si está por debajo (173 kWh). */
  altitudAlta: boolean;
  /** Límite mensual de kWh definido por el usuario. */
  limiteKwh: number;
  avisos: {
    a80: boolean;
    a100: boolean;
    proyeccion: boolean;
  };
  recordatorio: {
    activo: boolean;
    frecuencia: 'diaria' | 'semanal';
  };
}

/** Lectura del medidor (RF02, RF03). */
export interface Lectura {
  id: string;
  /** Fecha y hora local en formato ISO sin zona: YYYY-MM-DDTHH:mm:ss */
  fecha: string;
  /** Valor que marca el medidor, en kWh. */
  valor: number;
  /** Ruta del archivo de la foto en el almacenamiento de la app. */
  foto?: string;
}

/** Electrodoméstico para la calculadora (RF11). */
export interface Equipo {
  id: string;
  nombre: string;
  potenciaW: number;
  horasDia: number;
  diasMes: number;
}

/** Registro de qué avisos ya se enviaron en el periodo actual, para no repetirlos (RF06, RF07). */
export interface EstadoAvisos {
  periodo: string;
  a80: boolean;
  a100: boolean;
  proyeccion: boolean;
}
