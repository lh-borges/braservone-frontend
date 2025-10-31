import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import {
  AbastecimentoService,
  AbastecimentoCreateDTO,
  AbastecimentoResponseDTO,
} from './abastecimento.service';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';
import { AbastecimentoCadastroCsvComponent } from '../abastecimento-cadastrocsv/abastecimento-cadastrocsv.component';
import { AbastecimentoGraficoComponent } from '../abastecimento-grafico/abastecimento-grafico.component';

function toLocalDateTimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fromDateTimeLocalInput(v: string): string {
  if (!v) return '';
  return v.length === 16 ? `${v}:00` : v; // garante segundos
}
function toNumberOrNull(v: unknown): number | null {
  return v === null || v === undefined || v === '' ? null : Number(v);
}
function isoToDatetimeLocalInput(s: string): string {
  if (!s) return '';
  return s.length >= 16 ? s.substring(0, 16) : s;
}
const atLeastOnePrice: ValidatorFn = (group: AbstractControl) => {
  const vt  = group.get('valorTotal')?.value;
  const vpl = group.get('valorPorLitro')?.value;
  const hasVT  = !(vt === null || vt === undefined || vt === '');
  const hasVPL = !(vpl === null || vpl === undefined || vpl === '');
  return hasVT || hasVPL ? null : { priceMissing: true };
};

type Aba = 'gerenciar' | 'relatorios' | 'estatisticas';
type ListMode = 'todos' | 'placa';

