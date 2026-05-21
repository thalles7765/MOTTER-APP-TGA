import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor() { }

  async getData(params_req) {
    // console.log(environment.url_api)
    return await axios
      .get(`${environment.url_api}/clients`, { params: params_req, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        console.log('@@###')
        console.log(data.data)
        return data
      });
  }

}
