import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BranchService } from '../branches/branch.service';
import { ClientService } from '../clients/client.service';
import { ConfigService } from '../config/config.service';
import { OrdersService } from '../orders/orders.service';
import { ProductService } from '../products/product.service';
import { UtilsService } from '../utils/utils.service';
import { OfflineDatabaseService } from './offline-database.service';
import { NetworkService } from './network.service';
import { PendingQueueService } from './pending-queue.service';

export type SyncState = {
  running: boolean;
  step: string;
  lastError?: string | null;
};

export type SyncStats = {
  products: number;
  clients: number;
  orders: number;
  pending: number;
  lastSync: string | null;
  lastDurationMs: number | null;
  nextSync: string | null;
  lastSummary: SyncSummary | null;
};

export type SyncSummary = {
  products?: number;
  clients?: number;
  orders?: number;
  pending?: number;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
};

const syncIntervalMs = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private stateSubject = new BehaviorSubject<SyncState>({ running: false, step: '' });
  public state$ = this.stateSubject.asObservable();

  constructor(
    private networkSvc: NetworkService,
    private offlineDb: OfflineDatabaseService,
    private pendingQueue: PendingQueueService,
    private configSvc: ConfigService,
    private branchSvc: BranchService,
    private utilsSvc: UtilsService,
    private clientSvc: ClientService,
    private productSvc: ProductService,
    private ordersSvc: OrdersService
  ) { }

  get state() {
    return this.stateSubject.value;
  }

  async fullSync() {
    if (!(await this.networkSvc.refreshStatus())) {
      throw new Error('Sem conexao para sincronizar.');
    }

    const startedAt = Date.now();
    this.setState('Iniciando sincronizacao...');

    try {
      this.setState('Configuracoes');
      await this.configSvc.refresh();

      this.setState('Filiais');
      const branches = await this.branchSvc.getBranches(true);

      this.setState('Tabelas auxiliares');
      await Promise.allSettled([
        this.utilsSvc.getSellers({}, true),
        this.utilsSvc.getMovementsType('', true),
        this.utilsSvc.getPaymentsType('', true),
        this.utilsSvc.getCest({}, true),
        this.utilsSvc.getFiscalClassifications({}, true),
        this.utilsSvc.getGroups({}, true),
        this.utilsSvc.getManufacturers({}, true),
        this.utilsSvc.getUnits({}, true),
      ]);

      this.setState('Clientes');
      await Promise.allSettled((branches || []).map((branch) =>
        this.clientSvc.getData({ search_type: 'contains', codfilial: branch.CODFILIAL }, true)
      ));

      this.setState('Produtos');
      await Promise.allSettled((branches || []).map((branch) =>
        this.productSvc.getData('', 'contains', true, { codfilial: branch.CODFILIAL })
      ));

      this.setState('Movimentos');
      await Promise.allSettled((branches || []).map((branch) =>
        this.ordersSvc.getData({ codfilial: branch.CODFILIAL }, true)
      ));

      this.setState('Enviando pendencias');
      await this.pendingQueue.sendAll();

      const finishedAt = new Date();
      const durationMs = Date.now() - startedAt;
      const stats = await this.offlineDb.stats();
      await this.offlineDb.setMeta('last_full_sync', finishedAt.toISOString());
      await this.offlineDb.setMeta('last_full_sync_summary', {
        products: stats.products,
        clients: stats.clients,
        orders: stats.orders,
        pending: stats.pending,
        durationMs,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: finishedAt.toISOString(),
      });
      this.stateSubject.next({ running: false, step: 'Sincronizacao concluida', lastError: null });
    } catch (error: any) {
      this.stateSubject.next({ running: false, step: 'Erro na sincronizacao', lastError: error?.message || String(error) });
      throw error;
    }
  }

  async stats() {
    const stats = await this.offlineDb.stats();
    const summary = await this.offlineDb.getMeta<SyncSummary>('last_full_sync_summary');
    const lastSync = stats.lastSync;
    const nextSync = lastSync ? new Date(new Date(lastSync).getTime() + syncIntervalMs).toISOString() : null;

    return {
      ...stats,
      lastDurationMs: Number(summary?.durationMs || 0) || null,
      nextSync,
      lastSummary: summary || null,
    } as SyncStats;
  }

  async runScheduledSyncIfNeeded() {
    const stats = await this.stats();
    const now = Date.now();
    const lastSyncTime = stats.lastSync ? new Date(stats.lastSync).getTime() : 0;

    if (this.state.running || (lastSyncTime && now - lastSyncTime < syncIntervalMs)) {
      return false;
    }

    await this.fullSync();
    return true;
  }

  async sendPendingIfOnline() {
    if (!(await this.networkSvc.refreshStatus())) {
      return { sent: 0, failed: 0 };
    }

    return this.pendingQueue.sendAll();
  }

  private setState(step: string) {
    this.stateSubject.next({ running: true, step, lastError: null });
  }
}
