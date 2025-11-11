import { Component, OnInit, Type, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import {
  QuimicoService,
  QuimicoDTO,
  TipoQuimico,
  StatusQuimicos,
  QuimicoCreatePayload,
  QuimicoUpdatePayload,
  UnidadeOption,
  UNIDADES_OPTIONS,
  UnidadeCode,
  Estado
} from '../quimicos/quimico.service';

import {
  FornecedorService,
  Fornecedor as FornecedorDTO
} from '../fornecedor/fornecedor.service';

// ===== Helpers de data =====
function toIsoStartOfDayUTC(yyyyMMdd: string): string {
  return yyyyMMdd ? `${yyyyMMdd}T00:00:00Z` : '';
}
function isoToDateInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.length >= 10 ? iso.substring(0, 10) : '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Component({
  selector: 'app-quimicos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderComponent, MenuLateralComponent],
  providers: [DatePipe],
  templateUrl: './quimicos.component.html',
  styleUrls: ['./quimicos.component.css']
})
export class QuimicosComponent implements OnInit {
  // services
  private quimicoService = inject(QuimicoService);
  private fornecedorService = inject(FornecedorService);
  private toastr = inject(ToastrService);

  // abas + lazy-load
  activeTab: 'cadastro' | 'mov' | 'graficos' | 'estoque' = 'cadastro';

  movCmpType: Type<any> | null = null;
  loadingMovCmp = false;

  grafCmpType: Type<any> | null = null;
  loadingGrafCmp = false;

  estoqueCmpType: Type<any> | null = null;
  loadingEstoqueCmp = false;

  async setTab(tab: 'cadastro' | 'mov' | 'graficos' | 'estoque') {
    this.activeTab = tab;

    if (tab === 'mov' && !this.movCmpType) {
      this.loadingMovCmp = true;
      try {
        const mod = await import('../quimico-movimento/quimico-movimento.component');
        this.movCmpType = mod.QuimicoMovimentoComponent as Type<any>;
      } catch (e) {
        console.error('[Químicos] Falha ao carregar QuimicoMovimentoComponent', e);
        this.toastr.error('Não foi possível carregar Movimentação.', 'Erro', { positionClass: 'toast-bottom-center' });
      } finally {
        this.loadingMovCmp = false;
      }
    }

    if (tab === 'graficos' && !this.grafCmpType) {
      this.loadingGrafCmp = true;
      try {
        const mod = await import('../quimico-grafico/quimico-grafico.component');
        this.grafCmpType = mod.QuimicoGraficoComponent as Type<any>;
      } catch (e) {
        console.error('[Químicos] Falha ao carregar QuimicoGraficoComponent', e);
        this.toastr.error('Não foi possível carregar Gráficos.', 'Erro', { positionClass: 'toast-bottom-center' });
      } finally {
        this.loadingGrafCmp = false;
      }
    }

    if (tab === 'estoque' && !this.estoqueCmpType) {
      this.loadingEstoqueCmp = true;
      try {
        const mod = await import('../quimico-estoque/quimico-estoque.component');
        this.estoqueCmpType = mod.QuimicoEstoqueComponent as Type<any>;
      } catch (e) {
        console.error('[Químicos] Falha ao carregar QuimicoEstoqueComponent', e);
        this.toastr.error('Não foi possível carregar Estoque Atual.', 'Erro', { positionClass: 'toast-bottom-center' });
      } finally {
        this.loadingEstoqueCmp = false;
      }
    }
  }

  // filtros
  searchTerm = '';
  statusFiltro: 'TODOS' | StatusQuimicos = 'TODOS';

  // options
  statusOptions: StatusQuimicos[] = [StatusQuimicos.ATIVO, StatusQuimicos.FINALIZADO];
  tiposQuimico: TipoQuimico[] = [
    'ACELERADORES', 'RETARDADORES', 'EXTENSORES', 'ADITIVOS_PESO', 'DISPERSANTE', 'CONTROLADORES', 'ANTIESPUMANTE'
  ];
  unidadesOptions: UnidadeOption[] = UNIDADES_OPTIONS;

  // estados brasileiros para o local de armazenamento
  estados: Estado[] = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  // dataset
  carregando = false;
  quimicos: QuimicoDTO[] = [];

