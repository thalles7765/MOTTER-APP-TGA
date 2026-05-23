import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BranchService } from '../branches/branch.service';
import { app_user } from 'src/app/interfaces/app-user';

const currentUserKey = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<app_user | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private _router: Router, private branchSvc: BranchService) {
    this.hydrateCurrentUser();
  }

  async authUser(user = '', password = '') {
    // console.log(environment.url_api)
    return await axios
      .post(`${environment.url_api}/auth`, {
        "username": user,
        "password": password
      }, { withCredentials: true })
      .then(async (data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        await this.setCurrentUser(data.data?.data || null);
        return data
      });
  }

  async logoutUser() {
    try {
      return await axios.post(`${environment.url_api}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.log('Falha ao solicitar logout remoto. Limpando sessao local.', error);
      return null;
    } finally {
      await this.clearAppSession();
    }
  }

  async checkUserLogged() {
    return axios
      .post(`${environment.url_api}/auth/check`, {}, { withCredentials: true })
      .then(async (data: any) => {
        // console.log(data?.data)
        if (data.data?.data) {
          await this.setCurrentUser(data.data.data);
        }
        return Boolean(true);
      }).catch(async (err) => {
        // console.log('56sa1d51as6d16as1d6a1s56d1sa6')
        return false
      });
  }

  async setCurrentUser(user: app_user | null) {
    if (!user) {
      this.currentUserSubject.next(null);
      await Preferences.remove({ key: currentUserKey });
      return;
    }

    const currentUser = await this.completeUserPermissions(user, this.normalizeUser(user));

    this.currentUserSubject.next(currentUser);
    await Preferences.set({ key: currentUserKey, value: JSON.stringify(currentUser) });
  }

  async getCurrentUser() {
    const currentUser = this.currentUserSubject.value;

    if (currentUser) {
      return currentUser;
    }

    const storedUser = await Preferences.get({ key: currentUserKey });

    if (!storedUser.value) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser.value) as app_user;
    const completedUser = await this.completeUserPermissions(parsedUser, this.normalizeUser(parsedUser));

    this.currentUserSubject.next(completedUser);
    await Preferences.set({ key: currentUserKey, value: JSON.stringify(completedUser) });

    return completedUser;
  }

  async isAdmin() {
    const currentUser = await this.getCurrentUser();

    return this.toBoolean(currentUser?.admin);
  }

  private async clearCurrentUser() {
    await this.setCurrentUser(null);
  }

  private async clearAppSession() {
    await Promise.allSettled([
      this.branchSvc.clearSelectedBranch(),
      this.branchSvc.clearBranchPolicy(),
      this.clearCurrentUser(),
      Preferences.clear()
    ]);

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.log('Nao foi possivel limpar storage do navegador.', error);
    }

    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.log('Nao foi possivel limpar CacheStorage.', error);
    }
  }

  private async hydrateCurrentUser() {
    await this.getCurrentUser();
  }

  private normalizeUser(user: any): app_user {
    return {
      ...user,
      id: user.id || user.ID,
      user: user.user || user.USER || user.username || user.USERNAME,
      username: user.username || user.USERNAME || user.user || user.USER,
      email: user.email || user.EMAIL,
      admin: this.toBoolean(user.admin),
      clients: this.toBoolean(user.clients),
      products: this.toBoolean(user.products),
      movements: this.toBoolean(user.movements),
      active: user.active === undefined ? true : this.toBoolean(user.active),
      default_branch: user.default_branch,
      select_branch: this.toBoolean(user.select_branch),
      default_seller: user.default_seller || user.DEFAULT_SELLER || user.codven || user.CODVEN || null,
      default_seller_name: user.default_seller_name || user.DEFAULT_SELLER_NAME || user.seller_name || user.SELLER_NAME || null,
      default_movement: user.default_movement || user.DEFAULT_MOVEMENT || user.codtmv || user.CODTMV || null,
      default_movement_name: user.default_movement_name || user.DEFAULT_MOVEMENT_NAME || user.movement_name || user.MOVEMENT_NAME || null,
    };
  }

  private async completeUserPermissions(rawUser: any, user: app_user) {
    if (this.hasPermissionFields(rawUser)) {
      return user;
    }

    try {
      const response = await axios.get(`${environment.url_api}/users`, { withCredentials: true });
      const users = response.data?.data || [];
      const fullUser = users.find((item: any) => this.isSameUser(user, item));

      return fullUser ? this.normalizeUser({ ...user, ...fullUser }) : user;
    } catch (error) {
      return user;
    }
  }

  private hasPermissionFields(user: any) {
    return ['admin', 'clients', 'products', 'movements', 'active'].every((field) =>
      Object.prototype.hasOwnProperty.call(user, field)
    );
  }

  private isSameUser(currentUser: app_user, candidate: any) {
    const currentId = Number(currentUser.id || currentUser.ID || 0);
    const candidateId = Number(candidate.id || candidate.ID || 0);

    if (currentId > 0 && candidateId > 0) {
      return currentId === candidateId;
    }

    const currentLogin = String(currentUser.user || currentUser.USER || currentUser.username || currentUser.USERNAME || '').toUpperCase();
    const candidateLogin = String(candidate.user || candidate.USER || candidate.username || candidate.USERNAME || '').toUpperCase();
    const currentEmail = String(currentUser.email || currentUser.EMAIL || '').toUpperCase();
    const candidateEmail = String(candidate.email || candidate.EMAIL || '').toUpperCase();

    return Boolean(currentLogin && currentLogin === candidateLogin) || Boolean(currentEmail && currentEmail === candidateEmail);
  }

  private toBoolean(value: any) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

}
