// src/app/paginacao/quimicos/quimico-estoque.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import {
  QuimicoService,
  QuimicoDTO,
  EstoqueAgrupadoRow, // { tipoQuimico: string; estadoLocalArmazenamento: string; estoqueAtual: number; }
} from '../quimicos/quimico.service';

type NivelEstoque = 'CRITICO' | 'ALERTA';
interface QuimicoBaixo {
  nivel: NivelEstoque;
  estoqueAtual: number;
  item: QuimicoDTO;
}

type NivelVencimento = 'CRITICO' | 'ALERTA';
interface QuimicoVencimento {
  nivel: NivelVencimento;
  diasRestantes: number;
  item: QuimicoDTO;
}

interface UFResumo {
  uf: string;
  linhas: { tipo: string; estoque: number }[];
  totalUF: number;
}

@Component({
  selector: 'app-quimico-estoque',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './quimico-estoque.component.html',
  styleUrls: ['./quimico-estoque.component.css']
})
export class QuimicoEstoqueComponent implements OnInit {
  private quimicoService = inject(QuimicoService);
  private toastr = inject(ToastrService);

  carregando = false;
  quimicos: QuimicoDTO[] = [];
  estoqueAgrupado: EstoqueAgrupadoRow[] = [];

  private nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 6 });

  ngOnInit(): void { this.carregarDados(); }

  private carregarDados(): void {
    this.carregando = true;
    forkJoin({
      quimicos: this.quimicoService.listar(),
      agrupado: this.quimicoService.listarEstoqueAgrupado()
    }).subscribe({
      next: ({ quimicos, agrupado }) => {
        this.quimicos = Array.isArray(quimicos) ? quimicos : [];
        this.estoqueAgrupado = Array.isArray(agrupado) ? agrupado : [];
      },
      error: (err) => {
        this.toastr.error('Falha ao carregar dados de estoque.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      },
      complete: () => this.carregando = false
    });
  }

  // ===== Filtro ESTRITO de ATIVO =====
  private isAtivoStrict(q: QuimicoDTO): boolean {
    // 1) flags booleanas explícitas
    const flags = [(q as any).ativo, (q as any).isAtivo, (q as any).habilitado]
      .filter(v => v !== undefined && v !== null);
    if (flags.length) return !!flags.find(v => v === true);

    // 2) enum/texto — campo correto: statusQuimicos (plural)
    const s = (
      (q as any).statusQuimicos ??
      (q as any).status ??
      (q as any).situacao ??
      (q as any).statusQuimico ?? // fallback singular
      ''
    ).toString().trim().toUpperCase();

    return s === 'ATIVO' || s === 'ATIVA';
  }

  get quimicosAtivos(): QuimicoDTO[] {
    return (this.quimicos ?? []).filter(q => this.isAtivoStrict(q));
  }

  // ===== Helpers p/ template =====
  nomeOf(q: QuimicoDTO): string {
    return ((q as any).nome?.toString()?.trim())
        || (q as any).descricao
        || (q as any).tipoQuimico
        || 'Químico';
  }
  ufOf(q: QuimicoDTO): string | null {
    return ((q as any).estadoLocalArmazenamento ?? (q as any).uf ?? null);
  }
  tipoOf(q: QuimicoDTO): string | null {
    return (q as any).tipoQuimico ?? null;
  }
  loteOf(q: QuimicoDTO): string | null {
    return (q as any).lote ?? null;
  }
  fornecedorNomeOf(q: QuimicoDTO): string | null {
    return (q as any).fornecedor?.nome ?? null;
  }

  // ===== Quantidade (robusta) =====
  private toNum(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') return Number(v.replace(',', '.')) || 0;
    return 0;
  }

  private qtdDoQuimico(q: QuimicoDTO): number {
    const estoqueAtualLike =
      (q as any).estoqueAtual ??
      (q as any).qntEstoque ??
      (q as any).saldoAtual;

    if (estoqueAtualLike !== undefined && estoqueAtualLike !== null) {
      const n = this.toNum(estoqueAtualLike);
      return Number.isFinite(n) ? n : 0;
    }

    // fallback: estoqueInicial - estoqueUtilizado
    const inicial   = this.toNum((q as any).estoqueInicial);
    const utilizado = this.toNum((q as any).estoqueUtilizado);
    const n = inicial - utilizado;
    return Number.isFinite(n) ? n : 0;
  }

  // ===== Datas (robustas) =====
  dateYMD(val: any): string {
    if (!val) return '—';
    if (typeof val === 'string') return val.substring(0, 10);
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toISOString().substring(0, 10);
  }

  private daysUntilSafe(val: any): number {
    if (!val) return Number.POSITIVE_INFINITY;
    let d: Date | null = null;

    if (typeof val === 'string') {
      const s = val.length >= 10 ? `${val.substring(0, 10)}T00:00:00Z` : val;
      d = new Date(s);
    } else if (val instanceof Date) {
      d = val;
    } else if (typeof val === 'object' && 'year' in val && 'month' in val && 'day' in val) {
      // objeto estilo {year, month, day}
      // @ts-ignore
      d = new Date(Date.UTC(val.year, val.month - 1, val.day));
    }

    if (!d || isNaN(d.getTime())) return Number.POSITIVE_INFINITY;

    const today = new Date();
    const todayUTC  = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const targetUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Math.round((targetUTC - todayUTC) / 86400000);
  }

  // ===== Estoque baixo (químico a químico, só ATIVOS) =====
  get quimicosBaixoEstoque(): QuimicoBaixo[] {
    return this.quimicosAtivos
      .map(q => {
        const qtd = this.qtdDoQuimico(q);
        const nivel: NivelEstoque | null = qtd < 20 ? 'CRITICO' : (qtd < 40 ? 'ALERTA' : null);
        return nivel ? { nivel, estoqueAtual: qtd, item: q } as QuimicoBaixo : null;
      })
      .filter((x): x is QuimicoBaixo => !!x)
      .sort((a, b) => {
        if (a.nivel !== b.nivel) return a.nivel === 'CRITICO' ? -1 : 1;
        return a.estoqueAtual - b.estoqueAtual;
      });
  }

  // ===== Validade próxima (só ATIVOS) =====
  get quimicosVencimento(): QuimicoVencimento[] {
    return this.quimicosAtivos
      .filter(q => !!(q as any).dataValidade)
      .map(q => {
        const dias = this.daysUntilSafe((q as any).dataValidade);
        const nivel: NivelVencimento = dias <= 30 ? 'CRITICO' : 'ALERTA';
        return { item: q, diasRestantes: dias, nivel };
      })
      .filter(x => x.diasRestantes <= 60)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  // ===== Consolidado por UF (apresentação) =====
  get consolidadoPorUF(): UFResumo[] {
    const mapa = new Map<string, Map<string, number>>();
    for (const row of (this.estoqueAgrupado ?? [])) {
      const uf = (row.estadoLocalArmazenamento ?? '—').toString().toUpperCase();
      const tipo = (row.tipoQuimico ?? '—').toString().toUpperCase();
      const qtd = Number(row.estoqueAtual ?? 0);

      const porTipo = mapa.get(uf) ?? new Map<string, number>();
      porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + (Number.isFinite(qtd) ? qtd : 0));
      mapa.set(uf, porTipo);
    }

    const lista: UFResumo[] = [];
    for (const [uf, porTipo] of mapa.entries()) {
      const linhas = Array.from(porTipo.entries())
        .map(([tipo, estoque]) => ({ tipo, estoque }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo));
      const totalUF = linhas.reduce((acc, l) => acc + l.estoque, 0);
      lista.push({ uf, linhas, totalUF });
    }

    return lista.sort((a, b) => b.totalUF - a.totalUF || a.uf.localeCompare(b.uf));
  }

  // ===== trackBy helpers (arrow para fixar 'this') =====
  private trackKeyQuimico = (q: QuimicoDTO): string | number => {
    const id =
      (q as any).id ??
      (q as any).codigo ??
      (q as any).codigoQuimico ??
      (q as any).uuid ??
      null;
    if (id != null) return id;

    const tipo = this.tipoOf(q) ?? '';
    const uf   = this.ufOf(q) ?? '';
    const lote = this.loteOf(q) ?? '';
    const nome = this.nomeOf(q) ?? '';
    return `${tipo}|${uf}|${lote}|${nome}`;
  };

  trackByLowStock = (_: number, qb: { item: QuimicoDTO; nivel: any }): string | number =>
    `${this.trackKeyQuimico(qb.item)}|${qb.nivel}`;

  trackByVenc = (_: number, v: { item: QuimicoDTO; diasRestantes: number }): string | number =>
    `${this.trackKeyQuimico(v.item)}|${v.diasRestantes}`;

  trackByUF = (_: number, uf: { uf: string }): string => uf.uf;

  trackByLinha = (_: number, linha: { tipo: string; estoque: number }): string => linha.tipo;

  // ===== Helpers UI =====
  getBadgeClass(nivel: NivelEstoque): string {
    return nivel === 'CRITICO'
      ? 'bg-danger-subtle text-danger border border-danger'
      : 'bg-warning-subtle text-warning border border-warning';
  }
  getVencClass(nivel: NivelVencimento): string {
    return nivel === 'CRITICO'
      ? 'bg-danger-subtle text-danger border border-danger'
      : 'bg-warning-subtle text-warning border border-warning';
  }
  labelDias(dias: number): string {
    if (!Number.isFinite(dias)) return 'Data inválida';
    if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence em 1 dia';
    return `Vence em ${dias} dias`;
  }
  formatEstado(estado: string | null | undefined): string {
    return estado && estado.trim().length > 0 ? estado : '—';
  }
  fmt(n: number | string | null | undefined): string {
    const num = typeof n === 'string' ? Number(n.replace(',', '.')) : Number(n ?? 0);
    return this.nf.format(Number.isFinite(num) ? num : 0);
  }
}
