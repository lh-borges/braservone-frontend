// src/app/auth/state/app.selector.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AUTH_FEATURE_KEY, AuthState } from './auth.state'; // <- use a chave do próprio state

/** Slice 'auth' */
export const selectAuthState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

/** baseUrl (se você ainda usa no front) */
export const selectBaseUrl = createSelector(
  selectAuthState,
  (s) => s.baseUrl
);

/** Detalhes do usuário logado */
export const selectUserDetails = createSelector(
  selectAuthState,
  (s) => s.userDetails
);

/** Token JWT (se existir no seu AuthResponse) */
export const selectToken = createSelector(
  selectUserDetails,
  (u) => u?.token ?? null
);

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
