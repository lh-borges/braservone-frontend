// src/app/operadora/service/operadora.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ⬇️ Ajuste de caminhos relativos (service está em /operadora/service)
import { environment } from '../../../environments/environment'; 
import { OperadoraDTO } from '../../dto/operadora-dto';  

@Injectable({ providedIn: 'root' })
export class OperadoraService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  private readonly API = '/api/operadora';

  private url(path = ''): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  getAllOperadoras(params?: { q?: string; ativo?: boolean }): Observable<OperadoraDTO[]> {
    let httpParams = new HttpParams();
    if (params?.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
    if (typeof params?.ativo === 'boolean') httpParams = httpParams.set('ativo', String(params.ativo));
    return this.http.get<OperadoraDTO[]>(this.url(this.API), { params: httpParams });
  }

  getOperadoraById(id: number): Observable<OperadoraDTO> {
    return this.http.get<OperadoraDTO>(this.url(`${this.API}/${id}`));
  }

  createOperadora(payload: OperadoraDTO): Observable<OperadoraDTO> {
    return this.http.post<OperadoraDTO>(this.url(this.API), payload);
  }

  updateOperadora(id: number, payload: OperadoraDTO): Observable<OperadoraDTO> {
    return this.http.put<OperadoraDTO>(this.url(`${this.API}/${id}`), payload);
  }

  deleteOperadora(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`${this.API}/${id}`));
  }

  toggleAtivo(id: number, value: boolean): Observable<OperadoraDTO> {
    const params = new HttpParams().set('value', String(value));
    return this.http.patch<OperadoraDTO>(this.url(`${this.API}/$ {id}/ativo`.replace(' $ ', '')), null, { params });
    // ^ truque só pra não quebrar highlight; essencialmente `${this.API}/${id}/ativo`
  }
}
