import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// layout
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';
import { HeaderComponent } from '../utilities/header/header.component';

// serviços e modelos
import { OperacaoService, CreatePayload, ListParams, PatchPayload } from './operacao.service';
import { Page, OperacaoDTO } from '../../dto/operacao-dto';
import { OperadoraService } from '../operadora/operadora.service';
import { OperadoraDTO } from '../../dto/operadora-dto'; 

// 👇 service de poço
import { PocoService } from '../poco/poco.service';
import { PocoDTO } from '../../dto/poco-dto';

type Status = 'Ativo' | 'Inativo';

interface OperacaoCard {
  id: number;
  titulo: string;
  operadora: string;
  status: Status;
}

// modelo enxuto do Poço para o <select>
interface PocoMin {
  codigoAnp: string;
  siglaCampo?: string;
  nomeCampo?: string;
}

@Component({
  selector: 'app-operacao',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuLateralComponent, HeaderComponent],
  templateUrl: './operacao.component.html',
  styleUrls: ['./operacao.component.css']
})
export class OperacaoComponent implements OnInit {
  // services
  private svc = inject(OperacaoService);
  private opSvc = inject(OperadoraService);
  private pocoSvc = inject(PocoService);

  // filtros
  searchTerm = '';
  filtroOperadora = '';     // id como string (ex: "1")
  filtroStatus: '' | Status = '';

  // selects (vindos do back)
  operadoras: OperadoraDTO[] = [];
  loadingOperadoras = false;

  pocos: PocoMin[] = [];
  loadingPocos = false;

  // paginação
  page = 0;
  size = 25;
  total = 0;

  // dados renderizados
  filteredOps: OperacaoCard[] = [];

  // flags de UI
  loading = false;
  errorMsg = '';

  // modal: criar/editar
  showAddModal = false;
  saving = false;

  // controle de edição
  private editingId: number | null = null;
  get isEditing(): boolean { return this.editingId !== null; }

  newOp: {
    nomeOperacao: string | null;
    operadoraId: number | null;
    pocoCodigoAnp: string | null;
    status: boolean;
    dataInicioLocal?: string | null; // <input type="datetime-local">
    dataFinalLocal?: string | null;  // <input type="datetime-local">
  } = this.emptyNewOp();

  private emptyNewOp() {
    return {
      nomeOperacao: null,
      operadoraId: null,
      pocoCodigoAnp: null,
      status: true,
      dataInicioLocal: null,
      dataFinalLocal: null,
    };
  }

  ngOnInit(): void {
    this.loadOperadoras();
    this.loadPocos();
    this.fetch();
  }

  // ======= Carregamentos =======
  private loadOperadoras(): void {
    this.loadingOperadoras = true;
    this.opSvc.getAllOperadoras().subscribe({
      next: (ops) => {
        this.operadoras = [...ops].sort((a, b) => a.nome.localeCompare(b.nome));
        this.loadingOperadoras = false;
      },
      error: (e) => {
        console.error('Falha ao carregar operadoras', e);
        this.loadingOperadoras = false;
      }
    });
  }

  private loadPocos(): void {
    this.loadingPocos = true;
    this.pocoSvc.getAllPocos().subscribe({
      next: (pocosDto: PocoDTO[]) => {
        // mapeia para o formato do select (mostrando algo amigável)
        this.pocos = pocosDto.map<PocoMin>(p => ({
          codigoAnp: (p as any).codigoAnp ?? (p as any).codANP ?? '', // compatibilidade
          siglaCampo: (p as any).siglaCampo,
          nomeCampo: (p as any).nomeCampo,
        })).filter(p => !!p.codigoAnp);
        this.loadingPocos = false;
      },
      error: (e) => {
        console.error('Falha ao carregar poços', e);
        this.loadingPocos = false;
      }
    });
  }

  fetch(): void {
    this.loading = true;
    this.errorMsg = '';

    const params: ListParams = {
      page: this.page,
      size: this.size,
      sort: 'id,desc',
      status: this.filtroStatus,
      operadoraId: this.filtroOperadora,
      search: this.searchTerm?.trim() || ''
    };

    this.svc.list(params).subscribe({
      next: (pg: Page<OperacaoDTO>) => {
        this.total = pg.totalElements;
        this.filteredOps = pg.content.map(this.mapToCard);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Não foi possível carregar as operações.';
        this.loading = false;
      }
    });
  }

