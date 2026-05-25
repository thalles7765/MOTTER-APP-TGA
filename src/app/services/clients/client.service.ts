import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor() { }

  async getData(params_req) {
    // console.log(environment.url_api)
    return await apiClient
      .get(`${environment.url_api}/clients`, { params: params_req, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        console.log('@@###')
        console.log(data.data)
        return data
      });
  }

  async updateClient(codcfo: string, payload: any) {
    return await apiClient
      .put(`${environment.url_api}/clients/${encodeURIComponent(codcfo)}`, payload, { withCredentials: true })
      .then((data) => data);
  }

}
