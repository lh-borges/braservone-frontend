import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import {
  ReporteCampoObservacaoService,
  Reporte,
  Observacao,
  StatusReporte,
  Setor,
  UpdateReportePayload
} from './reporte-campo-observacao.service';

@Component({
  selector: 'app-reporte-campo-observacao',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderComponent, MenuLateralComponent],
  templateUrl: './reporte-campo-observacao.component.html',
  styleUrls: ['./reporte-campo-observacao.component.css']
})
export class ReporteCampoObservacaoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ReporteCampoObservacaoService);
  private loc   = inject(Location);

  loading  = signal<boolean>(false);
  saving   = signal<boolean>(false);
  addingObs = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  id!: number;
  reporte: Reporte | null = null;
  observacoes: Observacao[] = [];
  novaObs = '';

  statusOptions: StatusReporte[] = [
    'NOVO',
    'EM_ANDAMENTO',
    'NO_FINANCEIRO',
    'NO_COMPRAS',
    'ESPERANDO_ENVIO',
    'NA_MANUTENCAO',
    'FINALIZADO',
    'CANCELADO'
  ];

  // ajuste para seu enum real de Setor
  setorOptions: Setor[] = [
    'MECANICA',
    'INTEGRIDADE',
    'MANUFATURA',
    'ELETRICA',
    'TRANSPORTE',
    'OPERACAO',
    'OUTROS'
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      this.id = Number(pm.get('id'));
      this.loadAll();
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.svc.getReporte(this.id).subscribe({
      next: (rep) => {
        this.reporte = rep;
        this.svc.listObservacoes(this.id).subscribe({
          next: (obs) => {
            this.observacoes = obs ?? [];
            this.loading.set(false);
          },
          error: (e2) => {
            this.loading.set(false);
            this.errorMsg.set(e2?.error?.message || 'Falha ao carregar observações.');
          }
        });
      },
      error: (e) => {
        this.loading.set(false);
        this.errorMsg.set(e?.error?.message || 'Falha ao carregar o reporte.');
      }
    });
  }

  saveReporte(): void {
    if (!this.reporte) return;

    this.saving.set(true);
    const payload: UpdateReportePayload = {
      mensagem:  this.reporte.mensagem,
      matricula: this.reporte.matricula,
      setor:     this.reporte.setor,
      status:    this.reporte.status
    };

    this.svc.updateReporte(this.reporte.id, payload).subscribe({
      next: (rep) => {
        this.reporte = rep;
        this.saving.set(false);
      },
      error: (e) => {
        this.saving.set(false);
        this.errorMsg.set(e?.error?.message || 'Falha ao salvar alterações do reporte.');
      }
    });
  }

  addObs(): void {
    const msg = this.novaObs?.trim();
    if (!msg) return;

    this.addingObs.set(true);
    this.svc.createObservacao(this.id, msg).subscribe({
      next: (o) => {
        this.observacoes.unshift(o);
        this.novaObs = '';
        if (this.reporte) {
          this.reporte.observacoesCount = (this.reporte.observacoesCount ?? 0) + 1;
        }
        this.addingObs.set(false);
      },
      error: (e) => {
        this.addingObs.set(false);
        this.errorMsg.set(e?.error?.message || 'Falha ao adicionar observação.');
      }
    });
  }

  removeObs(o: Observacao): void {
    if (!confirm(`Remover a observação #${o.id}?`)) return;

    this.svc.deleteObservacao(this.id, o.id).subscribe({
      next: () => {
        this.observacoes = this.observacoes.filter(x => x.id !== o.id);
        if (this.reporte && (this.reporte.observacoesCount ?? 0) > 0) {
          this.reporte.observacoesCount = (this.reporte.observacoesCount ?? 0) - 1;
        }
      },
      error: (e) => {
        this.errorMsg.set(e?.error?.message || 'Falha ao remover observação.');
      }
    });
  }

  goBack(): void { this.loc.back(); }
  setorLabel(s: string) { return s?.replaceAll('_', ' '); }
}
