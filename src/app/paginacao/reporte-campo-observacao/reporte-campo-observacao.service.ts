import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ===== Tipos =====
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

export interface Reporte {
  id: number;
  mensagem: string;
  matricula: string;
  setor: Setor;
  status: StatusReporte;
  dataHoraReporte: string;     // ISO
  observacoesCount?: number;   // opcional, se vier do @Formula
}

export interface Observacao {
  id: number;
  mensagem: string;
  dataMensagem: string;        // ISO
}

export interface UpdateReportePayload {
  mensagem: string;
  matricula: string;
  setor: Setor;
  status: StatusReporte;
}

@Injectable({ providedIn: 'root' })
export class ReporteCampoObservacaoService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl; // ex.: http://localhost:8080

  // ===== Reporte =====
  getReporte(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.baseUrl}/api/reportes/${id}`);
  }

  // Se ainda não existir no back, criar: @PutMapping("/api/reportes/{id}")
  updateReporte(id: number, payload: UpdateReportePayload): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.baseUrl}/api/reportes/${id}`, payload);
  }

  // Atualização de status (já existe no seu back)
  updateStatus(id: number, status: StatusReporte): Observable<Reporte> {
    const params = new HttpParams().set('value', status);
    return this.http.patch<Reporte>(`${this.baseUrl}/api/reportes/${id}/status`, null, { params });
  }

  // ===== Observações (alinhado ao ObservacaoController) =====
  listObservacoes(reporteId: number): Observable<Observacao[]> {
    return this.http.get<Observacao[]>(`${this.baseUrl}/api/reportes/${reporteId}/observacoes`);
  }

  getObservacao(reporteId: number, observacaoId: number): Observable<Observacao> {
    return this.http.get<Observacao>(`${this.baseUrl}/api/reportes/${reporteId}/observacoes/${observacaoId}`);
  }

  createObservacao(reporteId: number, mensagem: string): Observable<Observacao> {
    return this.http.post<Observacao>(`${this.baseUrl}/api/reportes/${reporteId}/observacoes`, { mensagem });
  }

  updateObservacao(reporteId: number, observacaoId: number, mensagem: string): Observable<Observacao> {
    return this.http.put<Observacao>(`${this.baseUrl}/api/reportes/${reporteId}/observacoes/${observacaoId}`, { mensagem });
  }

  deleteObservacao(reporteId: number, observacaoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/reportes/${reporteId}/observacoes/${observacaoId}`);
  }
}
