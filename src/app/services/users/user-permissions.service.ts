import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { app_user } from 'src/app/interfaces/app-user';
import axios from 'axios';

export type UserPermissionsPayload = {
  admin: boolean;
  clients: boolean;
  products: boolean;
  movements: boolean;
  active: boolean;
};

export type UserBranchDefaultsPayload = {
  id: number;
  codven: string | null;
  default_branch: number | null;
  select_branch: boolean;
  default_seller: string | null;
  default_movement: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class UserPermissionsService {
  async getUsers() {
    return axios
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

  async updateBranchDefaults(payload: UserBranchDefaultsPayload) {
    return axios.put(
      `${environment.url_api}/users/branch`,
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

  toBranchDefaultsPayload(user: app_user): UserBranchDefaultsPayload {
    const codven = user.default_seller || null;

    return {
      id: Number(user.id || user.ID || 0),
      codven,
      default_branch: Number(user.default_branch || 1),
      select_branch: Boolean(user.select_branch),
      default_seller: codven,
      default_movement: user.default_movement || null,
    };
  }
}
