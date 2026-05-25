import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  async getPaymentsType(search_value = '') {
    return await apiClient
      .get(`${environment.url_api}/utils/payments`, { params: { search: search_value }, withCredentials: true })
      .then((data) => {
        return data
      });
  }


  async getMovementsType(search_value = '') {
    return await apiClient
      .get(`${environment.url_api}/utils/movements`, { params: { search: search_value }, withCredentials: true })
      .then((data) => {
        return data
      });
  }


  async getSellers(params_req = {}) {
    return await apiClient
      .get(`${environment.url_api}/utils/sellers`, { params: params_req, withCredentials: true })
      .then((data) => {
        return data
      });
  }

  async getCest(params_req = {}) {
    return this.getLookup('/utils/cest', params_req);
  }

  async getFiscalClassifications(params_req = {}) {
    return this.getLookup('/utils/fiscal-classifications', params_req);
  }

  async getGroups(params_req = {}) {
    return this.getLookup('/utils/groups', params_req);
  }

  async getManufacturers(params_req = {}) {
    return this.getLookup('/utils/manufacturers', params_req);
  }

  async getUnits(params_req = {}) {
    return this.getLookup('/utils/units', params_req);
  }

  private async getLookup(path: string, params_req = {}) {
    const params: any = { ...params_req };

    if (params.search && !params.q) {
      params.q = params.search;
      params.value = params.search;
    }

    return await apiClient
      .get(`${environment.url_api}${path}`, { params, withCredentials: true })
      .then((data) => data);
  }
}
