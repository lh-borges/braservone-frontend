import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartDataset, ChartOptions, TooltipItem } from 'chart.js';
import { forkJoin, of } from 'rxjs';

import { AbastecimentoGraficoService, DiaAggResp } from './abastecimento-grafico.service';

/* ====================== Utils ====================== */
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayIso(): string { return toLocalISO(new Date()); }
function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toLocalISO(dt);
}
function num(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function num0(v: any): number { return num(v) ?? 0; }
function cumul(arr: Array<number | null>): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const v of arr) { acc += num0(v); out.push(acc); }
  return out;
}

/* ===== Tooltip format ===== */
const fmtBR  = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const fmtBR2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBR3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

type SeriePorPlaca = { placa: string; rows: DiaAggResp[] };

@Component({
  selector: 'app-abastecimento-grafico',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './abastecimento-grafico.component.html',
  styleUrls: ['./abastecimento-grafico.component.css']
})
export class AbastecimentoGraficoComponent implements OnInit {
  private api = inject(AbastecimentoGraficoService);

  // estado UI
  loading = false;
  errorMsg = '';

  // filtros
  inicio = addDaysIso(todayIso(), -90);
  fim = todayIso();

  // multi-select de placas
  placas: string[] = [];
  selecionadas: string[] = []; // vazio => "Todos"

  // dados por placa
  private series: SeriePorPlaca[] = [];

