// src/app/core/reporte.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // ajuste o caminho se usar alias

export type Setor =
  | 'MECANICA'
  | 'INTEGRIDADE'
  | 'MANUFATURA'
  | 'ELETRICA'
  | 'TRANSPORTE'
  | 'OPERACAO'
  | 'SUPRIMENTO'
  | 'OUTROS';

export interface CreateReporte {
  mensagem: string;
  matricula: string;
  setor: Setor;
  veiculoPlaca: string; // enviado pro back
}



export interface Reporte extends CreateReporte {
  id: number;
  status: string;
  dataHoraReporte: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  private readonly API = '/api/reportes';

  private url(path: string): string {
    const b = (this.base ?? '').endsWith('/') ? this.base.slice(0, -1) : (this.base ?? '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  create(body: CreateReporte): Observable<Reporte> {
    return this.http.post<Reporte>(this.url(this.API), body);
    // ex.: se apiBaseUrl="http://localhost:8080", vira "http://localhost:8080/api/reportes"
  }
}
