// src/app/auth/guards/role.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated, selectUserRoles } from "../auth/state/app.selector";
import { map, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const roleGuard = (required: string[] = []): CanActivateFn => {
  return (route) => {
    const store = inject(Store);
    const router = inject(Router);

    // permite configurar pelas rotas também: data: { roles: [...] }
    const need = required.length ? required : (route.data?.['roles'] as string[] | undefined) ?? [];

    return combineLatest([
      store.select(selectIsAuthenticated).pipe(take(1)),
      store.select(selectUserRoles).pipe(take(1)),
    ]).pipe(
      map(([isAuth, roles]) => {
        if (!isAuth) return router.parseUrl('/login');
        if (need.length === 0) return true; // nenhuma role exigida
        const ok = roles.some(r => need.includes(r));
        return ok ? true : router.parseUrl('/');
      })
    );
  };
};
