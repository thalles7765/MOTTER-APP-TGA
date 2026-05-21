import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  async getPaymentsType(search_value = '') {
    return await axios
      .get(`${environment.url_api}/utils/payments`, { params: { search: search_value }, withCredentials: true })
      .then((data) => {
        return data
      });
  }


  async getMovementsType(search_value = '') {
    return await axios
      .get(`${environment.url_api}/utils/movements`, { params: { search: search_value }, withCredentials: true })
      .then((data) => {
        return data
      });
  }


  async getSellers(params_req = {}) {
    return await axios
      .get(`${environment.url_api}/utils/sellers`, { params: params_req, withCredentials: true })
      .then((data) => {
        return data
      });
  }
}
