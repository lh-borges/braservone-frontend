// src/app/quimicos/quimico.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = '/api/quimicos';

/** UF do local de armazenamento */
export type Estado =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES'
  | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR'
  | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC'
  | 'SP' | 'SE' | 'TO';

/** Tipos de químico usados no sistema */
export type TipoQuimico =
  | 'ACELERADORES'
  | 'RETARDADORES'
  | 'EXTENSORES'
  | 'ADITIVOS_PESO'
  | 'DISPERSANTE'
  | 'CONTROLADORES'
  | 'ANTIESPUMANTE';

/** Códigos de unidade usados no front */
export type UnidadeCode = 'm' | 'kg' | 'bbl' | 'unid' | 'l' | 'gal' | 'saco';

/** Status do químico */
export enum StatusQuimicos {
  ATIVO = 'ATIVO',
  FINALIZADO = 'FINALIZADO'
}

/** Fornecedor simplificado que vem no QuimicoDTO */
export interface FornecedorLite {
  id: number;
  nome: string;
}

/** DTO do químico para listagem/edição */
export interface QuimicoDTO {
  codigo: number;
  tipoQuimico: TipoQuimico;
  fornecedor?: FornecedorLite | null;
  lote?: string | null;
  valorQuimico?: number | null;
  unidade: UnidadeCode;        // mapeado pelo front para códigos locais
  estoqueInicial: number;

  /** 🆕 campos novos alinhados ao back */
  estoqueUtilizado?: number;   // default 0 no back
  dataValidade?: string | null; // "yyyy-MM-dd" (LocalDate no back)

  /** já existente */
  dataCompra?: string | null;  // ISO (OffsetDateTime no back)
  statusQuimicos: StatusQuimicos;
  estadoLocalArmazenamento?: Estado | null;
  observacao?: string | null;
}

/** Payload para criar/atualizar (front → back) */
export interface QuimicoCreatePayload {
  tipoQuimico: TipoQuimico;
  fornecedorId: number;
  lote?: string | null;
  valorQuimico?: number | null;
  unidade: UnidadeCode;
  estoqueInicial: number;

  /** 🆕 LocalDate no back → mande "yyyy-MM-dd" sem timezone */
  dataValidade?: string | null;

  /** OffsetDateTime no back → pode enviar "yyyy-MM-ddT00:00:00Z" */
  dataCompra?: string | null;

  statusQuimicos: StatusQuimicos;
  estadoLocalArmazenamento?: Estado | null;
  observacao?: string | null;
}

export type QuimicoUpdatePayload = QuimicoCreatePayload;

/** Opções de unidade para formulários */
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

/** Linha do endpoint de estoque agrupado (back retorna 'estoqueAtual') */
export interface EstoqueAgrupadoRow {
  tipoQuimico: string;
  estadoLocalArmazenamento: string | null;
  estoqueAtual: number; // nome do campo no DTO do back
}

