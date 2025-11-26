import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';

// Ajuste os imports abaixo conforme o caminho real dos seus componentes de layout


// Serviços
import { QuimicoService, QuimicoDTO } from '../quimicos/quimico.service';
import { ReporteCampoServiceService, Reporte } from '../reporte-campo/reporte-campo-service.service';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

type NivelEstoque = 'CRITICO' | 'ALERTA';

interface QuimicoBaixo {
  nivel: NivelEstoque;
  estoqueAtual: number;
  item: QuimicoDTO;
}

type NivelVencimento = 'CRITICO' | 'ALERTA';

interface QuimicoVencimento {
  nivel: NivelVencimento;
  diasRestantes: number;
  item: QuimicoDTO;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    HeaderComponent,      // <app-header>
    MenuLateralComponent  // <app-menu-lateral>
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private quimicoService = inject(QuimicoService);
  private reporteService = inject(ReporteCampoServiceService);

  carregando = false;
  
  quimicos: QuimicoDTO[] = [];
  reportesNovos: Reporte[] = [];

  private nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 6 });

  ngOnInit(): void {
    this.carregarDashboard();
  }

  private carregarDashboard(): void {
    this.carregando = true;

    forkJoin({
      quimicos: this.quimicoService.listar(),
      // Busca apenas reportes com status NOVO
      reportes: this.reporteService.list({ status: 'NOVO' }) 
    }).subscribe({
      next: ({ quimicos, reportes }) => {
        this.quimicos = Array.isArray(quimicos) ? quimicos : [];
        this.reportesNovos = Array.isArray(reportes) ? reportes : [];
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard', err);
        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }

  // ==========================================
  // LÓGICA DE QUÍMICOS
  // ==========================================

  private isAtivoStrict(q: QuimicoDTO): boolean {
    const flags = [(q as any).ativo, (q as any).isAtivo, (q as any).habilitado].filter(v => v != null);
    if (flags.length) return !!flags.find(v => v === true);
    
    const s = ((q as any).statusQuimicos ?? (q as any).status ?? '').toString().trim().toUpperCase();
    return s === 'ATIVO' || s === 'ATIVA';
  }

  get quimicosAtivos(): QuimicoDTO[] {
    return this.quimicos.filter(q => this.isAtivoStrict(q));
  }

  private toNum(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') return Number(v.replace(',', '.')) || 0;
    return 0;
  }

  private qtdDoQuimico(q: QuimicoDTO): number {
    const estoqueAtualLike = (q as any).estoqueAtual ?? (q as any).qntEstoque ?? (q as any).saldoAtual;
    if (estoqueAtualLike != null) return this.toNum(estoqueAtualLike);
    
    return this.toNum((q as any).estoqueInicial) - this.toNum((q as any).estoqueUtilizado);
  }

  private daysUntilSafe(val: any): number {
    if (!val) return Number.POSITIVE_INFINITY;
    let d: Date | null = null;
    
    if (typeof val === 'string') {
      const s = val.length >= 10 ? `${val.substring(0, 10)}T00:00:00Z` : val;
      d = new Date(s);
    } else if (val instanceof Date) {
      d = val;
    }
    
    if (!d || isNaN(d.getTime())) return Number.POSITIVE_INFINITY;

    const today = new Date();
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const targetUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Math.round((targetUTC - todayUTC) / 86400000);
  }

  get quimicosBaixoEstoque(): QuimicoBaixo[] {
    return this.quimicosAtivos
      .map(q => {
        const qtd = this.qtdDoQuimico(q);
        const nivel: NivelEstoque | null = qtd < 20 ? 'CRITICO' : (qtd < 40 ? 'ALERTA' : null);
        return nivel ? { nivel, estoqueAtual: qtd, item: q } as QuimicoBaixo : null;
      })
      .filter((x): x is QuimicoBaixo => !!x)
      .sort((a, b) => (a.nivel === 'CRITICO' ? -1 : 1));
  }

  get quimicosVencimento(): QuimicoVencimento[] {
    return this.quimicosAtivos
      .filter(q => !!(q as any).dataValidade)
      .map(q => {
        const dias = this.daysUntilSafe((q as any).dataValidade);
        const nivel: NivelVencimento = dias <= 30 ? 'CRITICO' : 'ALERTA';
        return { item: q, diasRestantes: dias, nivel };
      })
      .filter(x => x.diasRestantes <= 60)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  // ==========================================
  // HELPERS DE UI (Safe Accessors)
  // ==========================================
  
  nomeOf(q: QuimicoDTO): string {
    return ((q as any).nome?.toString()?.trim()) || (q as any).descricao || 'Químico';
  }

  // Novo Helper: Substitui o pipe | any
  tipoOf(q: QuimicoDTO): string {
    return (q as any).tipoQuimico || (q as any).tipo || '—';
  }

  // Novo Helper: Substitui o pipe | any
  loteOf(q: QuimicoDTO): string {
    return (q as any).lote || '—';
  }

  dateYMD(val: any): string {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toISOString().substring(0, 10);
  }

  fmt(n: number): string {
    return this.nf.format(n);
  }

  labelDias(dias: number): string {
    if (dias < 0) return `Vencido (${Math.abs(dias)}d)`;
    if (dias === 0) return 'Vence hoje';
    return `${dias} dias`;
  }

  formatDateReporte(dateStr: string | undefined): string {
    if(!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  }
}