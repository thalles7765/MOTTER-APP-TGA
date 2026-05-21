import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BranchService } from '../branches/branch.service';

export const authenticationGuard: CanActivateFn = (route, state) => {
  const authSvc = inject(AuthService);
  const branchSvc = inject(BranchService);
  const router = inject(Router);

  return authSvc.checkUserLogged().then(async (isAuthenticated) => {
    if (!isAuthenticated) {
      return router.createUrlTree(['/app/login']);
    }

    const selectedBranch = await branchSvc.getSelectedBranch();

    if (!selectedBranch && state.url !== '/app/home') {
      return router.createUrlTree(['/app/home']);
    }

    return true;
  }).catch(() => router.createUrlTree(['/app/login']));
};