@Injectable({ providedIn: 'root' })
export class QuimicoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Concatena base + path garantindo as barras */
  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /** Normaliza a unidade enviada ao back (mantemos convenção do front) */
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
      case 'un':
      case 'unidade': return 'unid';
      case 'bag': return 'saco';
      default: return 'kg';
    }
  }

  // ========================= CRUD =========================

  listar(): Observable<QuimicoDTO[]> {
    return this.http.get<QuimicoDTO[]>(this.url(API)).pipe(
      map(list => (list ?? []).map(q => this.decodeDTO(q)))
    );
  }

  listarAtivo(): Observable<QuimicoDTO[]> {
    return this.http.get<QuimicoDTO[]>(this.url(`${API}/ativos`)).pipe(
      map(list => (list ?? []).map(q => this.decodeDTO(q)))
    );
  }

  obter(codigo: number): Observable<QuimicoDTO> {
    return this.http.get<QuimicoDTO>(this.url(`${API}/${codigo}`)).pipe(
      map(q => this.decodeDTO(q))
    );
  }

  criar(payload: QuimicoCreatePayload): Observable<QuimicoDTO> {
    const body: any = {
      tipoQuimico: payload.tipoQuimico,
      fornecedor: payload.fornecedorId != null ? { id: payload.fornecedorId } : null,
      lote: payload.lote ?? null,
      valorQuimico: payload.valorQuimico ?? null,
      unidade: this.normalizeUnidade(payload.unidade),
      estoqueInicial: payload.estoqueInicial,
      // LocalDate → "yyyy-MM-dd"
      dataValidade: payload.dataValidade ?? null,
      // OffsetDateTime ISO
      dataCompra: payload.dataCompra ?? null,
      statusQuimicos: payload.statusQuimicos,
      estadoLocalArmazenamento: payload.estadoLocalArmazenamento ?? null,
      observacao: payload.observacao ?? null,
    };
    return this.http.post<QuimicoDTO>(this.url(API), body).pipe(
      map(q => this.decodeDTO(q))
    );
  }

  atualizar(codigo: number, payload: QuimicoUpdatePayload): Observable<QuimicoDTO> {
    const body: any = {
      tipoQuimico: payload.tipoQuimico,
      fornecedor: payload.fornecedorId != null ? { id: payload.fornecedorId } : null,
      lote: payload.lote ?? null,
      valorQuimico: payload.valorQuimico ?? null,
      unidade: this.normalizeUnidade(payload.unidade),
      estoqueInicial: payload.estoqueInicial,
      // LocalDate → "yyyy-MM-dd"
      dataValidade: payload.dataValidade ?? null,
      // OffsetDateTime ISO
      dataCompra: payload.dataCompra ?? null,
      statusQuimicos: payload.statusQuimicos,
      estadoLocalArmazenamento: payload.estadoLocalArmazenamento ?? null,
      observacao: payload.observacao ?? null,
    };
    return this.http.put<QuimicoDTO>(this.url(`${API}/${codigo}`), body).pipe(
      map(q => this.decodeDTO(q))
    );
  }

  remover(codigo: number): Observable<void> {
    return this.http.delete<void>(this.url(`${API}/${codigo}`));
  }

  // ========================= RELATÓRIOS / CONSULTAS =========================

  /** Saldo atual de um químico específico (número) */
  estoqueAtual(codigo: number): Observable<number> {
    return this.http.get<number>(this.url(`${API}/${codigo}/estoque-atual`));
  }

  /** Estoque somado por TipoQuimico + Estado (campo do back: estoqueAtual) */
  listarEstoqueAgrupado(): Observable<EstoqueAgrupadoRow[]> {
    return this.http.get<EstoqueAgrupadoRow[]>(
      this.url(`${API}/estoque-agrupado`)
    );
  }

  /** 🔹 NOVO: lista "lite" para `<select>` (somente campos necessários) */
  listarLite(): Observable<Array<Pick<QuimicoDTO, 'codigo' | 'lote' | 'tipoQuimico' | 'estadoLocalArmazenamento'>>> {
    return this.listarAtivo().pipe(
      map((list: QuimicoDTO[]) =>
        (list ?? []).map((q) => ({
          codigo: q.codigo,
          lote: q.lote ?? null,
          tipoQuimico: q.tipoQuimico,
          estadoLocalArmazenamento: q.estadoLocalArmazenamento ?? null,
        }))
      )
    );
  }

  // ========================= Helpers de mapeamento =========================

  /** Normaliza campos do back para o front (ex.: unidade). */
  private decodeDTO(q: QuimicoDTO): QuimicoDTO {
    return {
      ...q,
      // garante que unidade está no formato usado pelo front
      unidade: this.normalizeUnidade(q.unidade),
      // campos opcionais sempre definidos
      estoqueUtilizado: q.estoqueUtilizado ?? 0,
      dataValidade: q.dataValidade ?? null,
      dataCompra: q.dataCompra ?? null,
      observacao: q.observacao ?? null,
      fornecedor: q.fornecedor ? { id: q.fornecedor.id, nome: q.fornecedor.nome } : null
    };
  }
}
