// src/app/auth/guard.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { RootState } from './state/auth.state';           // <<< usa RootState
import { selectUserDetails } from './state/app.selector';
import { AuthResponse } from '../login/model/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private store = inject(Store<RootState>);               // <<< tipa a Store com RootState
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectUserDetails).pipe(
      take(1),
      map((userDetails: AuthResponse | null) => {
        if (!userDetails) {
          return this.router.createUrlTree(['/login']);
        }

        const roles = userDetails.roles ?? [];
        return (roles.includes('ROLE_OI') || roles.includes('ROLE_TESTE'))
          ? true
          : this.router.createUrlTree(['/unauthorized']);
      })
    );
  }
}
