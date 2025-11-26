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

  // estado global
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  reportes = signal<Reporte[]>([]);

  // controles por-card
  updating = new Set<number>();
  addingObs = new Set<number>();
  deleting = new Set<number>(); // 👈 novo controle para exclusão

  // opções
  statusOptions: StatusReporte[] = [
    'NOVO','EM_ANDAMENTO','NO_FINANCEIRO','NO_COMPRAS','ESPERANDO_ENVIO','NA_MANUTENCAO','FINALIZADO','CANCELADO'
  ];
  openStatusOptions: StatusReporte[] = [
    'NOVO','EM_ANDAMENTO','NO_FINANCEIRO','NO_COMPRAS','ESPERANDO_ENVIO','NA_MANUTENCAO'
  ];
  setorOptions: Setor[] = [
    'MECANICA',
    'INTEGRIDADE',
    'MANUFATURA',
    'ELETRICA',
    'TRANSPORTE',
    'OPERACAO',
    'SUPRIMENTO',
    'OUTROS'
  ];

  // filtros da sessão "Em andamento" — agora como signals
  filtroSetor   = signal<Setor | 'TODOS'>('TODOS');
  filtroStatus  = signal<StatusReporte | 'TODOS'>('TODOS');

  // helpers
  private isEncerrado = (s?: string) => s === 'FINALIZADO' || s === 'CANCELADO';

  // sessões base
  abertos = computed(() =>
    [...this.reportes()]
      .filter(r => !this.isEncerrado(r.status))
      .sort((a, b) => (b.dataHoraReporte?.localeCompare(a.dataHoraReporte)))
  );

  encerrados = computed(() =>
    [...this.reportes()]
      .filter(r => this.isEncerrado(r.status))
      .sort((a, b) => (b.dataHoraReporte?.localeCompare(a.dataHoraReporte)))
  );

  // aplicação de filtros (reage aos signals)
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

  // ações da UI
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
        r.status = resp.status;
        this.reportes.set([...this.reportes()]);
        this.updating.delete(r.id);
      },
      error: (e) => {
        r.status = anterior;
        this.updating.delete(r.id);
        this.errorMsg.set(e?.error?.message || 'Falha ao atualizar status.');
      }
    });
  }

  onAddObs(r: Reporte) {
    const mensagem = prompt('Digite a observação:');
    if (!mensagem || !mensagem.trim()) return;

    this.addingObs.add(r.id);
    // se tiver ObservacaoService, chame-o aqui.
    setTimeout(() => {
      this.addingObs.delete(r.id);
      r.observacoesCount = (r.observacoesCount ?? 0) + 1;
      this.reportes.set([...this.reportes()]);
    }, 300);
  }

  onDelete(r: Reporte) {
    const ok = confirm(`Deseja realmente excluir o reporte #${r.id}?`);
    if (!ok) return;

    this.deleting.add(r.id);

    this.service.remove(r.id).subscribe({
      next: () => {
        const atual = this.reportes();
        this.reportes.set(atual.filter(rep => rep.id !== r.id));
        this.deleting.delete(r.id);
      },
      error: (e) => {
        this.errorMsg.set(e?.error?.message || 'Falha ao excluir reporte.');
        this.deleting.delete(r.id);
      }
    });
  }

  // helpers
  countObs(r: Reporte) { return r.observacoesCount ?? 0; }
  setorLabel(s: string) { return s?.replaceAll('_', ' '); }
}
