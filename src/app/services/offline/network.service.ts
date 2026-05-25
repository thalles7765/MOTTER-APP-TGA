import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$ = this.onlineSubject.asObservable();

  constructor() {
    this.hydrateStatus();

    Network.addListener('networkStatusChange', (status) => {
      this.onlineSubject.next(Boolean(status.connected));
    }).catch(() => {
      window.addEventListener('online', () => this.onlineSubject.next(true));
      window.addEventListener('offline', () => this.onlineSubject.next(false));
    });
  }

  get isOnline() {
    return this.onlineSubject.value;
  }

  async refreshStatus() {
    try {
      const status = await Network.getStatus();
      this.onlineSubject.next(Boolean(status.connected));
    } catch {
      this.onlineSubject.next(navigator.onLine);
    }

    return this.onlineSubject.value;
  }

  private async hydrateStatus() {
    await this.refreshStatus();
  }
}
