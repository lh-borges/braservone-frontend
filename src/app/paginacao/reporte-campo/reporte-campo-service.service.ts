import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// === Tipos alinhados ao back ===
export type StatusReporte =
  | 'NOVO'
  | 'EM_ANDAMENTO'
  | 'NO_FINANCEIRO'
  | 'NO_COMPRAS'
  | 'ESPERANDO_ENVIO'
  | 'NA_MANUTENCAO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type Setor = string;

export interface Observacao {
  id: number;
  mensagem: string;
  dataMensagem: string; // ISO
}

export interface Reporte {
  id: number;
  mensagem: string;
  matricula: string;
  setor: Setor;
  status: StatusReporte;
  dataHoraReporte: string;

  // NOVO: campos opcionais para compatibilizar
  observacoesCount?: number;        // usado para contagem rápida no card
  listObservacoes?: Observacao[];   // pode vir vazio/indefinido (JsonIgnore no back)
}
export interface CreateReportePayload {
  mensagem: string;
  matricula: string;
  setor: Setor;
  status?: StatusReporte;
  dataHoraReporte?: string;
}



@Injectable({ providedIn: 'root' })
export class ReporteCampoServiceService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl; // ex.: http://localhost:8080

  

  list(params?: {
    status?: StatusReporte;
    setor?: Setor;
    from?: string | Date;
    to?: string | Date;
  }): Observable<Reporte[]> {
    let p = new HttpParams();
    if (params?.status) p = p.set('status', params.status);
    if (params?.setor)  p = p.set('setor', params.setor);
    if (params?.from)   p = p.set('from', this.toLocalDateTime(params.from));
    if (params?.to)     p = p.set('to',   this.toLocalDateTime(params.to));
    return this.http.get<Reporte[]>(`${this.baseUrl}/api/reportes`, { params: p });
  }

  get(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.baseUrl}/api/reportes/${id}`);
  }

  create(body: CreateReportePayload): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.baseUrl}/api/reportes`, body);
  }

  updateStatus(id: number, value: StatusReporte): Observable<Reporte> {
    const params = new HttpParams().set('value', value);
    return this.http.patch<Reporte>(`${this.baseUrl}/api/reportes/${id}/status`, null, { params });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/reportes/${id}`);
  }

  // ===== Helpers =====
  private toLocalDateTime(d: string | Date): string {
    if (typeof d === 'string') return d.replace('Z', '').slice(0, 19);
    const iso = new Date(d).toISOString();
    return iso.slice(0, 19);
  }
}
