import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import {
  QuimicoMovimentoService,
  QuimicoMovimentoDTO,
} from '../quimico-movimento/quimico-movimento.service';

import {
  QuimicoService,
  QuimicoDTO,
  TipoQuimico,
} from '../quimicos/quimico.service';

import {
  PocoService,
  PocoLite,
} from '../poco/poco.service';

export type QuimicoMini =
  Pick<QuimicoDTO, 'codigo' | 'tipoQuimico' | 'fornecedor' | 'unidade'>;

export interface BootstrapData {
  // selects
  quimicosOptions: QuimicoMini[];
  tiposOptions: TipoQuimico[];
  pocosOptions: PocoLite[];

  // dados base
  movimentos: QuimicoMovimentoDTO[];

  // mapas auxiliares
  mapQuimicoFornecedor: Map<number, string>;
  mapQuimicoUnidade: Map<number, string>;
  mapQuimicoTipo: Map<number, TipoQuimico>;
  mapPocoNome: Map<string, string>;
}

export interface GraficoFilters {
  startDateStr?: string;      // yyyy-MM-dd (inclusive)
  endDateStr?: string;        // yyyy-MM-dd (inclusive)
  allTipos?: boolean;
  selectedTipos?: TipoQuimico[];
  allPocos?: boolean;
  selectedPocos?: string[];   // lista de codigoAnp
}

@Injectable({ providedIn: 'root' })
export class QuimicoGraficoComponent {
  private movSvc = inject(QuimicoMovimentoService);
  private quimicoSvc = inject(QuimicoService);
  private pocoSvc = inject(PocoService);

  /** Carrega e normaliza tudo que o componente precisa. */
  loadBootstrap(): Observable<BootstrapData> {
    return forkJoin({
      quimicos: this.quimicoSvc.listar(),
      pocos: this.pocoSvc.getAllPocosLite(),
      movs: this.movSvc.listarTodos(),
    }).pipe(
      map(({ quimicos, pocos, movs }) => {
        const qArr = (quimicos ?? []);

        // opções de químicos para selects e tooltips
        const quimicosOptions: QuimicoMini[] = qArr.map(q => ({
          codigo: q.codigo,
          tipoQuimico: q.tipoQuimico,
          fornecedor: q.fornecedor,
          unidade: q.unidade,
        }));

        // tipos únicos
        const tiposOptions = Array.from(
          new Set(qArr.map(q => q?.tipoQuimico).filter(Boolean) as TipoQuimico[])
        ).sort();

        // mapas auxiliares (codigo → fornecedor/unidade/tipo)
        const mapQuimicoFornecedor = new Map<number, string>();
        const mapQuimicoUnidade   = new Map<number, string>();
        const mapQuimicoTipo      = new Map<number, TipoQuimico>();
        for (const q of qArr) {
          if (q?.codigo != null) {
            mapQuimicoFornecedor.set(q.codigo, q.fornecedor?.nome ?? '—');
            mapQuimicoUnidade.set(q.codigo, (q as any).unidade ?? '—');
            mapQuimicoTipo.set(q.codigo, q.tipoQuimico);
          }
        }

        // poços lite e mapa (codigoAnp → nome)
        const pocosOptions = (pocos ?? []);
        const mapPocoNome = new Map<string, string>();
        for (const p of pocosOptions) {
          mapPocoNome.set(p.codigoAnp, p.nome ?? p.codigoAnp);
        }

        // movimentos normalizados (garante códigos planos)
        const movimentos = (movs ?? []).map(m => ({
          ...m,
          quimicoCodigo: m.quimicoCodigo ?? m.quimico?.codigo ?? undefined,
          pocoCodigoAnp: m.pocoCodigoAnp ?? m.poco?.codigoAnp ?? '',
        }));

        return {
          quimicosOptions,
          tiposOptions,
          pocosOptions,
          movimentos,
          mapQuimicoFornecedor,
          mapQuimicoUnidade,
          mapQuimicoTipo,
          mapPocoNome,
        } as BootstrapData;
      })
    );
  }

  /** Aplica os filtros ao array de movimentos. */
  filterMovs(list: QuimicoMovimentoDTO[], f: GraficoFilters): QuimicoMovimentoDTO[] {
    const start = f.startDateStr?.trim() || '';
    const end   = f.endDateStr?.trim()   || '';

    const inDayRange = (iso: string) => {
      const d = this.toDay(iso);
      if (start && d < start) return false;
      if (end   && d > end)   return false;
      return true;
    };

    return (list ?? []).filter(m => {
      if (!inDayRange(m.criadoEm)) return false;

      if (!f.allTipos) {
        const tipos = f.selectedTipos ?? [];
        if (tipos.length === 0) return false;
        if (m.quimicoCodigo == null) return false;
        // o chamador deve checar o tipo pelo map (fora deste helper)
      }

      if (!f.allPocos) {
        const pocos = f.selectedPocos ?? [];
        if (pocos.length === 0) return false;
        if (!pocos.includes(m.pocoCodigoAnp || '')) return false;
      }
      return true;
    });
  }

  /** Converte ISO para yyyy-MM-dd sem timezone. */
  toDay(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return (iso ?? '').substring(0, 10);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  sum(arr: number[]): number {
    return (arr ?? []).reduce((a, b) => a + (Number(b) || 0), 0);
  }
}
