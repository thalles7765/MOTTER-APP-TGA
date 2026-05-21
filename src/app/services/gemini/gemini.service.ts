import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() { }

  async getAnswer(searchvalue = '') {
    // console.log(environment.url_api)
    return await apiClient
      .post(`${environment.url_api}/dialog`, {prompt: searchvalue}, { withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        return data
      });
  }
}
