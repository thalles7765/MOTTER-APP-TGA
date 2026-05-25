import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { apiClient } from '../api/api-client';
import { OfflineDatabaseService, PendingMutation } from './offline-database.service';
import { NetworkService } from './network.service';

@Injectable({
  providedIn: 'root'
})
export class PendingQueueService {
  constructor(
    private offlineDb: OfflineDatabaseService,
    private networkSvc: NetworkService
  ) { }

  async enqueue(type: string, method: string, path: string, payload: any, context: Partial<PendingMutation> = {}) {
    const now = new Date().toISOString();
    const offlineRequestId = context.offline_request_id || this.uuid();
    const mutation: PendingMutation = {
      id: this.uuid(),
      type,
      method: method.toUpperCase(),
      url: path.startsWith('http') ? path : `${environment.url_api}${path}`,
      payload: { ...payload, offline_request_id: offlineRequestId },
      status: 'pending',
      attempts: 0,
      last_error: null,
      offline_request_id: offlineRequestId,
      created_at: now,
      updated_at: now,
      user_id: context.user_id || null,
      codempresa: context.codempresa || payload?.CODEMPRESA || null,
      codfilial: context.codfilial || payload?.CODFILIAL || null,
    };

    return this.offlineDb.savePendingMutation(mutation);
  }

  async list(statuses: PendingMutation['status'][] = ['pending', 'error']) {
    return this.offlineDb.listPendingMutations(statuses);
  }

  async sendAll() {
    if (!(await this.networkSvc.refreshStatus())) {
      return { sent: 0, failed: 0 };
    }

    const pending = await this.offlineDb.listPendingMutations(['pending', 'error']);
    let sent = 0;
    let failed = 0;

    for (const mutation of pending) {
      const result = await this.sendOne(mutation.id);
      result ? sent++ : failed++;
    }

    return { sent, failed };
  }

  async sendOne(id: string) {
    if (!(await this.networkSvc.refreshStatus())) {
      return false;
    }

    const mutation = (await this.offlineDb.listPendingMutations(['pending', 'error', 'sending']))
      .find((item) => item.id === id);

    if (!mutation) {
      return false;
    }

    await this.offlineDb.updatePendingMutation(id, {
      status: 'sending',
      attempts: Number(mutation.attempts || 0) + 1,
      last_error: null,
    });

    try {
      await apiClient.request({
        method: mutation.method as any,
        url: mutation.url,
        data: mutation.payload,
        withCredentials: true,
        headers: {
          'X-Offline-Request-Id': mutation.offline_request_id || mutation.id,
        },
      });

      await this.offlineDb.updatePendingMutation(id, { status: 'sent', last_error: null });
      return true;
    } catch (error: any) {
      await this.offlineDb.updatePendingMutation(id, {
        status: 'error',
        last_error: error?.response?.data?.message || error?.message || 'Falha ao enviar pendencia.',
      });
      return false;
    }
  }

  private uuid() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
