import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { NetworkService } from '../offline/network.service';
import { OfflineDatabaseService } from '../offline/offline-database.service';
import { PendingQueueService } from '../offline/pending-queue.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private networkSvc: NetworkService,
    private offlineDb: OfflineDatabaseService,
    private pendingQueue: PendingQueueService
  ) { }

  async getData(search_value = '', search_type = 'contains', forceOnline = false, extraParams: any = {}) {
    // console.log(environment.url_api)
    const online = forceOnline || await this.networkSvc.refreshStatus();

    if (!online) {
      return this.localResponse(await this.offlineDb.queryRecords('products', { search: search_value, searchType: search_type }));
    }

    return await apiClient
      .get(`${environment.url_api}/products`, {params: {search : search_value, search_type, ...extraParams}, withCredentials: true })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        await this.offlineDb.upsertRecords('products', data.data?.data || [], 'CODPRD');
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          return this.localResponse(await this.offlineDb.queryRecords('products', { search: search_value, searchType: search_type }));
        }

        throw error;
      });
  }

  async updateProduct(codprd: string, payload: any) {
    if (!(await this.networkSvc.refreshStatus())) {
      const stored = await this.offlineDb.getRecord<any>('products', codprd);
      await this.offlineDb.upsertRecords('products', [{ ...(stored || {}), ...payload, CODPRD: codprd }], 'CODPRD');
      return this.localResponse(await this.pendingQueue.enqueue('product', 'PUT', `/products/${encodeURIComponent(codprd)}`, payload));
    }

    return await apiClient
      .put(`${environment.url_api}/products/${encodeURIComponent(codprd)}`, payload, { withCredentials: true })
      .then(async (data) => {
        const updated = data.data?.data || payload;
        await this.offlineDb.upsertRecords('products', [{ ...updated, CODPRD: codprd }], 'CODPRD');
        return data;
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          const stored = await this.offlineDb.getRecord<any>('products', codprd);
          await this.offlineDb.upsertRecords('products', [{ ...(stored || {}), ...payload, CODPRD: codprd }], 'CODPRD');
          return this.localResponse(await this.pendingQueue.enqueue('product', 'PUT', `/products/${encodeURIComponent(codprd)}`, payload));
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
