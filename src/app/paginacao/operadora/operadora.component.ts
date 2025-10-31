// src/app/operadora/operadora.component.ts
import { Component, OnInit } from '@angular/core';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';
import { HeaderComponent } from '../utilities/header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { OperadoraService } from './operadora.service';

interface Operadora {
  id: number;                 // sempre number aqui
  nome: string;
  emailContato: string;
  telefoneContato: string;
  cidade: string;
  ativo: boolean;
}

interface Endereco {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

interface OperadoraForm {
  id?: number;                // pode ser undefined no modo "novo"
  nome: string;
  siglas: string;
  pais: string;
  endereco: Endereco;
  emailContato: string;
  telefoneContato: string;
  responsaveltecnico: string;
  ativo: boolean;
}

@Component({
  selector: 'app-operadora',
  templateUrl: './operadora.component.html',
  styleUrls: ['./operadora.component.css'],
  imports: [MenuLateralComponent, HeaderComponent, CommonModule, FormsModule],
  standalone: true
})
export class OperadoraComponent implements OnInit {

  // 🔹 Listas
  operadoras: Operadora[] = [];
  filtradas: Operadora[] = [];

  // 🔹 Filtros
  termoBusca = '';
  filtroStatus: 'todas' | 'ativas' | 'inativas' = 'todas';

  // 🔹 Controle modal
  showModal = false;
  editMode = false;
  saving = false;
  formLoading = false;
  alertSuccess = false;
  errorMsg = '';

  // 🔹 Formulário
  form: OperadoraForm = this.novoForm();

  // 🔹 Auxiliares
  deletando = new Set<number>();

  constructor(private operadoraService: OperadoraService) {}

  ngOnInit(): void {
    this.fetchFromApi();
  }

  private novoForm(): OperadoraForm {
    return {
      nome: '',
      siglas: '',
      pais: '',
      endereco: {
        logradouro: null,
        numero: null,
        bairro: null,
        cidade: null,
        estado: null,
        cep: null
      },
      emailContato: '',
      telefoneContato: '',
      responsaveltecnico: '',
      ativo: true
    };
  }

  trackByOperadoraId = (_: number, op: Operadora) => op.id; // já é number

  // 🔍 Filtro local
  aplicarFiltro(): void {
    const termo = this.termoBusca.trim().toLowerCase();
    this.filtradas = this.operadoras.filter(op => {
      const nomeMatch = op.nome.toLowerCase().includes(termo);
      const statusMatch =
        this.filtroStatus === 'todas' ||
        (this.filtroStatus === 'ativas' && op.ativo) ||
        (this.filtroStatus === 'inativas' && !op.ativo);
      return nomeMatch && statusMatch;
    });
  }

  // 🔁 Busca dados do backend
  fetchFromApi(): void {
    this.operadoraService.getAllOperadoras().subscribe({
      next: (list: any[]) => {
        this.operadoras = (list || []).map((o) => ({
          id: Number(o?.id) || 0,                     // ✅ garante number
          nome: o?.nome ?? '',
          emailContato: o?.emailContato ?? '',
          telefoneContato: o?.telefoneContato ?? '',
          cidade: o?.endereco?.cidade ?? '',
          ativo: typeof o?.ativo === 'boolean' ? o.ativo : true,
        }));
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Erro ao buscar operadoras:', err);
        this.errorMsg = 'Falha ao carregar operadoras.';
        this.operadoras = [];
        this.filtradas = [];
      }
    });
  }

  // 🧭 Controle de Modal
  openModalNovo(): void {
    this.editMode = false;
    this.form = this.novoForm();
    this.errorMsg = '';
    this.showModal = true;
  }

  openModalEditar(id: number): void {
    if (!Number.isFinite(id)) return;              // ✅ evita undefined/NaN
    this.editMode = true;
    this.errorMsg = '';
    this.showModal = true;
    this.formLoading = true;

    this.operadoraService.getOperadoraById(id).subscribe({
      next: (dto: any) => {
        const end = dto?.endereco ?? {};
        this.form = {
          id: Number(dto?.id),                      // ✅ id definido
          nome: dto?.nome ?? '',
          siglas: dto?.siglas ?? '',
          pais: dto?.pais ?? '',
          endereco: {
            logradouro: end.logradouro ?? null,
            numero: end.numero ?? null,
            bairro: end.bairro ?? null,
            cidade: end.cidade ?? null,
            estado: end.estado ?? null,
            cep: end.cep ?? null,
          },
          emailContato: dto?.emailContato ?? '',
          telefoneContato: dto?.telefoneContato ?? '',
          responsaveltecnico: dto?.responsaveltecnico ?? '',
          ativo: typeof dto?.ativo === 'boolean' ? dto.ativo : true
        };
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Falha ao carregar operadora.';
        this.editMode = false;
      },
      complete: () => (this.formLoading = false)
    });
  }

