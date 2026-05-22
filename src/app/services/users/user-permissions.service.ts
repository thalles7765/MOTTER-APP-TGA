import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { app_user } from 'src/app/interfaces/app-user';

export type UserPermissionsPayload = {
  admin: boolean;
  clients: boolean;
  products: boolean;
  movements: boolean;
  active: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class UserPermissionsService {
  async getUsers() {
    return apiClient
      .get(`${environment.url_api}/users`, { withCredentials: true })
      .then((response) => response.data?.data || []);
  }

  async updatePermissions(userId: number, payload: UserPermissionsPayload) {
    return apiClient.put(
      `${environment.url_api}/users/${userId}/permissions`,
      payload,
      { withCredentials: true }
    );
  }

  toPayload(user: app_user): UserPermissionsPayload {
    return {
      admin: Boolean(user.admin),
      clients: Boolean(user.clients),
      products: Boolean(user.products),
      movements: Boolean(user.movements),
      active: Boolean(user.active),
    };
  }
}
