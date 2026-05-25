import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { brandConfig } from 'src/app/branding/brand-config';
import { NetworkService } from 'src/app/services/offline/network.service';
import { OfflineSyncService, SyncState } from 'src/app/services/offline/offline-sync.service';
import { PendingMutation } from 'src/app/services/offline/offline-database.service';
import { PendingQueueService } from 'src/app/services/offline/pending-queue.service';

@Component({
  selector: 'app-offline-sync',
  templateUrl: './offline-sync.page.html',
  styleUrls: ['./offline-sync.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar]
})
export class OfflineSyncPage implements OnInit, OnDestroy {
  protected brand = brandConfig;
  protected online = true;
  protected syncState: SyncState = { running: false, step: '' };
  protected stats = { products: 0, clients: 0, orders: 0, pending: 0, lastSync: null as string | null };
  protected pending: PendingMutation[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private networkSvc: NetworkService,
    private syncSvc: OfflineSyncService,
    private pendingQueue: PendingQueueService,
    private toastCtrl: ToastController
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.networkSvc.online$.subscribe((online) => this.online = online),
      this.syncSvc.state$.subscribe((state) => this.syncState = state)
    );
    await this.refresh();
  }

  async refresh() {
    this.online = await this.networkSvc.refreshStatus();
    this.stats = await this.syncSvc.stats();
    this.pending = await this.pendingQueue.list(['pending', 'sending', 'error']);
  }

  async syncNow() {
    try {
      await this.syncSvc.fullSync();
      await this.refresh();
      await this.toast('Sincronizacao concluida.', 'success');
    } catch (error: any) {
      await this.refresh();
      await this.toast(error?.message || 'Falha ao sincronizar.', 'danger');
    }
  }

  async resendAll() {
    const result = await this.pendingQueue.sendAll();
    await this.refresh();
    await this.toast(`Pendencias enviadas: ${result.sent}. Falhas: ${result.failed}.`, result.failed ? 'warning' : 'success');
  }

  async resendOne(item: PendingMutation) {
    const success = await this.pendingQueue.sendOne(item.id);
    await this.refresh();
    await this.toast(success ? 'Pendencia enviada.' : 'Nao foi possivel enviar a pendencia.', success ? 'success' : 'danger');
  }

  protected statusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      sending: 'Enviando',
      sent: 'Enviado',
      error: 'Erro',
    };

    return labels[status] || status;
  }

  protected lastSyncLabel() {
    return this.stats.lastSync ? new Date(this.stats.lastSync).toLocaleString('pt-BR') : 'Nunca sincronizado';
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private async toast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, color, duration: 2200, position: 'top' });
    await toast.present();
  }
}
