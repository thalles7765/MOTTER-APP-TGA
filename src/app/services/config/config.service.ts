import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() { }

  async getData(params_req = {}) {
    // console.log(environment.url_api)
    return await apiClient
      .get(`${environment.url_api}/config`, { params: params_req, withCredentials: true })
      .then((data) => {
        // console.log('@@###')
        // console.log(data.data)
        return data
      });
  }

}
