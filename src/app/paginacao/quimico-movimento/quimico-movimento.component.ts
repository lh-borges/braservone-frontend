import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  QuimicoMovimentoService,
  TipoMov,
  QuimicoMovimentoDTO,
} from './quimico-movimento.service';

import { QuimicoService, QuimicoDTO } from '../quimicos/quimico.service';
import { PocoService, PocoLite } from '../poco/poco.service';

type QuimicoLite = {
  codigo: number;
  lote?: string | null;
  tipoQuimico?: string | null;
  estadoLocalArmazenamento?: string | null;
};

type MovRow = QuimicoMovimentoDTO;

@Component({
  selector: 'app-quimico-movimento',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './quimico-movimento.component.html',
  styleUrls: ['./quimico-movimento.component.css'],
})
export class QuimicoMovimentoComponent implements OnInit {
  private movSvc = inject(QuimicoMovimentoService);
  private quimicoSvc = inject(QuimicoService);
  private pocoSvc = inject(PocoService);

  movLoading = false;
  movSalvando = false;
  mostrarCadastro = false;

  alertError = false;
  alertErrorMsg = '';

  selectedTipoQuimico?: string;
  selectedTipoMov?: TipoMov;
  loteQuery = '';

  movForm: {
    quimicoCodigo?: number;
    pocoCodigoAnp: string | null;
    tipo?: TipoMov;
    quantidade?: number | string;
  } = { pocoCodigoAnp: null };

  quimicosOptions: QuimicoLite[] = [];
  pocosOptions: PocoLite[] = [];
  tiposOptions: string[] = [];
  movRows: MovRow[] = [];

  ngOnInit(): void {
    this.preloadOptions();
  }

  // ============ LOAD DAS OPÇÕES ============

  private preloadOptions(): void {
    // Químicos (para o select) – APENAS ATIVOS
    this.quimicoSvc.listar().subscribe({
      next: (list: QuimicoDTO[]) => {
        const arr = list ?? [];

        // 🔥 mantém só químicos com status ATIVO
        const ativos = arr.filter((q) => q.statusQuimicos === 'ATIVO');

        this.quimicosOptions = ativos.map((q) => ({
          codigo: q.codigo,
          lote: q.lote ?? null,
          tipoQuimico: q.tipoQuimico ?? null,
          estadoLocalArmazenamento: q.estadoLocalArmazenamento ?? null,
        }));

        const tipos = new Set<string>();
        this.quimicosOptions.forEach((q) => {
          if (q.tipoQuimico) tipos.add(String(q.tipoQuimico));
        });
        this.tiposOptions = Array.from(tipos).sort();
      },
      error: (e: unknown) => this.showError(e),
    });

    // Poços (lite)
    this.pocoSvc.getAllPocosLite().subscribe({
      next: (pocos: PocoLite[]) => {
        this.pocosOptions = (pocos ?? []).map((p) => ({
          codigoAnp: (p.codigoAnp ?? '').trim(),
          nome: p.nome,
        }));
      },
      error: (e: unknown) => this.showError(e),
    });
  }

  // ============ HELPERS DE FORM / VALIDAÇÃO ============

  onPocoChange(v: string | null) {
    const trimmed = (v ?? '').trim();
    this.movForm.pocoCodigoAnp = trimmed.length ? trimmed : null;
    console.debug('[MOV] pocoCodigoAnp selecionado =', this.movForm.pocoCodigoAnp);
  }

  private isKnownPoco(code: string): boolean {
    const c = (code ?? '').trim();
    return !!c && this.pocosOptions.some((p) => (p.codigoAnp ?? '').trim() === c);
  }

  // Helpers de exibição, compat nested/flatten
  getLote(m: MovRow): string {
    return m.quimico?.lote ?? '-';
  }

  getTipoQuimico(m: MovRow): string {
    return m.quimico?.tipoQuimico ?? '-';
  }

  getPocoCodigo(m: MovRow): string {
    return m.poco?.codigoAnp ?? m.pocoCodigoAnp ?? '-';
  }

  // ============ AÇÕES (BUSCAS) ============

