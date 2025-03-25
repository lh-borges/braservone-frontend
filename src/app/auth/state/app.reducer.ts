// app.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { AppState, initialAppState } from './auth.state';
import { setBaseUrl } from './app.action';

export const appReducer = createReducer(
  initialAppState,
  // Essa linha permite atualizar o baseUrl se a action for disparada.
  on(setBaseUrl, (state, { url }) => ({
    ...state,
    baseUrl: url,
  }))
);