  private mapToCard = (o: OperacaoDTO): OperacaoCard => ({
    id: o.id,
    titulo: o.nomeOperacao || `Operação #${o.id}`,
    operadora: o.operadoraNome ?? `ID ${o.operadoraId}`,
    status: o.status ? 'Ativo' : 'Inativo',
  });

  // ======= Filtros & Paginação =======
  applyFilter(): void {
    this.page = 0;
    this.fetch();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filtroOperadora = '';
    this.filtroStatus = '';
    this.page = 0;
    this.fetch();
  }

  nextPage(): void {
    if ((this.page + 1) * this.size >= this.total) return;
    this.page++;
    this.fetch();
  }

  prevPage(): void {
    if (this.page === 0) return;
    this.page--;
    this.fetch();
  }

  trackById(_: number, it: OperacaoCard) { return it.id; }

  // ======= Modal: criar =======
  onAdd() {
    this.editingId = null;           // modo criar
    this.newOp = this.emptyNewOp();
    this.showAddModal = true;
  }

  closeAddModal() {
    if (this.saving) return;
    this.showAddModal = false;
    this.newOp = this.emptyNewOp();
    this.editingId = null;           // limpa modo edição
  }

  // Converte 'YYYY-MM-DDTHH:mm' do input para ISO local (sem Z) aceito pelo back (LocalDateTime)
  private toIsoLocal(dt?: string | null): string | undefined {
    if (!dt) return undefined;
    const d = new Date(dt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  // Converte ISO do back para valor de <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
  private toInputLocal(iso?: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  submitAdd(): void {
    if (!this.newOp.nomeOperacao || !this.newOp.operadoraId || !this.newOp.pocoCodigoAnp) return;

    this.saving = true;
    const payload: CreatePayload = {
      nomeOperacao: this.newOp.nomeOperacao.trim(),
      operadoraId: this.newOp.operadoraId,
      pocoCodigoAnp: this.newOp.pocoCodigoAnp,
      status: this.newOp.status,
      dataInicio: this.toIsoLocal(this.newOp.dataInicioLocal),
      dataFinal: this.toIsoLocal(this.newOp.dataFinalLocal),
    };

    this.svc.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeAddModal();
        this.page = 0;
        this.fetch();
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        alert('Erro ao salvar operação.');
      }
    });
  }

  // ======= Ações de linha =======
  onView(op: OperacaoCard) { /* navegar para detalhe */ }

  // EDITAR: carrega do back, preenche formulário e abre modal em modo edição
  onEdit(op: OperacaoCard) {
    this.saving = false;
    this.editingId = op.id;

    this.svc.getById(op.id).subscribe({
      next: (dto: OperacaoDTO) => {
        this.newOp = {
          nomeOperacao: dto.nomeOperacao ?? null,
          operadoraId: dto.operadoraId ?? null,
          pocoCodigoAnp: dto.pocoCodigoAnp ?? null,
          status: !!dto.status,
          dataInicioLocal: this.toInputLocal(dto.dataInicio ?? null),
          dataFinalLocal: this.toInputLocal(dto.dataFinal ?? null),
        };
        this.showAddModal = true;
      },
      error: (e) => {
        console.error('Falha ao carregar operação para edição', e);
        alert('Não foi possível carregar a operação.');
        this.editingId = null;
      }
    });
  }

  // Atualiza a operação atual via PATCH
  submitEdit(): void {
    if (this.editingId === null) return;
    if (!this.newOp.nomeOperacao || !this.newOp.operadoraId || !this.newOp.pocoCodigoAnp) return;

    this.saving = true;

    const payload: PatchPayload = {
      nomeOperacao: this.newOp.nomeOperacao.trim(),
      operadoraId: this.newOp.operadoraId,
      pocoCodigoAnp: this.newOp.pocoCodigoAnp,
      status: this.newOp.status,
      dataInicio: this.toIsoLocal(this.newOp.dataInicioLocal),
      dataFinal: this.toIsoLocal(this.newOp.dataFinalLocal),
    };

    this.svc.patch(this.editingId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeAddModal();
        this.fetch();
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        alert('Erro ao atualizar operação.');
      }
    });
  }

  onDelete(op: OperacaoCard) {
    if (!confirm(`Excluir a operação "${op.titulo}"?`)) return;
    this.svc.delete(op.id).subscribe({
      next: () => this.fetch(),
      error: (e) => {
        console.error(e);
        alert('Falha ao excluir operação.');
      }
    });
  }
}
