import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import axios from 'axios';
import { app_user } from 'src/app/interfaces/app-user';
import { environment } from 'src/environments/environment';
import { SecurityService } from '../security/security.service';

const notificationTokenKey = 'push_notification_token';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private listenersReady = false;
  private registrationInProgress = false;

  constructor(
    private router: Router,
    private securitySvc: SecurityService
  ) { }

  async registerAdminDevice(user: app_user | null) {
    if (!this.isNativePlatform() || !user || !this.isAdmin(user) || this.registrationInProgress) {
      return;
    }

    this.registrationInProgress = true;

    try {
      await this.ensureListeners();
      const permissionStatus = await PushNotifications.requestPermissions();

      if (permissionStatus.receive !== 'granted') {
        return;
      }

      await Preferences.set({ key: 'push_notification_user', value: JSON.stringify(this.userPayload(user)) });
      await PushNotifications.register();
    } catch (error) {
      console.log('Push notification indisponivel neste aparelho.', error);
    } finally {
      this.registrationInProgress = false;
    }
  }

  async unregisterCurrentToken() {
    if (!this.isNativePlatform()) {
      return;
    }

    let storedToken = await Preferences.get({ key: notificationTokenKey });

    if (!storedToken.value) {
      return;
    }

    try {
      await axios.delete(`${environment.url_api}/notifications/device-token`, {
        data: { token: storedToken.value },
        withCredentials: true
      });
    } catch (error) {
      console.log('Nao foi possivel remover o token de notificacao.', error);
    } finally {
      await Preferences.remove({ key: notificationTokenKey });
      await Preferences.remove({ key: 'push_notification_user' });
    }
  }

  private async ensureListeners() {
    if (this.listenersReady) {
      return;
    }

    await PushNotifications.addListener('registration', (token: Token) => {
      this.sendDeviceToken(token.value).catch((error) => {
        console.log('Nao foi possivel enviar o token de notificacao.', error);
      });
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.log('Falha ao registrar push notification.', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      this.handleSecurityNotification(notification.data);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      this.handleSecurityNotification(event.notification.data, true);
    });

    this.listenersReady = true;
  }

  private async sendDeviceToken(token: string) {
    const storedUser = await Preferences.get({ key: 'push_notification_user' });

    if (!storedUser.value) {
      return;
    }

    let user: any = null;

    try {
      user = JSON.parse(storedUser.value);
    } catch (error) {
      await Preferences.remove({ key: 'push_notification_user' });
      return;
    }

    await axios.post(`${environment.url_api}/notifications/device-token`, {
      user_id: user.user_id,
      token,
      platform: Capacitor.getPlatform(),
      flavor: environment.flavor,
      app_id: this.appIdForFlavor(),
    }, { withCredentials: true });

    await Preferences.set({ key: notificationTokenKey, value: token });
  }

  private async handleSecurityNotification(data: any, shouldNavigate = false) {
    if (data?.type !== 'security_request') {
      return;
    }

    this.securitySvc.notifyRequestsChanged();

    if (shouldNavigate) {
      await this.router.navigate([data.route || '/app/security-requests'], {
        queryParams: { allBranches: data.allBranches || '1' }
      });
    }
  }

  private userPayload(user: app_user) {
    return {
      user_id: Number(user.id || user.ID || 0),
    };
  }

  private isNativePlatform() {
    return Capacitor.isNativePlatform();
  }

  private isAdmin(user: app_user | null) {
    const value = user?.admin as any;

    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private appIdForFlavor() {
    const appIds = {
      medianeira: 'med.appsell.store',
      robertopf: 'robertopf.appsell.store',
      mercandressa: 'mercandressa.appsell.store',
    };

    return appIds[environment.flavor as keyof typeof appIds] || appIds.medianeira;
  }
}
