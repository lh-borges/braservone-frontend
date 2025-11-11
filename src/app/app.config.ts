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

// HTTP
import {
  provideHttpClient,
  withInterceptorsFromDi, // suporta interceptors de classe (Auth)
  withInterceptors,       // suporta interceptors funcionais (apiError)
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

// Interceptors
import { AuthInterceptor } from './login/interceptor/auth-interceptor';
// ❌ REMOVIDO: ErrorInterceptor class-based (evita conflito)
// import { ErrorInterceptor } from './paginacao/interceptor/erro';
import { apiErrorInterceptor } from './core/interceptor/api-error.interceptor';

// NgRx boot action
import { Store } from '@ngrx/store';
import { initAuth } from './auth/state/app.action';

// APP_INITIALIZER deve retornar void/Promise<void>
function initAuthFactory() {
  const store = inject(Store);
  return () => { store.dispatch(initAuth()); };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Router + Zone tweaks
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
    provideRouter(routes),

    // --- NgRx root + feature (ordem importa)
    provideStore(undefined, { metaReducers: authMetaReducers }),
    provideState(AUTH_FEATURE_KEY, authReducer),
    provideEffects(AuthEffects),
    ...(isDevMode() ? [provideStoreDevtools()] : []),

    // --- HTTP
    // 1) withInterceptorsFromDi → pega interceptors de classe (AuthInterceptor)
    // 2) withInterceptors([...]) → adiciona o interceptor funcional de erro
    //    Colocado DEPOIS para que:
    //      - no request: Auth rode antes (anexa token)
    //      - no response: apiError rode primeiro (captura e normaliza erros)
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([apiErrorInterceptor]),
    ),

    // Interceptor de Auth via DI
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    // ❌ Não registrar ErrorInterceptor class-based
    // { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    // --- Hidratação de auth no boot
    { provide: APP_INITIALIZER, useFactory: initAuthFactory, multi: true },
  ],
};
