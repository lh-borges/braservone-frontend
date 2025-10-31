// src/app/auth/state/persist.metareducer.ts
import { MetaReducer, ActionReducer } from '@ngrx/store';
import { AUTH_FEATURE_KEY, AuthState } from './auth.state';
import { logoutUser } from './app.action';

const STORAGE_KEY = 'app_auth';

/** Estrutura persistida no localStorage */
export interface PersistedAuth {
  token?: string;
  user?: any; // pode tipar como AuthResponse se quiser
}

export function persistAuthMetaReducer(
  reducer: ActionReducer<any>
): ActionReducer<any> {
  return (state, action) => {
    const nextState = reducer(state, action);

    const auth: AuthState | undefined = nextState?.[AUTH_FEATURE_KEY];

    if (auth?.isAuthenticated && auth.userDetails) {
      const snapshot: PersistedAuth = {
        token: (auth.userDetails as any).token, // ajuste conforme seu AuthResponse
        user: auth.userDetails,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }

    if (action.type === logoutUser.type) {
      localStorage.removeItem(STORAGE_KEY);
    }

    return nextState;
  };
}

/** Meta-reducers aplicados ao Store */
export const authMetaReducers: MetaReducer[] = [persistAuthMetaReducer];

/** Helper para ler o estado persistido */
export const getPersistedAuth = (): PersistedAuth | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedAuth) : null;
  } catch {
    return null;
  }
};