  fornecedores: Array<{ id: number; nome: string }> = [];
  carregandoFornecedores = false;

  // form state
  exibirFormulario = false;
  salvando = false;
  carregandoForm = false;
  get formBusy(): boolean { return this.salvando || this.carregandoForm; }

  editando = false;
  codigoEmEdicao: number | null = null;

  novo: Partial<QuimicoDTO & {
    fornecedorId?: number;
    dataCompra?: string | null;
    dataCompraDateInput?: string;
    // validade (LocalDate)
    dataValidade?: string | null;
    dataValidadeDateInput?: string;
    statusQuimicos?: StatusQuimicos | null;
    estadoLocalArmazenamento?: Estado | null;
    observacao?: string | null;
  }> = {
    statusQuimicos: StatusQuimicos.ATIVO,
    dataCompraDateInput: '',
    dataValidadeDateInput: '',
    estadoLocalArmazenamento: null,
    observacao: ''
  };

  // ===== Formatação de estoque (concatena quantidade + unidade) =====
  private nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 6 });
  fmtEstoque(q: QuimicoDTO): string {
    const qty = Number(q.estoqueInicial ?? 0);
    return `${this.nf.format(qty)} ${q.unidade}`;
  }

  // computed
  get quimicosFiltrados(): QuimicoDTO[] {
    const termo = (this.searchTerm ?? '').trim().toLowerCase();
    let arr = this.quimicos ?? [];
    if (termo) {
      arr = arr.filter(q => {
        const codigoStr = q.codigo != null ? String(q.codigo) : '';
        const tipoStr   = q.tipoQuimico != null ? String(q.tipoQuimico).toLowerCase() : '';
        const fornStr   = q.fornecedor?.nome?.toLowerCase() ?? '';
        const loteStr   = (q.lote ?? '').toLowerCase();
        return codigoStr.includes(termo) || tipoStr.includes(termo) || fornStr.includes(termo) || loteStr.includes(termo);
      });
    }
    if (this.statusFiltro !== 'TODOS') {
      arr = arr.filter(q => q.statusQuimicos === this.statusFiltro);
    }
    return arr;
  }
  onPesquisar() { /* filtro já é reativo via getter */ }

  // lifecycle
  ngOnInit(): void {
    this.carregarQuimicos();
    this.carregarFornecedores();
  }

  // data loads
  private carregarQuimicos(): void {
    this.carregando = true;
    this.quimicoService.listar().subscribe({
      next: lista => { this.quimicos = lista ?? []; this.carregando = false; },
      error: err => {
        this.carregando = false;
        this.toastr.error('Falha ao carregar a lista de químicos.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  private carregarFornecedores(): void {
    this.carregandoFornecedores = true;
    this.fornecedorService.listar().subscribe({
      next: (lista: FornecedorDTO[]) => {
        this.fornecedores = (lista ?? []).map(f => ({ id: f.id, nome: f.nome }));
        this.carregandoFornecedores = false;
      },
      error: err => {
        this.carregandoFornecedores = false;
        this.toastr.error('Falha ao carregar fornecedores.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  get labelSalvar(): string { return this.editando ? 'Salvar Alterações' : 'Salvar'; }

  novoQuimico(): void {
    this.editando = false;
    this.codigoEmEdicao = null;
    this.carregandoForm = false;
    this.novo = {
      statusQuimicos: StatusQuimicos.ATIVO,
      dataCompraDateInput: '',
      dataValidadeDateInput: '',
      estadoLocalArmazenamento: null,
      observacao: ''
    };
    this.exibirFormulario = true;
  }

  cancelarCadastro(): void {
    this.exibirFormulario = false;
    this.novo = {
      statusQuimicos: StatusQuimicos.ATIVO,
      dataCompraDateInput: '',
      dataValidadeDateInput: '',
      estadoLocalArmazenamento: null,
      observacao: ''
    };
    this.editando = false;
    this.codigoEmEdicao = null;
    this.carregandoForm = false;
  }

  salvarQuimico(): void {
    if (!this.novo.tipoQuimico || !this.novo.unidade || this.novo.fornecedorId == null) {
      this.toastr.warning('Preencha Tipo, Fornecedor e Unidade.', 'Campos obrigatórios', { positionClass: 'toast-bottom-center' });
      return;
    }

    const payloadBase: QuimicoCreatePayload = {
      tipoQuimico: this.novo.tipoQuimico as TipoQuimico,
      fornecedorId: this.novo.fornecedorId!,
      lote: this.novo.lote ?? null,
      unidade: this.novo.unidade as UnidadeCode,
      estoqueInicial: Number(this.novo.estoqueInicial ?? 0),
      valorQuimico: this.novo.valorQuimico != null ? Number(this.novo.valorQuimico) : null,
      statusQuimicos: (this.novo.statusQuimicos ?? StatusQuimicos.ATIVO) as StatusQuimicos,
      // LocalDate (sem timezone)
      dataValidade: (this.novo.dataValidadeDateInput && this.novo.dataValidadeDateInput.length === 10)
        ? this.novo.dataValidadeDateInput
        : null,
      // OffsetDateTime (com Z)
      dataCompra: (this.novo.dataCompraDateInput && this.novo.dataCompraDateInput.length === 10)
        ? toIsoStartOfDayUTC(this.novo.dataCompraDateInput)
        : null,
      estadoLocalArmazenamento: this.novo.estadoLocalArmazenamento ?? null,
      observacao: this.novo.observacao ?? null
    };

    this.salvando = true;

    const obs = (this.editando && this.codigoEmEdicao != null)
      ? this.quimicoService.atualizar(this.codigoEmEdicao, payloadBase as QuimicoUpdatePayload)
      : this.quimicoService.criar(payloadBase);

    obs.subscribe({
      next: dto => {
        if (this.editando) {
          const idx = this.quimicos.findIndex(q => q.codigo === this.codigoEmEdicao);
          if (idx >= 0) this.quimicos[idx] = dto;
        } else {
          this.quimicos = [dto, ...this.quimicos];
        }
        const msg = this.editando ? 'Químico atualizado com sucesso!' : 'Químico criado com sucesso!';
        this.toastr.success(msg, 'Sucesso', { positionClass: 'toast-bottom-center' });
        this.resetarFormulario();
      },
      error: err => {
        this.salvando = false;
        this.toastr.error('Não foi possível salvar o químico.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  private resetarFormulario(): void {
    this.salvando = false;
    this.exibirFormulario = false;
    this.editando = false;
    this.codigoEmEdicao = null;
    this.novo = {
      statusQuimicos: StatusQuimicos.ATIVO,
      dataCompraDateInput: '',
      dataValidadeDateInput: '',
      estadoLocalArmazenamento: null,
      observacao: ''
    };
  }

  onEditar(q: QuimicoDTO): void {
    if (q.codigo == null) return;
    this.editando = true;
    this.codigoEmEdicao = q.codigo;
    this.exibirFormulario = true;
    this.carregandoForm = true;

    this.quimicoService.obter(q.codigo).subscribe({
      next: full => {
        this.novo = {
          tipoQuimico: full.tipoQuimico,
          lote: full.lote ?? null,
          unidade: full.unidade as UnidadeCode,
          estoqueInicial: full.estoqueInicial,
          valorQuimico: full.valorQuimico ?? null,
          fornecedorId: full.fornecedor?.id,
          dataCompra: full.dataCompra ?? null,
          dataCompraDateInput: isoToDateInput(full.dataCompra ?? null),
          dataValidade: full.dataValidade ?? null,
          dataValidadeDateInput: isoToDateInput(full.dataValidade ?? null),
          statusQuimicos: full.statusQuimicos ?? StatusQuimicos.ATIVO,
          estadoLocalArmazenamento: full.estadoLocalArmazenamento ?? null,
          observacao: full.observacao ?? ''
        };
        this.carregandoForm = false;
      },
      error: err => {
        this.carregandoForm = false;
        this.toastr.error('Falha ao carregar dados para edição.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  onExcluir(q: QuimicoDTO): void {
    if (q.codigo == null) return;
    if (!confirm(`Excluir químico ${q.codigo}?`)) return;
    this.quimicoService.remover(q.codigo).subscribe({
      next: () => { this.quimicos = this.quimicos.filter(x => x.codigo !== q.codigo); },
      error: err => {
        this.toastr.error('Não é possível excluir: verifique se há movimentações.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  trackByCodigo = (i: number, q: QuimicoDTO) => q.codigo ?? i;
}
