import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuimicoDTO } from '../quimicos/quimico.service';

export type TipoMov = 'ENTRADA' | 'SAIDA';

export interface QuimicoRef {
  codigo: number;
  lote?: string | null;
  tipoQuimico?: string | null;            // nome/label do enum no back
  estadoLocalArmazenamento?: string | null;
}

export interface PocoRef {
  codigoAnp: string;
  nomeCampo?: string | null;
}

export interface QuimicoMovimentoDTO {
  id: number;
  tipoMovimento: TipoMov;
  qntMovimentada: string;                 // BigDecimal como string
  criadoEm: string;                       // ISO string

  // Relacionados (vêm do back via JPA/Hibernate)
  quimico?: QuimicoRef | null;
  poco?: PocoRef | null;

  // opcionais (se o back expuser via @Transient)
  quimicoCodigo?: number | null;
  pocoCodigoAnp?: string | null;
}

export interface RegistrarMovimentoPayload {
  quimicoCodigo: number;
  pocoCodigoAnp: string;
  tipo: TipoMov;
  quantidade: string; // 6 casas decimais
}

@Injectable({ providedIn: 'root' })
export class QuimicoMovimentoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  private static readonly RESOURCE = '/api/movimentosquimicos';

  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  private readonly API = this.url(QuimicoMovimentoService.RESOURCE);

  // ----------------- LISTAGENS -----------------

  listarTodos(): Observable<QuimicoMovimentoDTO[]> {
    return this.http.get<QuimicoMovimentoDTO[]>(this.API);
  }

  listarPorPoco(pocoCodigoAnp: string): Observable<QuimicoMovimentoDTO[]> {
    const id = encodeURIComponent((pocoCodigoAnp ?? '').trim());
    return this.http.get<QuimicoMovimentoDTO[]>(`${this.API}/poco/${id}`);
  }

  listarPorQuimico(quimicoCodigo: number): Observable<QuimicoMovimentoDTO[]> {
    return this.http.get<QuimicoMovimentoDTO[]>(`${this.API}/quimico/${quimicoCodigo}`);
  }

  listarPorTipoQuimico(tipoQuimico: string): Observable<QuimicoMovimentoDTO[]> {
    const t = encodeURIComponent(tipoQuimico);
    return this.http.get<QuimicoMovimentoDTO[]>(`${this.API}/tipo/${t}`);
  }

  listarPorTipoMovimento(tipo: TipoMov): Observable<QuimicoMovimentoDTO[]> {
    const t = encodeURIComponent(tipo);
    return this.http.get<QuimicoMovimentoDTO[]>(`${this.API}/tipo-movimento/${t}`);
  }

  // ----------------- REGISTRO -----------------

  registrar(payload: RegistrarMovimentoPayload): Observable<QuimicoMovimentoDTO> {
    return this.http.post<QuimicoMovimentoDTO>(this.API, payload);
  }

  registrarFromFields(args: {
    quimicoCodigo: number;
    pocoCodigoAnp: string;
    tipo: TipoMov;
    quantidade: number | string;
  }): Observable<QuimicoMovimentoDTO> {
    const quantidade =
      typeof args.quantidade === 'number'
        ? this.toFixed6(args.quantidade)
        : this.normalizeFixed6(args.quantidade);

    const pocoCodigoAnp = (args.pocoCodigoAnp ?? '').trim();

    return this.registrar({
      quimicoCodigo: args.quimicoCodigo,
      pocoCodigoAnp,
      tipo: args.tipo,
      quantidade,
    });
  }

  // ----------------- DELETE -----------------

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  // ----------------- APOIO -----------------

  private toFixed6(n: number): string {
    return n.toFixed(6);
  }

  private normalizeFixed6(s: string): string {
    const clean = s.trim().replace(',', '.');
    const num = Number(clean);
    return Number.isFinite(num) ? num.toFixed(6) : clean;
  }

  // ----------------- SUPORTE A OUTRAS TELAS -----------------

  /** GET /api/quimicos/lite  */
  listarTodosLite(): Observable<Array<Pick<QuimicoDTO, 'codigo' | 'lote' | 'tipoQuimico' | 'fornecedor'>>> {
    return this.http.get<Array<Pick<QuimicoDTO, 'codigo' | 'lote' | 'tipoQuimico' | 'fornecedor'>>>(
      this.url('/api/quimicos/lite')
    );
  }
}
