import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  QuimicoMovimentoService,
  TipoMov,
  QuimicoMovimentoDTO,
  RegistrarMovimentoPayload
} from '../quimico-movimento/quimico-movimento.service';

import { QuimicoService, QuimicoDTO, TipoQuimico } from '../quimicos/quimico.service';
import { PocoService, PocoLite } from '../poco/poco.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface MovForm {
  quimicoCodigo?: number;
  pocoCodigoAnp?: string;
  tipo?: TipoMov;
  quantidade?: string | number;
}
type MovRow = QuimicoMovimentoDTO & { lote?: string | null; tipoQuimico?: TipoQuimico };

@Component({
  selector: 'app-quimico-movimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quimico-movimento.component.html',
  styleUrls: ['./quimico-movimento.component.css']
})
export class QuimicoMovimentoComponent implements OnInit {
  constructor(
    private movService: QuimicoMovimentoService,
    private quimicoService: QuimicoService,
    private pocoService: PocoService
  ) {}

  // estado/form
  tiposMovimento: TipoMov[] = ['ENTRADA', 'SAIDA'];
  movForm: MovForm = { quimicoCodigo: undefined, pocoCodigoAnp: '', tipo: undefined, quantidade: '' };
  movSalvando = false;
  movLoading = false;
  mostrarCadastro = false;

  // filtros
  selectedTipoQuimico?: TipoQuimico;
  selectedTipoMov?: TipoMov;
  loteQuery = '';

  // listas
  quimicosOptions: Array<Pick<QuimicoDTO, 'codigo' | 'tipoQuimico' | 'fornecedor' | 'lote'>> = [];
  tiposOptions: TipoQuimico[] = [];
  pocosOptions: PocoLite[] = [];

  // dados
  private movimentos: QuimicoMovimentoDTO[] = [];
  movRows: MovRow[] = []; // enriquecidos com lote/tipoQuimico

  // maps auxiliares (codigoQuimico -> props)
  private mapCodigoToLote = new Map<number, string | null>();
  private mapCodigoToTipo = new Map<number, TipoQuimico>();

  ngOnInit(): void {
    this.carregarListasReferencia();
  }

  /** Carrega referências (químicos + poços) e prepara maps */
  private carregarListasReferencia() {
    this.movLoading = true;
    forkJoin({
      quimicos: this.quimicoService.listarAtivo().pipe(catchError(() => of([] as QuimicoDTO[]))),
      pocos: this.pocoService.getAllPocosLite().pipe(catchError(() => of([] as PocoLite[])))
    }).subscribe({
      next: ({ quimicos, pocos }) => {
        this.quimicosOptions = [...(quimicos ?? [])].sort((a, b) => (a.codigo ?? 0) - (b.codigo ?? 0));
        this.pocosOptions = pocos ?? [];

        // construir maps e lista de tipos únicos
        const tiposSet = new Set<TipoQuimico>();
        for (const q of this.quimicosOptions) {
          if (q.codigo != null) {
            this.mapCodigoToLote.set(q.codigo, q.lote ?? null);
            this.mapCodigoToTipo.set(q.codigo, q.tipoQuimico);
          }
          tiposSet.add(q.tipoQuimico);
        }
        this.tiposOptions = Array.from(tiposSet.values()).sort();
      },
      complete: () => (this.movLoading = false)
    });
  }

  /** Normaliza referências aninhadas e enriquece com lote/tipoQuimico */
  private normalize(list: QuimicoMovimentoDTO[] | null | undefined): MovRow[] {
    const arr = Array.isArray(list) ? list : [];
    return arr.map(m => {
      const quimicoCodigo = m.quimicoCodigo ?? m.quimico?.codigo ?? undefined;
      const pocoCodigoAnp = m.pocoCodigoAnp ?? m.poco?.codigoAnp ?? '';
      return {
        ...m,
        quimicoCodigo,
        pocoCodigoAnp,
        lote: quimicoCodigo != null ? this.mapCodigoToLote.get(quimicoCodigo) ?? null : null,
        tipoQuimico: quimicoCodigo != null ? this.mapCodigoToTipo.get(quimicoCodigo) : undefined
      };
    });
  }

