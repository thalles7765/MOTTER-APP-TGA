import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';


export const authenticationGuard: CanActivateFn = (route, state) => {
  const authSvc = inject(AuthService);
  const router = inject(Router);

  // console.log('CHECK LOGIN')
  // console.log(authSvc.checkLogin)
  try {
    return Boolean(

      authSvc.checkUserLogged().then((isAuthenticated) => {
        // console.log('authenticated ##: ', isAuthenticated);
        if (Boolean(isAuthenticated) === false) {
          router.navigate(['/app/login']);

        }
        return isAuthenticated;
      })
    );
  } catch (error) {
    console.log('Erro ao verificar autenticação')
    router.navigate(['/app/login']);
    return false;
  }

}
