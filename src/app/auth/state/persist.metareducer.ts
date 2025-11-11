// src/app/auth/state/persist.metareducer.ts
import { MetaReducer, ActionReducer } from '@ngrx/store';
import { AUTH_FEATURE_KEY, AuthState } from './auth.state';
import { logoutUser } from './app.action';

const STORAGE_KEY = 'app_auth';

/** Estrutura persistida no localStorage */
export interface PersistedAuth {
  token?: string;
  user?: any; // opcionalmente: AuthResponse
}

function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function persistAuthMetaReducer(
  reducer: ActionReducer<any>
): ActionReducer<any> {
  return (state, action) => {
    const nextState = reducer(state, action);

    const auth: AuthState | undefined = nextState?.[AUTH_FEATURE_KEY];

    // Se houver slice de auth
    if (auth) {
      if (auth.isAuthenticated && auth.userDetails) {
        const snapshot: PersistedAuth = {
          // Se usar cookie HttpOnly, token pode ser undefined — tudo bem
          token: (auth.userDetails as any)?.token,
          user: auth.userDetails,
        };
        safeSet(STORAGE_KEY, JSON.stringify(snapshot));
      } else {
        // Desautenticado (expirou, falhou init, etc.) => limpa
        safeRemove(STORAGE_KEY);
      }
    }

    // Redundância explícita no logout
    if (action.type === logoutUser.type) {
      safeRemove(STORAGE_KEY);
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
