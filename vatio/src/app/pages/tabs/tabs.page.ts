import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';

/** Barra de pestañas común a las pantallas principales. */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="historial">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <ion-label>Historial</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="limite">
          <ion-icon name="speedometer-outline"></ion-icon>
          <ion-label>Límite</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="equipos">
          <ion-icon name="tv-outline"></ion-icon>
          <ion-label>Equipos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="ajustes">
          <ion-icon name="settings-outline"></ion-icon>
          <ion-label>Ajustes</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {}
