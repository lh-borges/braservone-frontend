import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import {
  ReporteCampoServiceService,
  Reporte,
  StatusReporte,
  Setor
} from './reporte-campo-service.service';

@Component({
  selector: 'app-reporte-campo',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderComponent, MenuLateralComponent],
  templateUrl: './reporte-campo.component.html',
  styleUrls: ['./reporte-campo.component.css']
})
export class ReporteCampoComponent implements OnInit {
  private service = inject(ReporteCampoServiceService);
  private router  = inject(Router);

  // --- Estado Global (Signals) ---
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  reportes = signal<Reporte[]>([]);

  // --- Controles de Estado por Card (Sets) ---
  updating = new Set<number>();
  addingObs = new Set<number>();
  deleting = new Set<number>();

  // --- Opções para Selects e Loops ---
  statusOptions: StatusReporte[] = [
    'NOVO', 'EM_ANDAMENTO', 'NO_FINANCEIRO', 'NO_COMPRAS', 
    'ESPERANDO_ENVIO', 'NA_MANUTENCAO', 'FINALIZADO', 'CANCELADO'
  ];
  
  openStatusOptions: StatusReporte[] = [
    'NOVO', 'EM_ANDAMENTO', 'NO_FINANCEIRO', 'NO_COMPRAS', 
    'ESPERANDO_ENVIO', 'NA_MANUTENCAO'
  ];

  setorOptions: Setor[] = [
    'MECANICA', 'INTEGRIDADE', 'MANUFATURA', 'ELETRICA', 
    'TRANSPORTE', 'OPERACAO', 'SUPRIMENTO', 'OUTROS'
  ];

  // --- Filtros (Signals) ---
  filtroSetor  = signal<Setor | 'TODOS'>('TODOS');
  filtroStatus = signal<StatusReporte | 'TODOS'>('TODOS');

  // --- Helpers Lógicos Privados ---
  private isEncerrado = (s?: string) => s === 'FINALIZADO' || s === 'CANCELADO';

  // --- Computed Signals (Reatividade Automática) ---
  
  // Lista base de abertos
  abertos = computed(() =>
    [...this.reportes()]
      .filter(r => !this.isEncerrado(r.status))
      .sort((a, b) => (b.dataHoraReporte?.localeCompare(a.dataHoraReporte)))
  );

  // Lista base de encerrados
  encerrados = computed(() =>
    [...this.reportes()]
      .filter(r => this.isEncerrado(r.status))
      .sort((a, b) => (b.dataHoraReporte?.localeCompare(a.dataHoraReporte)))
  );

  // Lista de abertos com filtros aplicados
  abertosFiltrados = computed(() => {
    const base   = this.abertos();
    const setor  = this.filtroSetor();
    const status = this.filtroStatus();
    
    return base.filter(r => {
      const okSetor  = setor  === 'TODOS' ? true : r.setor === setor;
      const okStatus = status === 'TODOS' ? true : r.status === status;
      return okSetor && okStatus;
    });
  });

  ngOnInit(): void {
    this.load();
  }

  // --- Ações de Dados ---

  load(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.service.list().subscribe({
      next: (data) => {
        this.reportes.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message || 'Falha ao carregar reportes.');
      }
    });
  }

  clearFilters(): void {
    this.filtroSetor.set('TODOS');
    this.filtroStatus.set('TODOS');
  }

  onView(r: Reporte) {
    this.router.navigate(['reporte-campo-observacao', r.id]);
  }

  onStatusChange(r: Reporte, novo: string) {
    const value = novo as StatusReporte;
    if (!value || r.status === value) return;

    const anterior = r.status;
    this.updating.add(r.id);

    this.service.updateStatus(r.id, value).subscribe({
      next: (resp) => {
        // Atualiza apenas o item na lista local para evitar reload total
        r.status = resp.status; 
        this.reportes.update(lista => [...lista]); // Trigger na reatividade
        this.updating.delete(r.id);
      },
      error: (e) => {
        r.status = anterior; // Rollback visual
        this.updating.delete(r.id);
        this.errorMsg.set(e?.error?.message || 'Falha ao atualizar status.');
      }
    });
  }

  onDelete(r: Reporte) {
    const ok = confirm(`Deseja realmente excluir o reporte #${r.id}?`);
    if (!ok) return;

    this.deleting.add(r.id);

    this.service.remove(r.id).subscribe({
      next: () => {
        this.reportes.update(curr => curr.filter(rep => rep.id !== r.id));
        this.deleting.delete(r.id);
      },
      error: (e) => {
        this.errorMsg.set(e?.error?.message || 'Falha ao excluir reporte.');
        this.deleting.delete(r.id);
      }
    });
  }

  // --- Helpers Visuais (Soft UI) ---

  /** Retorna a classe CSS para a borda lateral colorida (Accent Border) */
  getStatusClass(status: string): string {
    switch (status) {
      case 'FINALIZADO':      return 'accent-success';
      case 'CANCELADO':       return 'accent-danger';
      case 'NOVO':
      case 'ESPERANDO_ENVIO': return 'accent-warning';
      default:                return 'accent-info'; // Azul para processos
    }
  }

  /** Retorna a classe CSS para o Badge Pastel */
  getBadgeClass(status: string): string {
    switch (status) {
      case 'FINALIZADO': return 'badge-soft-success';
      case 'CANCELADO':  return 'badge-soft-danger';
      case 'NOVO':       
      case 'ESPERANDO_ENVIO': return 'badge-soft-warning'; // Necessário criar css se não existir, ou usar secondary
      default:           return 'badge-soft-info';
    }
  }

  countObs(r: Reporte) { return r.observacoesCount ?? 0; }
  
  setorLabel(s: string) { 
    return s ? s.replaceAll('_', ' ') : ''; 
  }
}