  /** Reaplica filtro por lote no array enriquecido */
  get movRowsFiltrados(): MovRow[] {
    const q = this.loteQuery.trim().toLowerCase();
    if (!q) return this.movRows;
    return this.movRows.filter(r => (r.lote ?? '').toLowerCase().includes(q));
  }

  // --------- Ações da toolbar ---------
  carregarTodos() {
    this.movLoading = true;
    this.movService.listarTodos().subscribe({
      next: lista => {
        this.movimentos = lista ?? [];
        this.movRows = this.normalize(this.movimentos);
        this.ordenarPorDataDesc();
        this.movLoading = false;
      },
      error: _ => { this.movimentos = []; this.movRows = []; this.movLoading = false; }
    });
  }

  carregarMovPorPoco(codigoAnp?: string | null) {
    const key = (codigoAnp ?? '').trim();
    if (!key) return;
    this.movLoading = true;
    this.movService.listarPorPoco(key).subscribe({
      next: lista => {
        this.movRows = this.normalize(lista);
        this.ordenarPorDataDesc();
        this.movLoading = false;
      },
      error: _ => { this.movRows = []; this.movLoading = false; }
    });
  }

  /** Por TIPO DE MOVIMENTO (ENTRADA|SAIDA) — usa endpoint /tipo/{tipo} */
  carregarMovPorTipoMovimento(tipo?: TipoMov) {
    if (!tipo) return;
    this.movLoading = true;
    this.movService.listarPorTipo(tipo).subscribe({
      next: lista => {
        this.movRows = this.normalize(lista);
        this.ordenarPorDataDesc();
        this.movLoading = false;
      },
      error: _ => { this.movRows = []; this.movLoading = false; }
    });
  }

  /** Por TIPO DE QUÍMICO — client-side: pega códigos e faz forkJoin de /quimico/{codigo} */
  carregarMovPorTipoQuimico(tipo?: TipoQuimico) {
    if (!tipo) return;

    // códigos dos químicos desse tipo
    const codigos = this.quimicosOptions
      .filter(q => q.tipoQuimico === tipo)
      .map(q => q.codigo)
      .filter((c): c is number => typeof c === 'number');

    if (codigos.length === 0) {
      this.movRows = [];
      return;
    }

    this.movLoading = true;
    forkJoin(codigos.map(c => this.movService.listarPorQuimico(c)))
      .pipe(map(arrays => arrays.flat()))
      .subscribe({
        next: lista => {
          this.movRows = this.normalize(lista);
          this.ordenarPorDataDesc();
          this.movLoading = false;
        },
        error: _ => { this.movRows = []; this.movLoading = false; }
      });
  }

  // --------- Cadastro ---------
  registrarMovimento() {
    const { quimicoCodigo, pocoCodigoAnp, tipo } = this.movForm;
    const quantidadeVal = this.movForm.quantidade;

    if (!quimicoCodigo || !pocoCodigoAnp || !tipo || quantidadeVal === undefined || quantidadeVal === '') {
      alert('Preencha Químico, Poço (código ANP), Tipo e Quantidade.');
      return;
    }
    const qtdNum = typeof quantidadeVal === 'number' ? quantidadeVal : Number(quantidadeVal);
    if (!isFinite(qtdNum) || qtdNum <= 0) { alert('Quantidade inválida.'); return; }

    const payload: RegistrarMovimentoPayload = {
      quimicoCodigo: Number(quimicoCodigo),
      pocoCodigoAnp: String(pocoCodigoAnp).trim(),
      tipo: tipo!,
      quantidade: qtdNum.toFixed(6)
    };

    this.movSalvando = true;
    this.movService.registrar(payload).subscribe({
      next: salvo => {
        const normalized = this.normalize([salvo]);
        this.movRows = [...normalized, ...this.movRows];
        this.ordenarPorDataDesc();
        this.movForm.quantidade = '';
        this.movSalvando = false;
        this.mostrarCadastro = false;
      },
      error: _ => this.movSalvando = false
    });
  }

  private ordenarPorDataDesc() {
    this.movRows.sort((a, b) => {
      const da = new Date(a.criadoEm).getTime();
      const db = new Date(b.criadoEm).getTime();
      return isFinite(db - da) ? (db - da) : 0;
    });
  }

  trackMov = (_: number, m: MovRow) => m.id;
}
