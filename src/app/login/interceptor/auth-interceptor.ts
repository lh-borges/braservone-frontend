// src/app/login/interceptor/auth-interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { RootState } from '../../auth/state/auth.state';
import { selectToken } from '../../auth/state/app.selector';
import { logoutUser } from '../../auth/state/app.action';
import { getPersistedAuth } from '../../auth/state/persist.metareducer';

// 🔧 (opcional) se você tiver environment.apiBaseUrl definido
import { environment } from '../../../environments/environment'; // ajuste o path se necessário

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private store = inject<Store<RootState>>(Store as any);

  // APIs confiáveis que DEVEM receber o token (ajuste se tiver mais de um host)
  private readonly allowedApiPrefixes = [
    this.stripTrailingSlash(environment?.apiBaseUrl ?? ''), // ex.: http://localhost:8080
  ].filter(Boolean);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 0) Não precisa token para preflight
    if (req.method === 'OPTIONS') {
      return next.handle(req).pipe(catchError(err => this.handleAuthError(err)));
    }

    // 1) Pula endpoints públicos (login/refresh/assets/configs)
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req).pipe(catchError(err => this.handleAuthError(err)));
    }

    // 2) Se a URL for absoluta e NÃO pertencer à sua API, trata como externo → não injeta
    if (this.isAbsolutelyExternalToApi(req.url)) {
      return next.handle(req).pipe(catchError(err => this.handleAuthError(err)));
    }

    // 3) Se já veio Authorization, não sobrescreve
    if (req.headers.has('Authorization')) {
      return next.handle(req).pipe(catchError(err => this.handleAuthError(err)));
    }

    // 4) Token: Store → fallback storage
    return this.store.select(selectToken).pipe(
      take(1),
      map((storeToken) => storeToken ?? getPersistedAuth()?.token ?? null),
      switchMap((token) => {
        const authReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req; // sem token, segue cru (o backend pode responder 401)

        return next.handle(authReq).pipe(catchError(err => this.handleAuthError(err)));
      })
    );
  }

  private handleAuthError(err: any) {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      // dispara logout; meta-reducer limpa storage
      
    }
    return throwError(() => err);
  }

  private isPublicEndpoint(url: string): boolean {
    const u = this.safeURL(url);
    const path = u?.pathname ?? url; // suporta relativas
    return (
      path.includes('/api/auth') || // login, refresh, me
      path.includes('/assets/') ||
      path.endsWith('.json')
    );
  }

  // true se a URL for absoluta E não começar com nenhum prefixo de API permitido
  private isAbsolutelyExternalToApi(url: string): boolean {
    try {
      // se for relativa, nunca é "absolutamente externa"
      if (!/^https?:\/\//i.test(url)) return false;

      const abs = new URL(url, window.location.origin).href;
      return !this.allowedApiPrefixes.some(prefix => abs.startsWith(prefix));
    } catch {
      return false;
    }
  }

  private safeURL(url: string): URL | null {
    try {
      return new URL(url, window.location.origin);
    } catch {
      return null;
    }
  }

  private stripTrailingSlash(v: string): string {
    return v?.replace(/\/+$/, '') ?? '';
  }
}
