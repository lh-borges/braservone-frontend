// src/app/paginacao/fornecedor/fornecedor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FornecedorService, Fornecedor, FornecedorCreate } from './fornecedor.service';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-fornecedor',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, MenuLateralComponent],
  templateUrl: './fornecedor.component.html'
})
export class FornecedorComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  salvando = false;
  deletandoId: number | null = null;
  sucessoMsg = '';
  erroMsg = '';
  busca = '';

  // único valor do enum atual
  readonly TIPOS: Array<Fornecedor['tipo']> = ['QUIMICOS'];

  formModel: FornecedorCreate = {
    nome: '',
    tipo: 'QUIMICOS'
  };

  constructor(private svc: FornecedorService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.sucessoMsg = '';
    this.erroMsg = '';
    this.svc.listar(this.busca).subscribe({
      next: (res) => (this.fornecedores = res),
      error: () => (this.erroMsg = 'Falha ao carregar fornecedores.')
    });
  }

  salvar(f: NgForm): void {
    if (f.invalid || this.salvando) return;
    this.sucessoMsg = '';
    this.erroMsg = '';
    this.salvando = true;

    const payload: FornecedorCreate = {
      nome: this.formModel.nome.trim(),
      tipo: this.formModel.tipo
    };

    this.svc.criar(payload).subscribe({
      next: (novo) => {
        this.fornecedores = [novo, ...this.fornecedores];
        this.sucessoMsg = 'Fornecedor salvo com sucesso.';
        f.resetForm({ nome: '', tipo: 'QUIMICOS' });
      },
      error: () => (this.erroMsg = 'Não foi possível salvar.'),
      complete: () => (this.salvando = false)
    });
  }

  deletar(item: Fornecedor): void {
    if (this.deletandoId || !confirm(`Excluir "${item.nome}" (ID ${item.id})?`)) return;
    this.sucessoMsg = '';
    this.erroMsg = '';
    this.deletandoId = item.id;

    this.svc.remover(item.id).subscribe({
      next: () => {
        this.fornecedores = this.fornecedores.filter(f => f.id !== item.id);
        this.sucessoMsg = 'Fornecedor excluído.';
      },
      error: () => (this.erroMsg = 'Falha ao excluir.'),
      complete: () => (this.deletandoId = null)
    });
  }

  trackById(_: number, it: Fornecedor) {
    return it.id;
  }
}