@Component({
  selector: 'app-abastecimentos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    MenuLateralComponent,
    // Mantemos no imports para uso no template; *ngIf controla instanciamento
    AbastecimentoCadastroCsvComponent,
    AbastecimentoGraficoComponent
  ],
  templateUrl: './abastecimento.component.html',
  styleUrls: ['./abastecimento.component.css']
})
export class AbastecimentoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(AbastecimentoService);

  // Abas
  activeTab = signal<Aba>('gerenciar');
  setTab(tab: Aba) { this.activeTab.set(tab); }
  isTab = (tab: Aba) => this.activeTab() === tab;

  // UI state
  loading = signal(false);
  saving  = signal(false);
  errorMsg = signal<string | null>(null);
  infoMsg  = signal<string | null>(null);

  // Form state (novo/editar)
  formVisible = signal(false);
  editingId = signal<number | null>(null);
  isEditing = computed(() => this.editingId() !== null);
  submitLabel = computed(() => this.isEditing() ? 'Alterar' : 'Salvar');
  formTitle  = computed(() => this.isEditing() ? 'Editar Abastecimento' : 'Novo Abastecimento');

  // paginação
  page = signal(0);
  size = signal(10);
  totalPages = signal(0);
  totalElements = signal(0);

  // dados
  rows = signal<AbastecimentoResponseDTO[]>([]);

  // filtro (placa)
  placa = signal<string>('');

  // modo de listagem
  listMode = signal<ListMode>('todos'); // 'todos' | 'placa'
  isTodos = computed(() => this.listMode() === 'todos');

  form = this.fb.group({
    placaVeiculo: ['', [Validators.required]],
    distRodadaKm: [null as number | null, [Validators.required, Validators.min(0)]],
    volumeLitros: [null as number | null, [Validators.required, Validators.min(0)]],
    valorTotal:   [null as number | null, [Validators.min(0)]],
    valorPorLitro:[null as number | null, [Validators.min(0)]],
    mediaKmPorL:  [null as number | null, [Validators.min(0)]],
    mediaRsPorKm: [null as number | null, [Validators.min(0)]],
    dataAbastecimentoLocal: ['', [Validators.required]],
  }, { validators: atLeastOnePrice });

  priceMissing = computed(() => !!this.form.errors?.['priceMissing']);

  hasError = (controlName: string, error: string) =>
    this.form.get(controlName)?.touched && this.form.get(controlName)?.hasError(error);

  async ngOnInit(): Promise<void> {
    const now = new Date();
    const seed = toLocalDateTimeString(now).substring(0, 16);
    this.form.patchValue({ dataAbastecimentoLocal: seed });

    // Ao abrir a página, lista TODOS
    await this.carregarTodos(0);
  }

  // ===== Novo / Editar / Cancelar =====
  novo() {
    this.editingId.set(null);
    this.form.reset({
      placaVeiculo: '',
      distRodadaKm: null,
      volumeLitros: null,
      valorTotal: null,
      valorPorLitro: null,
      mediaKmPorL: null,
      mediaRsPorKm: null,
      dataAbastecimentoLocal: toLocalDateTimeString(new Date()).substring(0,16),
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.formVisible.set(true);
    this.setTab('gerenciar');
  }

  editar(row: AbastecimentoResponseDTO) {
    this.editingId.set(row.id);
    this.form.patchValue({
      placaVeiculo: row.placaVeiculo,
      distRodadaKm: row.distRodadaKm,
      volumeLitros: row.volumeLitros,
      valorTotal: row.valorTotal,
      valorPorLitro: row.valorPorLitro,
      mediaKmPorL: row.mediaKmPorL,
      mediaRsPorKm: row.mediaRsPorKm,
      dataAbastecimentoLocal: isoToDatetimeLocalInput(row.dataAbastecimento),
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.formVisible.set(true);
    this.setTab('gerenciar');
  }

  cancelarEdicao() {
    this.editingId.set(null);
    this.formVisible.set(false);
  }

  // ===== Listagem (TODOS) =====
  async carregarTodos(page = 0) {
    this.errorMsg.set(null);
    this.infoMsg.set(null);
    this.loading.set(true);
    try {
      const resp = await firstValueFrom(this.svc.listarTodos(page, this.size()));
      this.rows.set(resp.content);
      this.totalPages.set(resp.totalPages);
      this.totalElements.set(resp.totalElements);
      this.page.set(resp.number);
      this.listMode.set('todos');
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || 'Falha ao carregar abastecimentos (todos).');
    } finally {
      this.loading.set(false);
    }
  }

  // ===== Listagem (por PLACA) =====
  async carregar(page = 0) {
    this.errorMsg.set(null);
    this.infoMsg.set(null);

    const placa = this.placa().trim();
    if (!placa) {
      await this.carregarTodos(0);
      return;
    }

    this.loading.set(true);
    try {
      const existe = await firstValueFrom(this.svc.verificarVeiculo(placa));
      if (!existe) {
        this.errorMsg.set('Veículo não encontrado.');
        this.rows.set([]);
        this.totalPages.set(0);
        this.totalElements.set(0);
        this.page.set(0);
        this.listMode.set('placa');
        return;
      }

      const resp = await firstValueFrom(this.svc.listarPorVeiculo(placa, page, this.size()));
      this.rows.set(resp.content);
      this.totalPages.set(resp.totalPages);
      this.totalElements.set(resp.totalElements);
      this.page.set(resp.number);
      this.listMode.set('placa');
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || 'Falha ao carregar abastecimentos.');
    } finally {
      this.loading.set(false);
    }
  }

  limparFiltro() {
    this.placa.set('');
    this.carregarTodos(0);
  }

  // ===== Salvar / Alterar =====
  async submit() {
    this.errorMsg.set(null);
    this.infoMsg.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.errorMsg.set('Preencha os campos obrigatórios (e informe Valor Total ou Valor por Litro).');
      return;
    }

    const v = this.form.value;
    const payload: AbastecimentoCreateDTO = {
      placaVeiculo: (v.placaVeiculo || '').toUpperCase().trim(),
      distRodadaKm: Number(v.distRodadaKm),
      volumeLitros: Number(v.volumeLitros),
      valorTotal:    toNumberOrNull(v.valorTotal),
      valorPorLitro: toNumberOrNull(v.valorPorLitro),
      mediaKmPorL:   toNumberOrNull(v.mediaKmPorL),
      mediaRsPorKm:  toNumberOrNull(v.mediaRsPorKm),
      dataAbastecimento: fromDateTimeLocalInput(v.dataAbastecimentoLocal as string),
    };

    this.saving.set(true);
    try {
      const existe = await firstValueFrom(this.svc.verificarVeiculo(payload.placaVeiculo));
      if (!existe) {
        this.errorMsg.set('Veículo não encontrado.');
        return;
      }

      if (this.isEditing()) {
        await firstValueFrom(this.svc.atualizar(this.editingId()!, payload));
        this.infoMsg.set('Abastecimento alterado com sucesso.');
        this.cancelarEdicao();
      } else {
        await firstValueFrom(this.svc.criar(payload));
        this.infoMsg.set('Abastecimento cadastrado com sucesso.');
        this.form.patchValue({
          distRodadaKm: null,
          volumeLitros: null,
          valorTotal: null,
          valorPorLitro: null,
          mediaKmPorL: null,
          mediaRsPorKm: null,
        });
      }

      if (this.listMode() === 'placa' && this.placa().toUpperCase().trim() === payload.placaVeiculo) {
        await this.carregar(this.page());
      } else {
        await this.carregarTodos(this.page());
      }
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || 'Falha ao salvar.');
    } finally {
      this.saving.set(false);
    }
  }

  async remover(id: number) {
    if (!confirm('Remover este registro?')) return;

    this.loading.set(true);
    this.errorMsg.set(null);
    this.infoMsg.set(null);
    try {
      await firstValueFrom(this.svc.excluir(id));
      this.infoMsg.set('Removido.');
      if (this.listMode() === 'placa') {
        await this.carregar(this.page());
      } else {
        await this.carregarTodos(this.page());
      }
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || 'Falha ao remover.');
    } finally {
      this.loading.set(false);
    }
  }

  async goToPage(p: number) {
    if (p < 0 || p >= this.totalPages()) return;
    if (this.listMode() === 'placa') {
      await this.carregar(p);
    } else {
      await this.carregarTodos(p);
    }
  }

  canPrev = computed(() => this.page() > 0);
  canNext = computed(() => this.page() + 1 < this.totalPages());
}
