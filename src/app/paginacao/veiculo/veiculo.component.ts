import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import { VeiculoService, VeiculoDTO, StatusVeiculos, TipoVeiculo } from './veiculo.service';

@Component({
  selector: 'app-veiculo',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderComponent, MenuLateralComponent],
  templateUrl: './veiculo.component.html',
  styleUrls: ['./veiculo.component.css']
})
export class VeiculoComponent implements OnInit {

  private api = inject(VeiculoService);

  // estados
  carregando = false;
  salvando   = false;
  erro: string | null = null;

  // listagem e filtros
  todos: VeiculoDTO[] = [];
  filtroPlaca = '';
  filtroApelido = '';                        // <== NOVO FILTRO
  filtroStatus: StatusVeiculos | '' = '';
  filtroTipo:   TipoVeiculo   | '' = '';

  // controle do formulário
  mostrarForm = false;
  editando = false;
  placaEmEdicao: string | null = null; // guarda PK da linha em edição

  // form model
  novo: VeiculoDTO = {
    placa: '',
    apelido: '',                            
    status: 'ATIVO',
    tipoVeiculo: 'LEVE',
    anoVeiculo: undefined
  };

  statusOpts: StatusVeiculos[] = ['ATIVO', 'INATIVO', 'MANUTENCAO'];
  tipoOpts:   TipoVeiculo[]    = ['LEVE', 'PESADO', 'UNIDADE_CIMENTACAO', 'BATE_MIX', 'BULK', 'SONDA', 'OUTROS'];

  ngOnInit(): void { this.carregar(); }

  // lista filtrada (client-side)
  get filtrados(): VeiculoDTO[] {
    const placa = this.filtroPlaca.trim().toUpperCase();
    const apel  = this.filtroApelido.trim().toLowerCase();
    const st = this.filtroStatus;
    const tp = this.filtroTipo;

    return this.todos.filter(v => {
      const okPlaca   = !placa || v.placa?.toUpperCase().includes(placa);
      const okApelido = !apel  || (v.apelido ?? '').toLowerCase().includes(apel);
      const okStatus  = !st    || v.status === st;
      const okTipo    = !tp    || v.tipoVeiculo === tp;
      return okPlaca && okApelido && okStatus && okTipo;
    });
  }

  carregar(): void {
    this.carregando = true; this.erro = null;
    this.api.listar().subscribe({
      next: rows => {
        this.todos = rows.map(r => ({
          ...r,
          placa: r.placa?.toUpperCase(),
          apelido: (r.apelido ?? '').trim()
        }));
        this.carregando = false;
      },
      error: e => { this.erro = 'Falha ao carregar veículos.'; console.error(e); this.carregando = false; }
    });
  }

  limparFiltros(): void {
    this.filtroPlaca = '';
    this.filtroApelido = '';
    this.filtroStatus = '';
    this.filtroTipo = '';
  }

  /* ---------- Form: abrir/fechar ---------- */
  abrirFormCriar(): void {
    this.editando = false;
    this.placaEmEdicao = null;
    this.novo = { placa: '', apelido: '', status: 'ATIVO', tipoVeiculo: 'LEVE', anoVeiculo: undefined };
    this.mostrarForm = true;
  }

  abrirFormEditar(v: VeiculoDTO): void {
    this.editando = true;
    this.placaEmEdicao = v.placa;
    this.novo = {
      placa: v.placa,
      apelido: v.apelido ?? '',
      status: v.status,
      tipoVeiculo: v.tipoVeiculo,
      anoVeiculo: v.anoVeiculo
    };
    this.mostrarForm = true;
  }

  cancelarForm(form: NgForm): void {
    form.resetForm();
    this.mostrarForm = false;
    this.editando = false;
    this.placaEmEdicao = null;
  }

  /* ---------- Form: salvar (criar/editar) ---------- */
  salvar(form: NgForm): void {
    if (form.invalid) return;
    this.salvando = true; this.erro = null;

    const payload: VeiculoDTO = {
      placa: this.novo.placa.trim().toUpperCase(),
      apelido: this.novo.apelido.trim(),                 // <== ENVIAR SEMPRE (NotBlank no back)
      status: this.novo.status,
      tipoVeiculo: this.novo.tipoVeiculo,
      anoVeiculo: this.novo.anoVeiculo ?? null
    };

    if (!this.editando) {
      // criar
      this.api.criar(payload).subscribe({
        next: created => {
          this.todos = [{
            ...created,
            placa: created.placa.toUpperCase(),
            apelido: (created.apelido ?? '').trim()
          }, ...this.todos];
          this.salvando = false;
          this.mostrarForm = false;
          form.resetForm();
        },
        error: e => { this.erro = 'Não foi possível salvar. Verifique os campos.'; console.error(e); this.salvando = false; }
      });
    } else {
      // atualizar (usa placa original da linha)
      const placa = this.placaEmEdicao!;
      this.api.atualizar(placa, payload).subscribe({
        next: updated => {
          this.todos = this.todos.map(v => v.placa === placa ? {
            ...updated,
            placa: updated.placa.toUpperCase(),
            apelido: (updated.apelido ?? '').trim()
          } : v);
          this.salvando = false;
          this.mostrarForm = false;
          this.editando = false;
          this.placaEmEdicao = null;
          form.resetForm();
        },
        error: e => { this.erro = 'Não foi possível atualizar.'; console.error(e); this.salvando = false; }
      });
    }
  }

  excluir(placa: string): void {
    if (!confirm(`Excluir veículo ${placa}?`)) return;
    this.api.excluir(placa).subscribe({
      next: () => { this.todos = this.todos.filter(v => v.placa !== placa); },
      error: e => { this.erro = 'Falha ao excluir veículo.'; console.error(e); }
    });
  }

  trackByPlaca = (_: number, v: VeiculoDTO) => v.placa;
}