  carregarTodos(): void {
    this.movLoading = true;
    this.alertError = false;
    this.movSvc.listarTodos().subscribe({
      next: (rows) => (this.movRows = rows ?? []),
      error: (e) => this.showError(e),
      complete: () => (this.movLoading = false),
    });
  }

  carregarMovPorPoco(codigoAnp: string | null): void {
    const code = (codigoAnp ?? '').trim();
    if (!code) return;

    if (!this.isKnownPoco(code)) {
      this.showError({ message: `Poço inexistente na lista carregada: "${code}"` });
      return;
    }

    this.movLoading = true;
    this.alertError = false;
    this.movSvc.listarPorPoco(code).subscribe({
      next: (rows) => (this.movRows = rows ?? []),
      error: (e) => this.showError(e),
      complete: () => (this.movLoading = false),
    });
  }

  carregarMovPorTipoQuimico(tipoQuimico?: string): void {
    if (!tipoQuimico) return;
    this.movLoading = true;
    this.alertError = false;
    this.movSvc.listarPorTipoQuimico(tipoQuimico).subscribe({
      next: (rows) => (this.movRows = rows ?? []),
      error: (e) => this.showError(e),
      complete: () => (this.movLoading = false),
    });
  }

  carregarMovPorTipoMovimento(tipo?: TipoMov): void {
    if (!tipo) return;
    this.movLoading = true;
    this.alertError = false;
    this.movSvc.listarPorTipoMovimento(tipo).subscribe({
      next: (rows) => (this.movRows = rows ?? []),
      error: (e) => this.showError(e),
      complete: () => (this.movLoading = false),
    });
  }

  // ============ AÇÃO: REGISTRAR ============

  registrarMovimento(): void {
    const quimicoCodigo = this.movForm.quimicoCodigo;
    const pocoCodigoAnp = (this.movForm.pocoCodigoAnp ?? '').trim();
    const tipo = this.movForm.tipo;
    const quantidade = this.movForm.quantidade;

    if (!quimicoCodigo || !pocoCodigoAnp || !tipo || quantidade == null) {
      this.showError({ message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    if (!this.isKnownPoco(pocoCodigoAnp)) {
      this.showError({ message: `Poço inexistente na lista carregada: "${pocoCodigoAnp}"` });
      return;
    }

    this.movSalvando = true;
    this.alertError = false;

    console.debug('[MOV] payload', { quimicoCodigo, pocoCodigoAnp, tipo, quantidade });

    this.movSvc
      .registrarFromFields({
        quimicoCodigo,
        pocoCodigoAnp,
        tipo,
        quantidade,
      })
      .subscribe({
        next: () => {
          this.mostrarCadastro = false;
          this.movForm = { pocoCodigoAnp: null };
          this.carregarTodos();
        },
        error: (e) => this.showError(e),
        complete: () => (this.movSalvando = false),
      });
  }

  // ============ AÇÃO: DELETAR ============

  deletarMovimento(m: MovRow): void {
    if (!m?.id) return;

    const confirmado = confirm(`Confirmar exclusão do movimento #${m.id}?`);
    if (!confirmado) return;

    this.movLoading = true;
    this.alertError = false;

    this.movSvc.deletar(m.id).subscribe({
      next: () => {
        this.movRows = this.movRows.filter((row) => row.id !== m.id);
      },
      error: (e) => this.showError(e),
      complete: () => (this.movLoading = false),
    });
  }

  // ============ TABELA / FILTRO ============

  trackMov = (_: number, m: MovRow): number => m.id;

  get movRowsFiltrados(): MovRow[] {
    const q = (this.loteQuery || '').trim().toLowerCase();
    if (!q) return this.movRows;

    return this.movRows.filter((m) =>
      (m.quimico?.lote ?? '')
        .toString()
        .toLowerCase()
        .includes(q),
    );
  }

  // ============ ERROS ============

  private showError(e: any): void {
    const msg =
      e?.mensage ??
      e?.Mensage ??
      e?.message ??
      e?.error?.mensage ??
      e?.error?.Mensage ??
      e?.error?.message ??
      'Erro ao processar a requisição.';
    this.alertErrorMsg = msg;
    this.alertError = true;
    console.warn('[MOV] erro:', e);
  }
}
