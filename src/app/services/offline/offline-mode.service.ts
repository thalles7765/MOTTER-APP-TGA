import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

const offlineModeKey = 'offline_mode_enabled';

@Injectable({
  providedIn: 'root'
})
export class OfflineModeService {
  private enabledSubject = new BehaviorSubject<boolean>(false);
  enabled$ = this.enabledSubject.asObservable();

  constructor() {
    this.load();
  }

  get enabled() {
    return this.enabledSubject.value;
  }

  async setEnabled(enabled: boolean) {
    this.enabledSubject.next(enabled);
    await Preferences.set({ key: offlineModeKey, value: enabled ? '1' : '0' });
  }

  async refresh() {
    await this.load();
    return this.enabled;
  }

  private async load() {
    const stored = await Preferences.get({ key: offlineModeKey });
    this.enabledSubject.next(stored.value === '1');
  }
}
