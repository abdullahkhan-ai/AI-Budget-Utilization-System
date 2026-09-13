import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  map,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  if (!authService.getToken()) {

    return router.createUrlTree([
      '/login',
    ]);

  }


  return authService
    .checkSession()
    .pipe(

      map((valid) => {

        if (valid) {

          return true;

        }

        return router.createUrlTree([
          '/login',
        ]);

      })

    );

};