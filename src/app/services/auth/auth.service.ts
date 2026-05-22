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
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        // console.log(data.data)
        this.setCurrentUser(data.data?.data || null);
        return data
      });
  }

  async logoutUser() {
    // console.log(environment.url_api)
    console.log('logout');
    await this.branchSvc.clearSelectedBranch();
    await this.branchSvc.clearBranchPolicy();
    await this.clearCurrentUser();

    return await axios
      .post(`${environment.url_api}/auth/logout`, {}, { withCredentials: true })
      .then((data) => {
        // this.ROUTES = data.data.data;
        // console.log('@@###')
        console.log(data.data)
        // this._router.navigate(['/app/login']);

        return data
      });
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
    this.currentUserSubject.next(user);

    if (!user) {
      await Preferences.remove({ key: currentUserKey });
      return;
    }

    await Preferences.set({ key: currentUserKey, value: JSON.stringify(user) });
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
    this.currentUserSubject.next(parsedUser);

    return parsedUser;
  }

  async isAdmin() {
    const currentUser = await this.getCurrentUser();

    return this.toBoolean(currentUser?.admin);
  }

  private async clearCurrentUser() {
    await this.setCurrentUser(null);
  }

  private async hydrateCurrentUser() {
    await this.getCurrentUser();
  }

  private toBoolean(value: any) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

}