  closeModal(): void {
    if (this.saving || this.formLoading) return;
    this.showModal = false;
    this.errorMsg = '';
  }

  // 💾 Criar
  salvarOperadora(opForm: NgForm): void {
    this.errorMsg = '';
    if (!this.form.nome?.trim()) {
      opForm.control.markAllAsTouched();
      return;
    }
    if (this.form.emailContato && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailContato)) {
      this.errorMsg = 'E-mail inválido.';
      return;
    }

    this.saving = true;

    const payload = {
      nome: this.form.nome,
      siglas: this.form.siglas || null,
      pais: this.form.pais || null,
      endereco: this.form.endereco,
      emailContato: this.form.emailContato || null,
      telefoneContato: this.form.telefoneContato || null,
      responsaveltecnico: this.form.responsaveltecnico || null,
      ativo: this.form.ativo
    };

    this.operadoraService.createOperadora(payload as any).subscribe({
      next: (saved: any) => {
        // sempre number
        const novoId = Number(saved?.id) || (Math.max(0, ...this.operadoras.map(o => o.id)) + 1);
        const novo: Operadora = {
          id: novoId,                                // ✅ number
          nome: payload.nome,
          emailContato: payload.emailContato ?? '',
          telefoneContato: payload.telefoneContato ?? '',
          cidade: payload.endereco?.cidade ?? '',
          ativo: payload.ativo
        };
        this.operadoras.unshift(novo);
        this.aplicarFiltro();
        this.saving = false;
        this.showModal = false;
        this.disparaAlertaSucesso();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.message || 'Falha ao salvar operadora.';
      }
    });
  }

  // ✏️ Atualizar
  atualizarOperadora(opForm: NgForm): void {
    this.errorMsg = '';
    if (!this.form.id || !this.form.nome?.trim()) {
      opForm.control.markAllAsTouched();
      if (!this.form.id) this.errorMsg = 'ID inválido para edição.';
      return;
    }
    if (this.form.emailContato && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.emailContato)) {
      this.errorMsg = 'E-mail inválido.';
      return;
    }

    this.saving = true;

    const payload = {
      id: this.form.id!,                            // ✅ garantido acima
      nome: this.form.nome,
      siglas: this.form.siglas || null,
      pais: this.form.pais || null,
      endereco: this.form.endereco,
      emailContato: this.form.emailContato || null,
      telefoneContato: this.form.telefoneContato || null,
      responsaveltecnico: this.form.responsaveltecnico || null,
      ativo: this.form.ativo
    };

    this.operadoraService.updateOperadora(this.form.id!, payload as any).subscribe({
      next: (updated: any) => {
        const idx = this.operadoras.findIndex(o => o.id === this.form.id!);
        if (idx >= 0) {
          this.operadoras[idx] = {
            id: this.form.id!,                       // ✅ number
            nome: payload.nome,
            emailContato: payload.emailContato ?? '',
            telefoneContato: payload.telefoneContato ?? '',
            cidade: payload.endereco?.cidade ?? '',
            ativo: payload.ativo
          };
        }
        this.aplicarFiltro();
        this.saving = false;
        this.showModal = false;
        this.disparaAlertaSucesso();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.message || 'Falha ao atualizar operadora.';
      }
    });
  }

  // 🗑️ Excluir
  confirmarExclusao(op: Operadora): void {
    if (!Number.isFinite(op?.id)) return;
    if (confirm(`Confirma excluir a operadora "${op.nome}"? Essa ação não poderá ser desfeita.`)) {
      this.excluirOperadora(op.id);
    }
  }

  private excluirOperadora(id: number): void {
    this.deletando.add(id);
    this.operadoraService.deleteOperadora(id).subscribe({
      next: () => {
        this.operadoras = this.operadoras.filter(o => o.id !== id);
        this.aplicarFiltro();
        this.alertSuccess = true;
        setTimeout(() => (this.alertSuccess = false), 2500);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Falha ao excluir operadora.';
      },
      complete: () => {
        this.deletando.delete(id);
      }
    });
  }

  // ✅ Alerta de sucesso
  private disparaAlertaSucesso(): void {
    this.alertSuccess = true;
    setTimeout(() => (this.alertSuccess = false), 2500);
  }
}
