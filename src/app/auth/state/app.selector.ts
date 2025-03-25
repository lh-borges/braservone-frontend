// app.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from './auth.state';

// Seleciona o estado inteiro sob a key 'app'
export const selectAppState = createFeatureSelector<AppState>('app');

// Seleciona especificamente o baseUrl do estado
export const selectBaseUrl = createSelector(
  selectAppState,
  (state: AppState) => state.baseUrl
);