// src/app/auth/state/app.selector.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AUTH_FEATURE_KEY, AuthState } from './auth.state';

/** Slice 'auth' */
export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

/** baseUrl */
export const selectBaseUrl = createSelector(
  selectAuthState,
  (s) => s.baseUrl
);

/** Detalhes do usuário logado */
export const selectUserDetails = createSelector(
  selectAuthState,
  (s) => s.userDetails
);

/** Está autenticado? */
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (s) => s.isAuthenticated
);

/** Token JWT (preferindo accessToken se existir) */
export const selectToken = createSelector(
  selectUserDetails,
  (u) => u?.accessToken ?? u?.token ?? null
);

/** Roles do usuário ([]) */
export const selectUserRoles = createSelector(
  selectUserDetails,
  (u) => u?.roles ?? []
);

/** Empresa (objeto completo se existir) */
export const selectEmpresa = createSelector(
  selectUserDetails,
  (u) => u?.empresa ?? null
);

/** Campos úteis do usuário */
export const selectUsername = createSelector(selectUserDetails, (u) => u?.username ?? null);
export const selectUserName  = createSelector(selectUserDetails, (u) => u?.nome ?? null);
export const selectUserEmail = createSelector(selectUserDetails, (u) => u?.email ?? null);

/** Flag de carregamento do Auth */
export const selectAuthLoading = createSelector(
  selectAuthState,
  (s) => s.loading
);

/** Erro de autenticação normalizado (ou null) */
export const selectAuthError = createSelector(
  selectAuthState,
  (s) => s.error
);

/** Seletor-fábrica para checar 1 role */
export const selectHasRole = (role: string) =>
  createSelector(selectUserRoles, (roles) => roles.includes(role));

/** Seletor-fábrica para checar qualquer de várias roles */
export const selectHasAnyRole = (required: string[]) =>
  createSelector(selectUserRoles, (roles) => required.some(r => roles.includes(r)));
