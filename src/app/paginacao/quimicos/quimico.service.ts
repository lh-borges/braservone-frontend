// src/app/quimicos/quimico.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = '/api/quimicos';

export type Estado =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES'
  | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR'
  | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC'
  | 'SP' | 'SE' | 'TO';

export type TipoQuimico =
  | 'ACELERADORES'
  | 'RETARDADORES'
  | 'EXTENSORES'
  | 'ADITIVOS_PESO'
  | 'DISPERSANTE'
  | 'CONTROLADORES'
  | 'ANTIESPUMANTE';

export type UnidadeCode = 'm' | 'kg' | 'bbl' | 'unid' | 'l' | 'gal' | 'saco';

export enum StatusQuimicos {
  ATIVO = 'ATIVO',
  FINALIZADO = 'FINALIZADO'
}

export interface FornecedorLite {
  id: number;
  nome: string;
}

export interface QuimicoDTO {
  codigo: number;
  tipoQuimico: TipoQuimico;
  fornecedor?: FornecedorLite | null;
  lote?: string | null;
  valorQuimico?: number | null;
  unidade: UnidadeCode;
  estoqueInicial: number;
  dataCompra?: string | null;
  statusQuimicos: StatusQuimicos;
  estadoLocalArmazenamento?: Estado | null;
  observacao?: string | null;
}

export interface QuimicoCreatePayload {
  tipoQuimico: TipoQuimico;
  fornecedorId: number;
  lote?: string | null;
  valorQuimico?: number | null;
  unidade: UnidadeCode;
  estoqueInicial: number;
  dataCompra?: string | null;
  statusQuimicos: StatusQuimicos;
  estadoLocalArmazenamento?: Estado | null;
  observacao?: string | null;
}

export type QuimicoUpdatePayload = QuimicoCreatePayload;

export interface UnidadeOption {
  code: UnidadeCode;
  label: string;
  step: number;
}
export const UNIDADES_OPTIONS: UnidadeOption[] = [
  { code: 'kg',   label: 'kg (Quilo)',      step: 0.001 },
  { code: 'l',    label: 'L (Litro)',       step: 0.001 },
  { code: 'gal',  label: 'gal (Gallon)',    step: 0.001 },
  { code: 'bbl',  label: 'bbl (Barril)',    step: 0.001 },
  { code: 'saco', label: 'saco (Saco/Bag)', step: 1     },
  { code: 'unid', label: 'unid (Unidade)',  step: 1     },
  { code: 'm',    label: 'm (Metro)',       step: 0.01  },
];

@Injectable({ providedIn: 'root' })
export class QuimicoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  private normalizeUnidade(u: unknown): UnidadeCode {
    const v = String(u ?? '').trim().toLowerCase();
    const valid: UnidadeCode[] = ['m', 'kg', 'bbl', 'unid', 'l', 'gal', 'saco'];
    if ((valid as string[]).includes(v)) return v as UnidadeCode;
    switch (v) {
      case 'meter': return 'm';
      case 'litro':
      case 'lt': return 'l';
      case 'gallon': return 'gal';
      case 'barrel': return 'bbl';
      case 'un': case 'unidade': return 'unid';
      case 'bag': return 'saco';
      default: return 'kg';
    }
  }

  listar(): Observable<QuimicoDTO[]> {
    return this.http.get<QuimicoDTO[]>(this.url(API));
  }

  listarAtivo(): Observable<QuimicoDTO[]> {
    return this.http.get<QuimicoDTO[]>(this.url(`${API}/ativos`));
  }

  obter(codigo: number): Observable<QuimicoDTO> {
    return this.http.get<QuimicoDTO>(this.url(`${API}/${codigo}`));
  }

  criar(payload: QuimicoCreatePayload): Observable<QuimicoDTO> {
    const body: any = {
      tipoQuimico: payload.tipoQuimico,
      fornecedor: payload.fornecedorId != null ? { id: payload.fornecedorId } : null,
      lote: payload.lote ?? null,
      valorQuimico: payload.valorQuimico ?? null,
      unidade: this.normalizeUnidade(payload.unidade),
      estoqueInicial: payload.estoqueInicial,
      dataCompra: payload.dataCompra ?? null,
      statusQuimicos: payload.statusQuimicos,
      estadoLocalArmazenamento: payload.estadoLocalArmazenamento ?? null,
      observacao: payload.observacao ?? null,
    };
    return this.http.post<QuimicoDTO>(this.url(API), body);
  }

  atualizar(codigo: number, payload: QuimicoUpdatePayload): Observable<QuimicoDTO> {
    const body: any = {
      tipoQuimico: payload.tipoQuimico,
      fornecedor: payload.fornecedorId != null ? { id: payload.fornecedorId } : null,
      lote: payload.lote ?? null,
      valorQuimico: payload.valorQuimico ?? null,
      unidade: this.normalizeUnidade(payload.unidade),
      estoqueInicial: payload.estoqueInicial,
      dataCompra: payload.dataCompra ?? null,
      statusQuimicos: payload.statusQuimicos,
      estadoLocalArmazenamento: payload.estadoLocalArmazenamento ?? null,
      observacao: payload.observacao ?? null,
    };
    return this.http.put<QuimicoDTO>(this.url(`${API}/${codigo}`), body);
  }

  remover(codigo: number): Observable<void> {
    return this.http.delete<void>(this.url(`${API}/${codigo}`));
  }

  listarEstoqueAgrupado(): Observable<Array<{ tipoQuimico: string; estadoLocalArmazenamento: string | null; estoqueTotal: number }>> {
    return this.http.get<Array<{ tipoQuimico: string; estadoLocalArmazenamento: string | null; estoqueTotal: number }>>(
      this.url('/api/quimicos/estoque-agrupado')
    );
  }
}
