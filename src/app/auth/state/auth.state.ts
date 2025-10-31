// src/app/auth/state/auth.state.ts
import { AuthResponse } from '../../login/model/auth-response.model';

/**
 * Estado da feature 'auth'
 */
export interface AuthState {
  baseUrl: string;
  userDetails: AuthResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: { status?: number; message: string } | null;
}

/**
 * Estado inicial da feature 'auth'
 */
export const initialAuthState: AuthState = {
  baseUrl: 'http://localhost:8080/',
  userDetails: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/** Chave usada no Store e nos selectors para a feature 'auth' */
export const AUTH_FEATURE_KEY = 'auth';

/** Estado global (RootState), que contém a feature 'auth' */
export interface RootState {
  [AUTH_FEATURE_KEY]: AuthState;
}
