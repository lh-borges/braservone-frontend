// src/app/state/auth.state.ts


  export interface AppState {
    baseUrl: string;
  }
 
  export const initialAppState: AppState = {
    baseUrl: 'https:localhost:8080/', // Valor inicial do URL
  };
  ;