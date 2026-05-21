import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { environment } from 'src/environments/environment';
import { BranchService } from '../branches/branch.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private _router: Router, private branchSvc: BranchService) { }

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
        return data
      });
  }

  async logoutUser() {
    // console.log(environment.url_api)
    console.log('logout');
    await this.branchSvc.clearSelectedBranch();
    await this.branchSvc.clearBranchPolicy();

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
        return Boolean(true);
      }).catch(async (err) => {
        // console.log('56sa1d51as6d16as1d6a1s56d1sa6')
        return false
      });
  }

}
