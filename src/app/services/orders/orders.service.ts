import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { order } from 'src/app/interfaces/order';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor() { }

  async getData(params_req = {}) {
    // console.log(environment.url_api)
    return await apiClient
      .get(`${environment.url_api}/orders`, { params: params_req, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        return data
      });
  }


  async getItemsOrder(idmov_req = 0) {
    // console.log(environment.url_api)
    return await apiClient
      .get(`${environment.url_api}/orders/item`, { params: { idmov: idmov_req }, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        return data
      });
  }

  async createOrder(orderData: order) {
    // console.log(environment.url_api)
    return await apiClient
      .post(`${environment.url_api}/orders`, orderData, { params: { codcfo: orderData.CODCFO, codtmv: orderData.CODTMV, codcpg: orderData.CODCPG }, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        return data
      });
  }

  async updateOrder(orderData: order) {
    return await apiClient
      .put(`${environment.url_api}/orders`, orderData, { withCredentials: true })
      .then((data) => {
        return data
      });
  }
}
