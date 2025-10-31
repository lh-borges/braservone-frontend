import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { PocoDTO } from '../../dto/poco-dto';
import { Poco } from '../../model/poco';

export interface PocoLite {
  codigoAnp: string;
  nome?: string;
}

/** Shape padrão do Spring Data Page */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página atual (0-based)
  size: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class PocoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080

  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  private extractList(body: any): any[] {
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.content)) return body.content;
    return [];
  }

  // ===================== LISTAS =====================

  /** ❗️Novo: GET paginado /api/pocos?page=&size=&sort=campo,dir */
  getPocosPaged(page = 0, size = 50, sort?: string[]): Observable<PageResponse<PocoDTO>> {
    let params = new HttpParams().set('page', page).set('size', size);
    (sort ?? []).forEach(s => params = params.append('sort', s)); // ex.: ['codigoAnp,asc']

    return this.http.get<PageResponse<PocoDTO>>(this.url('/api/pocos'), { params }).pipe(
      tap(res => console.debug('[Pocos] page:', {
        page: res.number, size: res.size, total: res.totalElements
      })),
      catchError(err => {
        console.error('[Pocos] falha ao buscar página /api/pocos', err);
        return throwError(() => err);
      })
    );
  }

  /** (Legado) GET /api/pocos sem paginação – mantém por compatibilidade */
  getAllPocos(): Observable<PocoDTO[]> {
    return this.http.get<any>(this.url('/api/pocos'), { observe: 'response' }).pipe(
      map(res => this.extractList(res.body) as PocoDTO[]),
      tap(lista => console.debug('[Pocos] recebidos (legacy):', lista?.length ?? 0)),
      catchError(err => {
        console.error('[Pocos] falha ao buscar /api/pocos (legacy)', err);
        return throwError(() => err);
      })
    );
  }

  /** GET /api/pocos (lite) – pronto para selects/autocomplete (usa legacy) */
  getAllPocosLite(): Observable<PocoLite[]> {
    return this.getAllPocos().pipe(
      map(lista =>
        (lista ?? [])
          .map(p => {
            const codigoAnp =
              (p as any)?.codANP ??
              (p as any)?.codigoAnp ??
              (p as any)?.codigo ??
              '';
            const nome =
              (p as any)?.nomeCampo ??
              (p as any)?.local ??
              undefined;
            return { codigoAnp, nome } as PocoLite;
          })
          .filter(p => !!p.codigoAnp)
          .sort((a, b) => a.codigoAnp.localeCompare(b.codigoAnp))
      )
    );
  }

  // ===================== CRUD =====================

  getByCodigoAnp(codigoAnp: string): Observable<Poco> {
    return this.http.get<Poco>(this.url(`/api/pocos/${encodeURIComponent(codigoAnp)}`));
  }

  createPoco(payload: Poco): Observable<Poco> {
    return this.http.post<Poco>(
      this.url('/api/pocos'),
      this.toBackendPayload(payload)
    );
  }

  updatePocoByCodigoAnp(codigoAnp: string, changes: Partial<Poco>): Observable<Poco> {
    return this.http.patch<Poco>(
      this.url(`/api/pocos/${encodeURIComponent(codigoAnp)}`),
      this.toBackendPayload(changes)
    );
  }

  deletePoco(codigoAnp: string): Observable<void> {
    return this.http.delete(
      this.url(`/api/pocos/${encodeURIComponent(codigoAnp)}`),
      { observe: 'response', responseType: 'text' as 'json' }
    ).pipe(
      map(() => undefined),
      catchError(err => {
        if (err?.status === 200 || err?.status === 204) return of(undefined as void);
        return throwError(() => err);
      })
    );
  }

  private toBackendPayload(src: Partial<Poco>): any {
    return { ...(src || {}) };
  }
}
