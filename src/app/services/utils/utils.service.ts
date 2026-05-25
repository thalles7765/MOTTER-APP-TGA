import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { OfflineDatabaseService, OfflineRecordType } from '../offline/offline-database.service';
import { NetworkService } from '../offline/network.service';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
    private networkSvc: NetworkService,
    private offlineDb: OfflineDatabaseService
  ) { }

  async getPaymentsType(search_value = '', forceOnline = false) {
    if (!forceOnline && !(await this.networkSvc.refreshStatus())) {
      return this.localResponse(await this.offlineDb.queryRecords('utils_payments', { search: search_value, searchType: 'contains' }));
    }

    return await apiClient
      .get(`${environment.url_api}/utils/payments`, { params: { search: search_value }, withCredentials: true })
      .then(async (data) => {
        await this.offlineDb.upsertRecords('utils_payments', data.data?.data || [], (item) => item.CODCONDPGTO || item.CODIGO || item.ID);
        return data
      }).catch(async (error) => this.handleLookupError(error, 'utils_payments', search_value));
  }


  async getMovementsType(search_value = '', forceOnline = false) {
    if (!forceOnline && !(await this.networkSvc.refreshStatus())) {
      return this.localResponse(await this.offlineDb.queryRecords('utils_movements', { search: search_value, searchType: 'contains' }));
    }

    return await apiClient
      .get(`${environment.url_api}/utils/movements`, { params: { search: search_value }, withCredentials: true })
      .then(async (data) => {
        await this.offlineDb.upsertRecords('utils_movements', data.data?.data || [], (item) => item.CODTIPOMOV || item.CODTMV || item.ID);
        return data
      }).catch(async (error) => this.handleLookupError(error, 'utils_movements', search_value));
  }


  async getSellers(params_req: any = {}, forceOnline = false) {
    if (!forceOnline && !(await this.networkSvc.refreshStatus())) {
      return this.localResponse(await this.offlineDb.queryRecords('utils_sellers', {
        search: params_req?.search,
        searchType: 'contains',
      }));
    }

    return await apiClient
      .get(`${environment.url_api}/utils/sellers`, { params: params_req, withCredentials: true })
      .then(async (data) => {
        await this.offlineDb.upsertRecords('utils_sellers', data.data?.data || [], (item) => item.CODVEN || item.CODIGO || item.ID);
        return data
      }).catch(async (error) => this.handleLookupError(error, 'utils_sellers', params_req?.search));
  }

  async getCest(params_req = {}, forceOnline = false) {
    return this.getLookup('/utils/cest', 'utils_cest', params_req, (item) => item.CEST, forceOnline);
  }

  async getFiscalClassifications(params_req = {}, forceOnline = false) {
    return this.getLookup('/utils/fiscal-classifications', 'utils_fiscal_classifications', params_req, (item) => item.CODCLAS, forceOnline);
  }

  async getGroups(params_req = {}, forceOnline = false) {
    return this.getLookup('/utils/groups', 'utils_groups', params_req, (item) => item.CODGRUPO, forceOnline);
  }

  async getManufacturers(params_req = {}, forceOnline = false) {
    return this.getLookup('/utils/manufacturers', 'utils_manufacturers', params_req, (item) => item.CODFAB, forceOnline);
  }

  async getUnits(params_req = {}, forceOnline = false) {
    return this.getLookup('/utils/units', 'utils_units', params_req, (item) => item.CODUND, forceOnline);
  }

  private async getLookup(path: string, type: OfflineRecordType, params_req: any = {}, keyFn: (item: any) => string, forceOnline = false) {
    const params: any = { ...params_req };

    if (params.search && !params.q) {
      params.q = params.search;
      params.value = params.search;
    }

    if (!forceOnline && !(await this.networkSvc.refreshStatus())) {
      return this.localResponse(await this.offlineDb.queryRecords(type, { search: params.search || params.q || params.value, searchType: 'contains' }));
    }

    return await apiClient
      .get(`${environment.url_api}${path}`, { params, withCredentials: true })
      .then(async (data) => {
        await this.offlineDb.upsertRecords(type, data.data?.data || [], keyFn);
        return data;
      }).catch(async (error) => this.handleLookupError(error, type, params.search || params.q || params.value));
  }

  private async handleLookupError(error: any, type: OfflineRecordType, search = '') {
    if (!error?.response) {
      return this.localResponse(await this.offlineDb.queryRecords(type, { search, searchType: 'contains' }));
    }

    throw error;
  }

  private localResponse(data: any) {
    return { status: 200, data: { error: false, message: 'Dados locais consultados com sucesso.', data, offline: true } };
  }
}
