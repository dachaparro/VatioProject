import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addIcons } from 'ionicons';
import {
  add,
  addCircleOutline,
  alertCircleOutline,
  barChartOutline,
  cameraOutline,
  checkmarkCircleOutline,
  chevronForward,
  downloadOutline,
  flashOutline,
  homeOutline,
  imagesOutline,
  notificationsOutline,
  remove,
  settingsOutline,
  speedometerOutline,
  trashOutline,
  tvOutline,
  warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
})
export class AppComponent {
  constructor(router: Router) {
    addIcons({
      add,
      addCircleOutline,
      alertCircleOutline,
      barChartOutline,
      cameraOutline,
      checkmarkCircleOutline,
      chevronForward,
      downloadOutline,
      flashOutline,
      homeOutline,
      imagesOutline,
      notificationsOutline,
      remove,
      settingsOutline,
      speedometerOutline,
      trashOutline,
      tvOutline,
      warningOutline,
    });
    // Al tocar una notificación se abre el Inicio (flujo de navegación).
    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      router.navigateByUrl('/tabs/inicio');
    }).catch(() => undefined);
  }
}
