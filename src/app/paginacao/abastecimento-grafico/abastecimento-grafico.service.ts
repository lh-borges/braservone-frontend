import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // <- caminho padrão Angular

export interface AbastFiltroReq {
  inicio: string;   // 'YYYY-MM-DD'
  fim: string;      // 'YYYY-MM-DD'
  placa?: string | null;
}

export interface DiaAggResp {
  dia: string;                 // 'YYYY-MM-DD'
  custoTotal: number;          // soma R$
  kmRodados: number;           // soma km
  litros: number;              // soma L
  vlrMedioPorLitro: number | null;
  kmPorLitro: number | null;
  rsPorKm: number | null;
  qtAbastecimentos: number;
}

@Injectable({ providedIn: 'root' })
export class AbastecimentoGraficoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080 (sem barra final)

  private url(path: string): string {
    const b = this.base?.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /** GET /api/abastecimentos/graficos/diario?inicio=...&fim=...[&placa=...] */
  serieDiariaGet(inicio: string, fim: string, placa?: string | null): Observable<DiaAggResp[]> {
    let params = new HttpParams().set('inicio', inicio).set('fim', fim);
    if (placa && placa.trim()) params = params.set('placa', placa.trim());
    return this.http.get<DiaAggResp[]>(this.url('/api/abastecimentos/graficos/diario'), { params });
  }

  /** POST /api/abastecimentos/graficos/diario (opcional, se quiser usar POST) */
  serieDiariaPost(req: AbastFiltroReq): Observable<DiaAggResp[]> {
    return this.http.post<DiaAggResp[]>(this.url('/api/abastecimentos/graficos/diario'), req);
  }

  /** GET /api/abastecimentos/graficos/placas?inicio=...&fim=... */
  placasNoPeriodo(inicio: string, fim: string): Observable<string[]> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<string[]>(this.url('/api/abastecimentos/graficos/placas'), { params });
  }
}
