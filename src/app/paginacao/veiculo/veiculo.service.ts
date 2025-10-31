import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// ajuste o caminho do environment conforme seu projeto:
import { environment } from '../../../environments/environment';

export type StatusVeiculos = 'ATIVO' | 'INATIVO' | 'MANUTENCAO';
export type TipoVeiculo =
  | 'LEVE' | 'PESADO' | 'UNIDADE_CIMENTACAO' | 'BATE_MIX' | 'BULK' | 'SONDA' | 'OUTROS';

export interface VeiculoDTO {
  placa: string;
  status: StatusVeiculos;
  tipoVeiculo: TipoVeiculo;
  anoVeiculo?: number | null;
}

@Injectable({ providedIn: 'root' })
export class VeiculoService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl; // ex.: http://localhost:8080

  /** Monta URL sem // duplicado */
  private url(path: string): string {
    const b = this.base.endsWith('/') ? this.base.slice(0, -1) : this.base;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  listar(): Observable<VeiculoDTO[]> {
    alert(this.url('teste'));
    return this.http.get<VeiculoDTO[]>(this.url('/api/veiculos'));
  }

  criar(payload: VeiculoDTO): Observable<VeiculoDTO> {
    return this.http.post<VeiculoDTO>(this.url('/api/veiculos'), payload);
  }

  // útil se quiser buscar individualmente pela placa
  buscar(placa: string): Observable<VeiculoDTO> {
    return this.http.get<VeiculoDTO>(this.url(`/api/veiculos/${encodeURIComponent(placa)}`));
  }

  excluir(placa: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/veiculos/${encodeURIComponent(placa)}`));
  }

  // veiculo.service.ts
atualizar(placa: string, payload: VeiculoDTO) {
  return this.http.put<VeiculoDTO>(this.url(`/api/veiculos/${encodeURIComponent(placa)}`), payload);
}
}
