import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ReporteService, Setor } from './reporte.service';
import { VeiculoService, VeiculoDTO } from '../veiculo/veiculo.service'; // ajuste o path

@Component({
  selector: 'app-reporter-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './reporter-operador.component.html',
  styleUrls: ['./reporter-operador.component.css']
})
export class ReporterOperadorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ReporteService);
  private veiculoService = inject(VeiculoService);

  setores: Setor[] = [
  'MECANICA',
  'INTEGRIDADE',
  'MANUFATURA',
  'ELETRICA',
  'TRANSPORTE',
  'OPERACAO',
  'SUPRIMENTO',
  'OUTROS'
];
  veiculos: VeiculoDTO[] = [];

  form = this.fb.group({
    mensagem: ['', [Validators.required, Validators.minLength(3)]],
    matricula: ['', [Validators.required, Validators.minLength(3)]],
    setor: ['', [Validators.required]],
    veiculoPlaca: ['', [Validators.required]] // usuário escolhe no select
  });

  carregando = false;
  erroMsg = '';
  showModal = false;

  ngOnInit(): void {
    this.veiculoService.listar().subscribe({
      next: (lista) => {
        this.veiculos = lista || [];
      },
      error: () => {
        this.veiculos = [];
        // se der erro pra carregar veículos, pode relaxar a validação:
        this.form.get('veiculoPlaca')?.clearValidators();
        this.form.get('veiculoPlaca')?.updateValueAndValidity();
      }
    });
  }

  submit() {
    this.erroMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;

    this.service.create(this.form.value as any).subscribe({
      next: () => {
        this.carregando = false;
        this.form.reset();
        this.showModal = true;
      },
      error: (err) => {
        this.carregando = false;
        this.erroMsg = err?.error?.message || 'Falha ao enviar o reporte.';
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  get f() { return this.form.controls; }
}
