import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { ConfigService, SystemConfig } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';
import { OfflineModeService } from 'src/app/services/offline/offline-mode.service';
import { OfflineSyncService, SyncStats } from 'src/app/services/offline/offline-sync.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonMenuButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class ConfigPage implements OnInit {
  protected brand = brandConfig;
  protected config!: SystemConfig;
  protected loading = false;
  protected saving = false;
  protected offlineModeEnabled = false;
  protected syncStats: SyncStats | null = null;

  protected priceOptions = [
    { value: 1, label: 'Preco 1', descKey: 'descPreco1' as keyof SystemConfig, enabledKey: 'habilitaPreco1' as keyof SystemConfig },
    { value: 2, label: 'Preco 2', descKey: 'descPreco2' as keyof SystemConfig, enabledKey: 'habilitaPreco2' as keyof SystemConfig },
    { value: 3, label: 'Preco 3', descKey: 'descPreco3' as keyof SystemConfig, enabledKey: 'habilitaPreco3' as keyof SystemConfig },
    { value: 4, label: 'Preco 4', descKey: 'descPreco4' as keyof SystemConfig, enabledKey: 'habilitaPreco4' as keyof SystemConfig },
    { value: 5, label: 'Preco 5', descKey: 'descPreco5' as keyof SystemConfig, enabledKey: 'habilitaPreco5' as keyof SystemConfig },
  ];

  constructor(
    private configSvc: ConfigService,
    private offlineModeSvc: OfflineModeService,
    private offlineSyncSvc: OfflineSyncService,
    private toastCtrl: ToastController
  ) { }

  async ngOnInit() {
    this.config = { ...this.configSvc.currentConfig() };
    this.offlineModeEnabled = await this.offlineModeSvc.refresh();
    await this.loadSyncStats();
    await this.getConfig();
  }

  async getConfig() {
    this.loading = true;

    try {
      const response = await this.configSvc.refresh();

      this.config = { ...response.data.data };
      console.log(this.config);
    } catch (error) {
      this.showToast('Nao foi possivel consultar as configuracoes.', 'warning');
    } finally {
      this.loading = false;
    }
  }

  protected priceOptionLabel(option: typeof this.priceOptions[number]) {
    const description = String((this.config as any)?.[option.descKey] || '').trim();
    return description || option.label;
  }

  protected enabledPriceOptions() {
    return this.priceOptions.filter((option) => Boolean((this.config as any)?.[option.enabledKey]));
  }

  async saveConfig() {
    this.saving = true;

    try {
      const response = await this.configSvc.updateConfig(this.config);
      this.config = { ...response.data.data };
      this.showToast('Configuracoes atualizadas com sucesso.', 'success');
    } catch (error) {
      this.showToast('Nao foi possivel salvar as configuracoes.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async syncConfig() {
    this.saving = true;

    try {
      const response = await this.configSvc.syncConfig();
      this.config = { ...response.data.data };
      this.showToast('Configuracoes buscadas do sistema e atualizadas.', 'success');
    } catch (error) {
      this.showToast('Nao foi possivel buscar as configuracoes do sistema.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async toggleOfflineMode() {
    await this.offlineModeSvc.setEnabled(this.offlineModeEnabled);
    await this.loadSyncStats();
    this.showToast(
      this.offlineModeEnabled
        ? 'Modo offline habilitado neste aparelho.'
        : 'Modo offline desabilitado neste aparelho.',
      this.offlineModeEnabled ? 'success' : 'warning'
    );
  }

  protected lastSyncLabel() {
    return this.syncStats?.lastSync ? new Date(this.syncStats.lastSync).toLocaleString('pt-BR') : 'Nunca sincronizado';
  }

  protected nextSyncLabel() {
    return this.syncStats?.nextSync ? new Date(this.syncStats.nextSync).toLocaleString('pt-BR') : 'Aguardando primeira sincronizacao';
  }

  protected durationLabel() {
    const duration = Number(this.syncStats?.lastDurationMs || 0);

    if (!duration) {
      return 'Sem historico';
    }

    const seconds = Math.max(1, Math.round(duration / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return minutes > 0 ? `${minutes}min ${remainingSeconds}s` : `${seconds}s`;
  }

  private async loadSyncStats() {
    if (!this.offlineModeEnabled) {
      this.syncStats = null;
      return;
    }

    try {
      this.syncStats = await this.offlineSyncSvc.stats();
    } catch (error) {
      this.syncStats = null;
    }
  }

  private async showToast(message: string, color = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 1800,
      position: 'top'
    });

    await toast.present();
  }
}
