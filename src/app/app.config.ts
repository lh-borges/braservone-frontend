// src/app/app.config.ts
import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

// NgRx
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { authReducer } from './auth/state/app.reducer';
import { AuthEffects } from './auth/state/auth.effects';
import { AUTH_FEATURE_KEY } from './auth/state/auth.state';

// Meta-reducer de persistência (root)
import { authMetaReducers } from './auth/state/persist.metareducer';

// Interceptors (⚠️ sem acento no path!)
import { AuthInterceptor } from './login/interceptor/auth-interceptor';
import { ErrorInterceptor } from './paginacao/interceptor/erro';

// Actions para hidratação
import { Store } from '@ngrx/store';
import { initAuth } from './auth/state/app.action';

function initAuthFactory() {
  const store = inject(Store);
  return () => store.dispatch(initAuth());
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Router primeiro, vida em paz com navegação inicial
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // --- NgRx root + feature (ordem importa)
    // Root store com meta-reducers de persistência
    provideStore(undefined, { metaReducers: authMetaReducers }),
    // Feature 'auth' (usa o AUTH_FEATURE_KEY)
    provideState(AUTH_FEATURE_KEY, authReducer),
    provideEffects(AuthEffects),

    // Devtools só em dev
    ...(isDevMode() ? [provideStoreDevtools()] : []),

    // --- HTTP + Interceptors (ordem: Auth -> Error)
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    // --- Hidratação de auth no boot (fail-closed se não houver storage)
    { provide: APP_INITIALIZER, useFactory: initAuthFactory, multi: true },
  ],
};
