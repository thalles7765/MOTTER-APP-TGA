import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { security_request, SecurityRequestUpdatePayload } from 'src/app/interfaces/security-request';
import { apiClient } from '../api/api-client';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  async getRequests(codfilial: number): Promise<security_request[]> {
    return apiClient
      .get(`${environment.url_api}/security`, {
        params: { codfilial },
        withCredentials: true
      })
      .then((response) => response.data?.data || []);
  }

  async updateRequest(payload: SecurityRequestUpdatePayload) {
    return apiClient.put(`${environment.url_api}/security`, payload, { withCredentials: true });
  }
}
