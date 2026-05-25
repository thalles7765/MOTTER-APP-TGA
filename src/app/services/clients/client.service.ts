import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { NetworkService } from '../offline/network.service';
import { OfflineDatabaseService } from '../offline/offline-database.service';
import { PendingQueueService } from '../offline/pending-queue.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(
    private networkSvc: NetworkService,
    private offlineDb: OfflineDatabaseService,
    private pendingQueue: PendingQueueService
  ) { }

  async getData(params_req: any = {}, forceOnline = false) {
    // console.log(environment.url_api)
    const online = forceOnline || await this.networkSvc.refreshStatus();

    if (!online) {
      return this.localResponse(await this.offlineDb.queryRecords('clients', {
        search: params_req?.search || params_req?.codcfo,
        searchType: params_req?.search_type || 'contains',
      }));
    }

    return await apiClient
      .get(`${environment.url_api}/clients`, { params: params_req, withCredentials: true })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        console.log('@@###')
        console.log(data.data)
        await this.offlineDb.upsertRecords('clients', data.data?.data || [], 'CODCFO');
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          return this.localResponse(await this.offlineDb.queryRecords('clients', {
            search: params_req?.search || params_req?.codcfo,
            searchType: params_req?.search_type || 'contains',
          }));
        }

        throw error;
      });
  }

  async updateClient(codcfo: string, payload: any) {
    if (!(await this.networkSvc.refreshStatus())) {
      const stored = await this.offlineDb.getRecord<any>('clients', codcfo);
      await this.offlineDb.upsertRecords('clients', [{ ...(stored || {}), ...payload, CODCFO: codcfo }], 'CODCFO');
      return this.localResponse(await this.pendingQueue.enqueue('client', 'PUT', `/clients/${encodeURIComponent(codcfo)}`, payload));
    }

    return await apiClient
      .put(`${environment.url_api}/clients/${encodeURIComponent(codcfo)}`, payload, { withCredentials: true })
      .then(async (data) => {
        const updated = data.data?.data || payload;
        await this.offlineDb.upsertRecords('clients', [{ ...updated, CODCFO: codcfo }], 'CODCFO');
        return data;
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          const stored = await this.offlineDb.getRecord<any>('clients', codcfo);
          await this.offlineDb.upsertRecords('clients', [{ ...(stored || {}), ...payload, CODCFO: codcfo }], 'CODCFO');
          return this.localResponse(await this.pendingQueue.enqueue('client', 'PUT', `/clients/${encodeURIComponent(codcfo)}`, payload));
        }

        throw error;
      });
  }

  private localResponse(data: any) {
    return { status: 200, data: { error: false, message: 'Dados locais consultados com sucesso.', data, offline: true } };
  }

  private isNetworkError(error: any) {
    return !error?.response;
  }

}
