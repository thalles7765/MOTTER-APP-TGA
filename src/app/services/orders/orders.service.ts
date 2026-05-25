import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { order } from 'src/app/interfaces/order';
import { environment } from 'src/environments/environment';
import { NetworkService } from '../offline/network.service';
import { OfflineDatabaseService } from '../offline/offline-database.service';
import { PendingQueueService } from '../offline/pending-queue.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(
    private networkSvc: NetworkService,
    private offlineDb: OfflineDatabaseService,
    private pendingQueue: PendingQueueService
  ) { }

  async getData(params_req: any = {}, forceOnline = false) {
    // console.log(environment.url_api)
    const online = forceOnline || await this.networkSvc.refreshStatus();

    if (!online) {
      return this.localResponse(await this.offlineDb.queryRecords('orders', {
        search: params_req?.search,
        searchType: 'contains',
        codfilial: params_req?.codfilial,
      }));
    }

    return await apiClient
      .get(`${environment.url_api}/orders`, { params: params_req, withCredentials: true })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        await this.offlineDb.upsertRecords('orders', data.data?.data || [], (item) => String(item.IDMOV || item.NUMEROMOV || `${item.CODFILIAL}-${item.CODTMV}-${item.DATAEMISSAO}`));
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          return this.localResponse(await this.offlineDb.queryRecords('orders', {
            search: params_req?.search,
            searchType: 'contains',
            codfilial: params_req?.codfilial,
          }));
        }

        throw error;
      });
  }


  async getItemsOrder(idmov_req = 0) {
    // console.log(environment.url_api)
    if (!(await this.networkSvc.refreshStatus())) {
      return this.localResponse(await this.offlineDb.queryRecords('order_items', { search: String(idmov_req), searchType: 'contains' }));
    }

    return await apiClient
      .get(`${environment.url_api}/orders/item`, { params: { idmov: idmov_req }, withCredentials: true })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        await this.offlineDb.upsertRecords('order_items', data.data?.data || [], (item) => `${idmov_req}-${item.NSEQ || item.CODPRD}`);
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          return this.localResponse(await this.offlineDb.queryRecords('order_items', { search: String(idmov_req), searchType: 'contains' }));
        }

        throw error;
      });
  }

  async createOrder(orderData: order) {
    // console.log(environment.url_api)
    if (!(await this.networkSvc.refreshStatus())) {
      const queued = await this.pendingQueue.enqueue('order_create', 'POST', '/orders', orderData, {
        codempresa: orderData.CODEMPRESA,
        codfilial: orderData.CODFILIAL,
      });
      const localOrder = { ...orderData, IDMOV: queued.offline_request_id, NUMEROMOV: queued.offline_request_id, OFFLINE_STATUS: 'pending' };
      await this.offlineDb.upsertRecords('orders', [localOrder], 'IDMOV');
      await this.offlineDb.upsertRecords('order_items', (orderData.ITEMS || []).map((item) => ({ ...item, IDMOV: queued.offline_request_id })), (item) => `${queued.offline_request_id}-${item.NSEQ || item.CODPRD}`);
      return this.localResponse(localOrder);
    }

    return await apiClient
      .post(`${environment.url_api}/orders`, orderData, {
        params: { codcfo: orderData.CODCFO, codtmv: orderData.CODTMV, codcpg: orderData.CODCPG },
        withCredentials: true,
        headers: { 'X-Offline-Request-Id': (orderData as any).offline_request_id || '' },
      })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        const created = data.data?.data || orderData;
        await this.offlineDb.upsertRecords('orders', [created], (item) => String(item.IDMOV || item.NUMEROMOV || Date.now()));
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          const queued = await this.pendingQueue.enqueue('order_create', 'POST', '/orders', orderData, {
            codempresa: orderData.CODEMPRESA,
            codfilial: orderData.CODFILIAL,
          });
          const localOrder = { ...orderData, IDMOV: queued.offline_request_id, NUMEROMOV: queued.offline_request_id, OFFLINE_STATUS: 'pending' };
          await this.offlineDb.upsertRecords('orders', [localOrder], 'IDMOV');
          await this.offlineDb.upsertRecords('order_items', (orderData.ITEMS || []).map((item) => ({ ...item, IDMOV: queued.offline_request_id })), (item) => `${queued.offline_request_id}-${item.NSEQ || item.CODPRD}`);
          return this.localResponse(localOrder);
        }

        throw error;
      });
  }

  async updateOrder(orderData: order) {
    if (!(await this.networkSvc.refreshStatus())) {
      await this.offlineDb.upsertRecords('orders', [{ ...orderData, OFFLINE_STATUS: 'pending_update' }], 'IDMOV');
      await this.offlineDb.upsertRecords('order_items', (orderData.ITEMS || []).map((item) => ({ ...item, IDMOV: orderData.IDMOV })), (item) => `${orderData.IDMOV}-${item.NSEQ || item.CODPRD}`);
      return this.localResponse(await this.pendingQueue.enqueue('order_update', 'PUT', '/orders', orderData, {
        codempresa: orderData.CODEMPRESA,
        codfilial: orderData.CODFILIAL,
      }));
    }

    return await apiClient
      .put(`${environment.url_api}/orders`, orderData, { withCredentials: true })
      .then(async (data) => {
        await this.offlineDb.upsertRecords('orders', [data.data?.data || orderData], 'IDMOV');
        return data
      }).catch(async (error) => {
        if (this.isNetworkError(error)) {
          await this.offlineDb.upsertRecords('orders', [{ ...orderData, OFFLINE_STATUS: 'pending_update' }], 'IDMOV');
          await this.offlineDb.upsertRecords('order_items', (orderData.ITEMS || []).map((item) => ({ ...item, IDMOV: orderData.IDMOV })), (item) => `${orderData.IDMOV}-${item.NSEQ || item.CODPRD}`);
          return this.localResponse(await this.pendingQueue.enqueue('order_update', 'PUT', '/orders', orderData, {
            codempresa: orderData.CODEMPRESA,
            codfilial: orderData.CODFILIAL,
          }));
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
