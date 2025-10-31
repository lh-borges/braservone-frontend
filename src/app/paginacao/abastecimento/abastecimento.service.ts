// ./abastecimento.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AbastecimentoCreateDTO {
  placaVeiculo: string;
  distRodadaKm: number;
  volumeLitros: number;
  valorTotal: number | null;
  valorPorLitro: number | null;
  mediaKmPorL: number | null;
  mediaRsPorKm: number | null;
  /** ISO local: yyyy-MM-ddTHH:mm:ss (sem timezone) */
  dataAbastecimento: string;
}

export interface AbastecimentoResponseDTO {
  id: number;
  placaVeiculo: string;
  distRodadaKm: number;
  volumeLitros: number;
  valorTotal: number | null;
  valorPorLitro: number | null;
  mediaKmPorL: number | null;
  mediaRsPorKm: number | null;
  /** ISO string vinda do back */
  dataAbastecimento: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // página atual (0-based)
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AbastecimentoService {
  private http = inject(HttpClient);

  // Ajuste aqui se você usa um prefixo global (ex.: environment.api)
   private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080
  
    private url(path: string): string {
      const b = this.base?.endsWith('/') ? this.base.slice(0, -1) : this.base ?? '';
      const p = path.startsWith('/') ? path : `/${path}`;
      return `${b}${p}`;
    }

  /** /api/abastecimentos */
  private abastecimentosUrl() {
    return this.url(`api/abastecimentos`);
  }

  /** /api/veiculos */
  private veiculosUrl() {
    return this.url(`api/veiculos`);
  }

  criar(payload: AbastecimentoCreateDTO): Observable<AbastecimentoResponseDTO> {
    return this.http.post<AbastecimentoResponseDTO>(this.abastecimentosUrl(), payload);
  }

  atualizar(id: number, payload: AbastecimentoCreateDTO): Observable<AbastecimentoResponseDTO> {
    return this.http.put<AbastecimentoResponseDTO>(`${this.abastecimentosUrl()}/${id}`, payload);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.abastecimentosUrl()}/${id}`);
  }

  /** GET /api/abastecimentos/veiculo/{placa}?page&size */
  listarPorVeiculo(placa: string, page: number, size: number): Observable<PageResponse<AbastecimentoResponseDTO>> {
    // HttpParams é imutável e espera string:
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.get<PageResponse<AbastecimentoResponseDTO>>(
      `${this.abastecimentosUrl()}/veiculo/${encodeURIComponent(placa)}`,
      { params }
    );
  }

  /** GET /api/veiculos/{placa}/existe  -> boolean */
  verificarVeiculo(placa: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.veiculosUrl()}/${encodeURIComponent(placa)}/existe`);
  }

  listarTodos(page: number, size: number) {
  const params = new HttpParams()
    .set('page', String(page))
    .set('size', String(size));
  return this.http.get<PageResponse<AbastecimentoResponseDTO>>(
    `${this.abastecimentosUrl()}`, // GET /api/abastecimentos
    { params }
  );
}
}
