// src/app/paginacao/fornecedor/fornecedor.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// caminho correto (saindo de src/app/paginacao/fornecedor -> src/environments)
import { environment } from '../../../environments/environment';

export interface Fornecedor {
  id: number;
  nome: string;
  tipo: 'QUIMICOS';
}
export interface FornecedorCreate {
  nome: string;
  tipo: 'QUIMICOS';
}

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private http = inject(HttpClient);

  // Tira barras do fim (ex.: http://localhost:8080/)
  private readonly base = (environment.apiBaseUrl ?? '').replace(/\/+$/, '');

  /** Junta base + path evitando // duplicado */
  private url(path: string): string {
    const p = `/${path}`.replace(/\/{2,}/g, '/'); // garante só uma barra
    return `${this.base}${p}`;
  }

  // AQUI estava o bug: precisa chamar this.url('...'), não atribuir a função
  private readonly baseUrl = this.url('api/fornecedores');

  listar(q?: string): Observable<Fornecedor[]> {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<Fornecedor[]>(this.baseUrl, { params });
  }

  criar(payload: FornecedorCreate): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(this.baseUrl, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
