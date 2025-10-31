// src/app/auth/state/auth.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
  initAuth,
  initAuthSuccess,
  initAuthFailure,
  loginStart,
  loginSuccess,
  loginFailure,
} from './app.action';

import { AuthService } from '../../login/service/auth-service.service';
import { AuthResponse } from '../../login/model/auth-response.model';

// ✅ caminho correto a partir de src/app/auth/state -> src/environments/environment.ts
import { environment } from '../../../environments/environment';

// ✅ usa o mesmo tipo/helper do meta-reducer (schema { token, user })
import { getPersistedAuth, PersistedAuth } from './persist.metareducer';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  /** Hidratação no boot: tenta storage; se vazio, tenta cookie HttpOnly em /auth/me */
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initAuth),
      exhaustMap(() => {
        const cached: PersistedAuth | null = getPersistedAuth();

        if (cached?.user) {
          return of(initAuthSuccess({ userDetails: cached.user as AuthResponse }));
        }

        return this.http
          .get<AuthResponse>(`${environment.apiBaseUrl}/api/auth/me`, {
            withCredentials: true,
          })
          .pipe(
            map((user) => initAuthSuccess({ userDetails: user })),
            catchError(() => of(initAuthFailure()))
          );
      })
    )
  );

  /** Login */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginStart),
      exhaustMap(({ username, password }) =>
        this.authService.getAuthToken(username, password).pipe(
          map((userDetails: AuthResponse) => loginSuccess({ userDetails })),
          catchError((error: unknown) =>
            of(loginFailure({ error: this.normalizeError(error) }))
          )
        )
      )
    )
  );

  /** Navegação pós-login */
  navigateOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        tap(() => this.router.navigate(['/app']))
      ),
    { dispatch: false }
  );

  /** Normalização de erro */
  private normalizeError(error: unknown): { status?: number; message: string } {
    if (error instanceof HttpErrorResponse) {
      const status = error.status;
      const message =
        (error.error && (error.error.message || error.error.error)) ||
        error.message ||
        'Falha ao autenticar.';
      return { status, message };
    }
    return { message: 'Erro inesperado ao autenticar.' };
  }
}