  /* =================== Helpers de opções (tipadas) =================== */
  private mkLineOpts(
    title: string,
    labelCb?: (ctx: TooltipItem<'line'>) => string
  ): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      elements: { line: { tension: 0.25 }, point: { radius: 2 } },
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title },
        tooltip: labelCb ? { callbacks: { label: labelCb } } : {}
      }
    };
  }

  private mkBarOpts(
    title: string,
    labelCb?: (ctx: TooltipItem<'bar'>) => string,
    hideLegend = false
  ): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { position: 'top', display: !hideLegend },
        title: { display: true, text: title },
        tooltip: labelCb ? { callbacks: { label: labelCb } } : {}
      }
    };
  }

  /* =================== 12 gráficos por dia (comparativos) =================== */
  lineCustoData:    ChartData<'line'> = { labels: [], datasets: [] };
  lineCustoOpts     = this.mkLineOpts('Custo total por dia (R$)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBRL.format(Number(c.parsed.y || 0))}`);

  barLitrosData:    ChartData<'bar'>  = { labels: [], datasets: [] };
  barLitrosOpts     = this.mkBarOpts('Litros por dia (L)',
    (c: TooltipItem<'bar'>) => `${c.dataset.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} L`);

  barKmData:        ChartData<'bar'>  = { labels: [], datasets: [] };
  barKmOpts         = this.mkBarOpts('Km rodados por dia (km)',
    (c: TooltipItem<'bar'>) => `${c.dataset.label}: ${fmtBR.format(Number(c.parsed.y || 0))} km`);

  linePrecoData:    ChartData<'line'> = { labels: [], datasets: [] };
  linePrecoOpts     = this.mkLineOpts('Preço médio por dia (R$/L)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR2.format(Number(c.parsed.y || 0))} R$/L`);

  lineKmLData:      ChartData<'line'> = { labels: [], datasets: [] };
  lineKmLOpts       = this.mkLineOpts('Consumo por dia (km/L)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} km/L`);

  lineRsKmData:     ChartData<'line'> = { labels: [], datasets: [] };
  lineRsKmOpts      = this.mkLineOpts('Custo por dia (R$/km)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} R$/km`);

  barQtData:        ChartData<'bar'>  = { labels: [], datasets: [] };
  barQtOpts         = this.mkBarOpts('Quantidade de abastecimentos por dia',
    (c: TooltipItem<'bar'>) => `${c.dataset.label}: ${fmtBR.format(Number(c.parsed.y || 0))}`);

  lineCustoAcData:  ChartData<'line'> = { labels: [], datasets: [] };
  lineCustoAcOpts   = this.mkLineOpts('Custo acumulado (R$)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBRL.format(Number(c.parsed.y || 0))}`);

  lineLitrosAcData: ChartData<'line'> = { labels: [], datasets: [] };
  lineLitrosAcOpts  = this.mkLineOpts('Litros acumulados (L)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} L`);

  lineKmAcData:     ChartData<'line'> = { labels: [], datasets: [] };
  lineKmAcOpts      = this.mkLineOpts('Km acumulado (km)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR.format(Number(c.parsed.y || 0))} km`);

  lineTicketData:   ChartData<'line'> = { labels: [], datasets: [] };
  lineTicketOpts    = this.mkLineOpts('Ticket médio por dia (R$/abastecimento)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBRL.format(Number(c.parsed.y || 0))}`);

  lineLitrosMedData: ChartData<'line'> = { labels: [], datasets: [] };
  lineLitrosMedOpts  = this.mkLineOpts('Litros médios por dia (L/abastecimento)',
    (c: TooltipItem<'line'>) => `${c.dataset.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} L`);

  /* =================== +6 comparativos por veículo =================== */
  barTotCustoPorCarro:  ChartData<'bar'> = { labels: [], datasets: [] };
  barTotLitrosPorCarro: ChartData<'bar'> = { labels: [], datasets: [] };
  barTotKmPorCarro:     ChartData<'bar'> = { labels: [], datasets: [] };
  barMedPrecoPorCarro:  ChartData<'bar'> = { labels: [], datasets: [] };
  barMedKmLPorCarro:    ChartData<'bar'> = { labels: [], datasets: [] };
  barMedRsKmPorCarro:   ChartData<'bar'> = { labels: [], datasets: [] };

  barTotCustoOpts  = this.mkBarOpts('Comparativo — Custo total (R$)',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBRL.format(Number(c.parsed.y || 0))}`, true);
  barTotLitrosOpts = this.mkBarOpts('Comparativo — Litros totais (L)',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} L`, true);
  barTotKmOpts     = this.mkBarOpts('Comparativo — Km totais (km)',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBR.format(Number(c.parsed.y || 0))} km`, true);
  barMedPrecoOpts  = this.mkBarOpts('Comparativo — Preço médio (R$/L)',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBR2.format(Number(c.parsed.y || 0))} R$/L`, true);
  barMedKmLOpts    = this.mkBarOpts('Comparativo — Consumo médio (km/L)',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} km/L`, true);
  barMedRsKmOpts   = this.mkBarOpts('Comparativo — R$/km médio',
    (c: TooltipItem<'bar'>) => `${c.label}: ${fmtBR3.format(Number(c.parsed.y || 0))} R$/km`, true);

  /* =================== lifecycle =================== */
  ngOnInit(): void {
    this.loadPlacas();
    this.loadSeries();
  }

  /* =================== UI =================== */
  setUltimosDias(dias: number): void {
    this.fim = todayIso();
    this.inicio = addDaysIso(this.fim, -dias);
    this.loadPlacas();
    this.loadSeries();
  }
  onPeriodoChange(): void {
    if (this.inicio && this.fim && this.inicio > this.fim) {
      const tmp = this.inicio; this.inicio = this.fim; this.fim = tmp;
    }
  }
  selecionarTodas(): void { this.selecionadas = [...this.placas]; this.loadSeries(); }
  limparSelecao(): void { this.selecionadas = []; this.loadSeries(); }
  carregarSerie(): void { this.loadSeries(); }

  /* =================== calls =================== */
  private loadPlacas(): void {
    if (!this.inicio || !this.fim) return;
    this.api.placasNoPeriodo(this.inicio, this.fim).subscribe({
      next: vs => {
        this.placas = vs ?? [];
        this.selecionadas = this.selecionadas.filter(p => this.placas.includes(p));
      },
      error: _ => this.placas = []
    });
  }

  private loadSeries(): void {
    if (!this.inicio || !this.fim) { this.errorMsg = 'Informe início e fim.'; return; }
    this.loading = true; this.errorMsg = '';

    if (this.selecionadas.length === 0) {
      this.api.serieDiariaGet(this.inicio, this.fim, undefined).subscribe({
        next: (rows) => { this.series = [{ placa: 'Todos', rows: rows ?? [] }]; this.rebuild(); this.loading = false; },
        error: (err) => { this.series = [{ placa: 'Todos', rows: [] }]; this.rebuild(); this.loading = false; this.errorMsg = err?.error?.message || 'Falha ao carregar dados.'; }
      });
      return;
    }

    const calls = this.selecionadas.map(p => this.api.serieDiariaGet(this.inicio, this.fim, p));
    forkJoin(calls.length ? calls : [of([])]).subscribe({
      next: (arr) => { this.series = arr.map((rows, i) => ({ placa: this.selecionadas[i], rows: rows ?? [] })); this.rebuild(); this.loading = false; },
      error: (err) => { this.series = []; this.rebuild(); this.loading = false; this.errorMsg = err?.error?.message || 'Falha ao carregar dados.'; }
    });
  }

  /* =================== build charts =================== */
  private rebuild(): void {
    // União ordenada de todas as datas
    const labelSet = new Set<string>();
    for (const s of this.series) for (const r of (s.rows || [])) labelSet.add(r.dia);
    const labels = Array.from(labelSet.values()).sort();

    // helpers
    const mapDay = <T extends number | null>(rows: DiaAggResp[], pick: (r: DiaAggResp)=>T): Map<string, T> => {
      const m = new Map<string, T>(); for (const r of rows) m.set(r.dia, pick(r)); return m;
    };
    const buildDatasetsLine = (suf: string, pick: (r: DiaAggResp)=>number|null): ChartDataset<'line'>[] =>
      this.series.map(s => {
        const m = mapDay(s.rows, pick);
        const data = labels.map(d => m.get(d) ?? null);
        return { type: 'line', label: `${s.placa} — ${suf}`, data, fill: false } as ChartDataset<'line'>;
      });
    const buildDatasetsBar = (_suf: string, pick: (r: DiaAggResp)=>number|null): ChartDataset<'bar'>[] =>
      this.series.map(s => {
        const m = mapDay(s.rows, pick);
        const data = labels.map(d => m.get(d) ?? null);
        return { type: 'bar', label: `${s.placa}`, data } as ChartDataset<'bar'>;
      });

    // diários
    this.lineCustoData    = { labels, datasets: buildDatasetsLine('Custo',  r => num(r.custoTotal)) };
    this.barLitrosData    = { labels, datasets: buildDatasetsBar('Litros',  r => num(r.litros)) };
    this.barKmData        = { labels, datasets: buildDatasetsBar('Km',      r => num(r.kmRodados)) };
    this.linePrecoData    = { labels, datasets: buildDatasetsLine('R$/L',   r => num(r.vlrMedioPorLitro)) };
    this.lineKmLData      = { labels, datasets: buildDatasetsLine('km/L',   r => num(r.kmPorLitro)) };
    this.lineRsKmData     = { labels, datasets: buildDatasetsLine('R$/km',  r => num(r.rsPorKm)) };
    this.barQtData        = { labels, datasets: buildDatasetsBar('Qtde',    r => num(r.qtAbastecimentos)) };

    // acumulados
    const acumDatasets = (suf: string, pick: (r: DiaAggResp)=>number|null): ChartDataset<'line'>[] =>
      this.series.map(s => {
        const m = mapDay(s.rows, pick);
        const arr = labels.map(d => m.get(d) ?? null);
        return { type: 'line', label: `${s.placa} — ${suf}`, data: cumul(arr), fill: false } as ChartDataset<'line'>;
      });

    this.lineCustoAcData  = { labels, datasets: acumDatasets('Custo acumulado',  r => num(r.custoTotal)) };
    this.lineLitrosAcData = { labels, datasets: acumDatasets('Litros acumulados', r => num(r.litros)) };
    this.lineKmAcData     = { labels, datasets: acumDatasets('Km acumulado',     r => num(r.kmRodados)) };

    // médias
    this.lineTicketData   = {
      labels,
      datasets: buildDatasetsLine('Ticket médio', r => {
        const c = num(r.custoTotal); const q = num(r.qtAbastecimentos);
        return (!c || !q) ? null : c / q;
      })
    };

    this.lineLitrosMedData = {
      labels,
      datasets: buildDatasetsLine('Litros médios', r => {
        const L = num(r.litros); const q = num(r.qtAbastecimentos);
        return (!L || !q) ? null : L / q;
      })
    };

    // +6 comparativos (um ponto por veículo)
    const placas = this.series.map(s => s.placa);
    const total = (rows: DiaAggResp[], pick: (r: DiaAggResp)=>number|null) =>
      rows.reduce((acc, r) => acc + num0(pick(r)), 0);
    const media = (rows: DiaAggResp[], pick: (r: DiaAggResp)=>number|null) => {
      const vals = rows.map(pick).filter(v => v !== null) as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    this.barTotCustoPorCarro  = { labels: placas, datasets: [{ type: 'bar', label: 'Custo total (R$)', data: this.series.map(s => total(s.rows, r => num(r.custoTotal))) }] };
    this.barTotLitrosPorCarro = { labels: placas, datasets: [{ type: 'bar', label: 'Litros totais (L)', data: this.series.map(s => total(s.rows, r => num(r.litros))) }] };
    this.barTotKmPorCarro     = { labels: placas, datasets: [{ type: 'bar', label: 'Km totais (km)', data: this.series.map(s => total(s.rows, r => num(r.kmRodados))) }] };
    this.barMedPrecoPorCarro  = { labels: placas, datasets: [{ type: 'bar', label: 'Preço médio (R$/L)', data: this.series.map(s => media(s.rows, r => num(r.vlrMedioPorLitro))) }] };
    this.barMedKmLPorCarro    = { labels: placas, datasets: [{ type: 'bar', label: 'Consumo médio (km/L)', data: this.series.map(s => media(s.rows, r => num(r.kmPorLitro))) }] };
    this.barMedRsKmPorCarro   = { labels: placas, datasets: [{ type: 'bar', label: 'R$/km médio', data: this.series.map(s => media(s.rows, r => num(r.rsPorKm))) }] };
  }
}
