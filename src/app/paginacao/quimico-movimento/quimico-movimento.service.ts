import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuimicoDTO } from '../quimicos/quimico.service';

export type TipoMov = 'ENTRADA' | 'SAIDA';

export interface QuimicoRef { codigo: number; }
export interface PocoRef { codigoAnp: string; }

export interface QuimicoMovimentoDTO {
  id: number;
  tipoMovimento: TipoMov;
  qntMovimentada: string;   // BigDecimal como string
  criadoEm: string;         // ISO
  quimicoCodigo?: number | null;
  pocoCodigoAnp?: string | null;
  quimico?: QuimicoRef | null;
  poco?: PocoRef | null;
}

export interface RegistrarMovimentoPayload {
  quimicoCodigo: number;
  pocoCodigoAnp: string;
  tipo: TipoMov;
  quantidade: string; // 6 casas decimais
}

@Injectable({ providedIn: 'root' })
export class QuimicoMovimentoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Junta base + path sem duplicar barras */
  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /** Base real do controller (AJUSTE: caminho certo do backend) */
  private readonly API = this.url('/api/movimentosquimicos');

  /** GET /api/quimico-movimentos */
  listarTodos(): Observable<QuimicoMovimentoDTO[]> {
    return this.http.get<QuimicoMovimentoDTO[]>(this.API);
  }

  /** GET /api/quimico-movimentos/poco/{codigoAnp} */
  listarPorPoco(pocoCodigoAnp: string): Observable<QuimicoMovimentoDTO[]> {
    const id = encodeURIComponent(pocoCodigoAnp);
    return this.http.get<QuimicoMovimentoDTO[]>(this.url(`/api/movimentosquimicos/poco/${id}`));
  }

  /** GET /api/quimico-movimentos/quimico/{codigo} */
  listarPorQuimico(quimicoCodigo: number): Observable<QuimicoMovimentoDTO[]> {
    return this.http.get<QuimicoMovimentoDTO[]>(this.url(`/api/movimentosquimicos/quimico/${quimicoCodigo}`));
  }

  /** GET /api/quimico-movimentos/tipo/{tipo}  (tipo = ENTRADA|SAIDA) */
  listarPorTipo(tipo: TipoMov): Observable<QuimicoMovimentoDTO[]> {
    const t = encodeURIComponent(tipo);
    return this.http.get<QuimicoMovimentoDTO[]>(this.url(`/api/movimentosquimicos/tipo/${t}`));
  }

  /** POST /api/quimico-movimentos  (payload com nomes esperados pelo backend) */
  registrar(payload: RegistrarMovimentoPayload): Observable<QuimicoMovimentoDTO> {
    return this.http.post<QuimicoMovimentoDTO>(this.API, payload);
  }

  /** GET /api/quimicos/lite  */
  listarTodosLite(): Observable<Array<Pick<QuimicoDTO, 'codigo' | 'lote' | 'tipoQuimico' | 'fornecedor'>>> {
    return this.http.get<Array<Pick<QuimicoDTO, 'codigo' | 'lote' | 'tipoQuimico' | 'fornecedor'>>>(
      this.url('/api/quimicos/lite')
    );
  }
}
