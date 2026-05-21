import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }

  async getData(search_value = '') {
    // console.log(environment.url_api)
    return await axios
      .get(`${environment.url_api}/products`, {params: {search : search_value}, withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        return data
      });
  }

}
