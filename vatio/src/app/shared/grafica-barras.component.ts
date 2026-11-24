import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Barra } from '../core/calc';

/** Gráfica de barras en SVG con línea de referencia del límite (RF09). */
@Component({
  selector: 'app-grafica-barras',
  imports: [DecimalPipe],
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="titulo()">
      <line [attr.x1]="izq" [attr.x2]="W - 8" [attr.y1]="base" [attr.y2]="base" class="eje" />
      @for (b of geo(); track $index) {
        @if (b.alto !== null) {
          <rect [attr.x]="b.x" [attr.y]="base - b.alto" [attr.width]="b.ancho" [attr.height]="b.alto" rx="3" [attr.class]="b.clase" />
          @if (mostrarValores()) {
            <text [attr.x]="b.x + b.ancho / 2" [attr.y]="base - b.alto - 4" text-anchor="middle" class="valor">{{ b.valor | number: '1.0-0' }}</text>
          }
        }
        @if (b.verEtiqueta) {
          <text [attr.x]="b.x + b.ancho / 2" [attr.y]="base + 16" text-anchor="middle" [class.actual]="b.actual" class="etiqueta">{{ b.etiqueta }}</text>
        }
      }
      @if (yRef() !== null) {
        <line [attr.x1]="izq" [attr.x2]="W - 8" [attr.y1]="yRef()" [attr.y2]="yRef()" class="referencia" />
        <!-- Leyenda arriba, fuera de las barras, para que no tape los valores -->
        <line [attr.x1]="izq" [attr.x2]="izq + 22" y1="10" y2="10" class="referencia" />
        <text [attr.x]="izq + 28" y="14" class="ref-texto">{{ etiquetaReferencia() }}</text>
      }
    </svg>
  `,
  styles: `
    svg { width: 100%; height: auto; display: block; }
    .eje { stroke: var(--ion-color-medium); stroke-width: 1; }
    .normal { fill: var(--ion-color-medium-tint); opacity: 0.55; }
    .actual-barra { fill: var(--ion-color-primary); }
    .excede { fill: var(--ion-color-warning); }
    .referencia { stroke: var(--ion-color-warning-shade); stroke-width: 1.5; stroke-dasharray: 5 4; }
    .ref-texto { fill: var(--ion-text-color); font-size: 11px; }
    .etiqueta { fill: var(--ion-color-medium); font-size: 11px; }
    .etiqueta.actual { fill: var(--ion-text-color); font-weight: 700; }
    .valor { fill: var(--ion-color-medium); font-size: 10px; }
  `,
})
export class GraficaBarrasComponent {
  readonly barras = input.required<Barra[]>();
  readonly referencia = input<number | null>(null);
  readonly etiquetaReferencia = input('');
  readonly titulo = input('Consumo en kWh');
  readonly mostrarValores = input(true);

  readonly W = 340;
  readonly H = 220;
  readonly izq = 8;
  readonly base = 190;
  private readonly arriba = 40;

  private readonly max = computed(() => {
    const vals = this.barras().map((b) => b.valor ?? 0);
    return Math.max(1, ...vals, this.referencia() ?? 0) * 1.08;
  });

  readonly yRef = computed(() => {
    const r = this.referencia();
    if (r === null) return null;
    return this.base - (r / this.max()) * (this.base - this.arriba);
  });

  readonly geo = computed(() => {
    const barras = this.barras();
    const n = barras.length;
    const paso = (this.W - this.izq - 8) / n;
    const ancho = Math.min(32, paso * 0.62);
    const cada = n > 10 ? 2 : 1;
    const ref = this.referencia();
    return barras.map((b, i) => ({
      ...b,
      x: this.izq + paso * i + (paso - ancho) / 2,
      ancho,
      alto: b.valor === null ? null : Math.max(1, (b.valor / this.max()) * (this.base - this.arriba)),
      clase: b.actual ? 'actual-barra' : ref !== null && (b.valor ?? 0) > ref ? 'excede' : 'normal',
      verEtiqueta: (n - 1 - i) % cada === 0,
    }));
  });
}
