// src/app/operacao/service/operacao.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperacaoDTO, Page } from '../../dto/operacao-dto';        // ajuste caminho se necessário
import { environment } from '../../../environments/environment';     // ajuste caminho se necessário

const API = '/api/operacoes';

type StatusFiltro = '' | 'Ativo' | 'Inativo';

export interface ListParams {
  page?: number;
  size?: number;
  sort?: string;           // ex.: 'id,desc'
  status?: StatusFiltro;   // '' | 'Ativo' | 'Inativo'
  operadoraId?: string;    // ID em string pra facilitar o ngModel
  search?: string;         // busca livre
  pocoCodigoAnp?: string;  // filtro exato por poço
}

export interface CreatePayload {
  nomeOperacao: string;
  operadoraId: number;
  pocoCodigoAnp: string;
  status: boolean;
  dataInicio?: string;     // ISO local: 'YYYY-MM-DDTHH:mm:ss'
  dataFinal?: string;      // ISO local
}

export type PatchPayload = Partial<CreatePayload>;

@Injectable({ providedIn: 'root' })
export class OperacaoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080

  private url(path: string): string {
    const b = this.base?.endsWith('/') ? this.base.slice(0, -1) : this.base ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /** Lista paginada com filtros */
  list(params: ListParams = {}): Observable<Page<OperacaoDTO>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 10))
      .set('sort', params.sort ?? 'id,desc');

    // status -> boolean esperado pelo back
    if (params.status) {
      const bool = params.status === 'Ativo' ? 'true' : 'false';
      httpParams = httpParams.set('status', bool);
    }

    if (params.operadoraId) {
      httpParams = httpParams.set('operadoraId', params.operadoraId);
    }

    // respeita pocoCodigoAnp explícito; se não vier, usa search como fallback
    const poco = params.pocoCodigoAnp?.trim()
      || (params.search ? params.search.trim() : '');
    if (poco) {
      httpParams = httpParams.set('pocoCodigoAnp', poco);
    }

    return this.http.get<Page<OperacaoDTO>>(this.url(API), { params: httpParams });
  }

  /** Busca uma operação pelo ID */
  getById(id: number): Observable<OperacaoDTO> {
    return this.http.get<OperacaoDTO>(this.url(`${API}/${id}`));
  }

  /** Cria uma nova operação */
  create(data: CreatePayload): Observable<OperacaoDTO> {
    return this.http.post<OperacaoDTO>(this.url(API), data);
  }

  /** Atualiza parcialmente (PATCH) */
  patch(id: number, data: PatchPayload): Observable<OperacaoDTO> {
    return this.http.patch<OperacaoDTO>(this.url(`${API}/${id}`), data);
  }

  /** Deleta pelo ID */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`${API}/${id}`));
  }

  
}
