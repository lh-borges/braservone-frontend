// src/app/auth/state/app.action.ts
import { createAction, props } from '@ngrx/store';
import { AuthResponse } from '../../login/model/auth-response.model';

/** Erro normalizado para efeitos e componentes */
export type NormalizedError = { status?: number; message: string };

/**
 * Hidratação no boot (APP_INITIALIZER) para recuperar usuário após refresh.
 * O Effect vai:
 *   1) Ler do storage;
 *   2) (Opcional) Validar/renovar no back-end;
 *   3) Disparar success ou failure.
 */
export const initAuth = createAction('[Auth] Init');
export const initAuthSuccess = createAction(
  '[Auth] Init Success',
  props<{ userDetails: AuthResponse }>()
);
export const initAuthFailure = createAction('[Auth] Init Failure');

/** Fluxo de login */
export const loginStart = createAction(
  '[Auth] Login Start',
  props<{ username: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ userDetails: AuthResponse }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: NormalizedError }>()
);

/** Logout (limpa store + storage no meta-reducer) */
export const logoutUser = createAction('[Auth] Logout');
