import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { security_request, SecurityRequestUpdatePayload } from 'src/app/interfaces/security-request';
import { apiClient } from '../api/api-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private requestsChangedSubject = new Subject<void>();
  requestsChanged$ = this.requestsChangedSubject.asObservable();

  async getRequests(codfilial?: number | null): Promise<security_request[]> {
    const params = codfilial ? { codfilial } : {};

    return apiClient
      .get(`${environment.url_api}/security`, {
        params,
        withCredentials: true
      })
      .then((response) => response.data?.data || []);
  }

  async updateRequest(payload: SecurityRequestUpdatePayload) {
    const response = await apiClient.put(`${environment.url_api}/security`, payload, { withCredentials: true });
    this.notifyRequestsChanged();

    return response;
  }

  notifyRequestsChanged() {
    this.requestsChangedSubject.next();
  }
}
