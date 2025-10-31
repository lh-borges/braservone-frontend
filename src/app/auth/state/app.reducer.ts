// src/app/auth/state/app.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { initialAuthState, AuthState } from './auth.state';
import {
  initAuth,
  initAuthSuccess,
  initAuthFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  logoutUser,
} from './app.action';

export const authReducer = createReducer(
  initialAuthState,

  // ===== Hidratação no boot =====
  on(initAuth, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(initAuthSuccess, (state, { userDetails }): AuthState => ({
    ...state,
    loading: false,
    userDetails,
    isAuthenticated: true,
    error: null,
  })),

  on(initAuthFailure, (state): AuthState => ({
    ...state,
    loading: false,
    // mantém userDetails como está (páginas públicas continuam ok)
    isAuthenticated: !!state.userDetails,
  })),

  // ===== Login =====
  on(loginStart, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loginSuccess, (state, { userDetails }): AuthState => ({
    ...state,
    loading: false,
    userDetails,
    isAuthenticated: true,
    error: null,
  })),

  on(loginFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    isAuthenticated: false,
    error,
  })),

  // ===== Logout =====
  on(logoutUser, (state): AuthState => ({
    ...state,
    userDetails: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }))
);
