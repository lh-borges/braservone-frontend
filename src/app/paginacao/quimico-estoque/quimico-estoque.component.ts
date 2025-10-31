// src/app/quimico-estoque/quimico-estoque.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import {
  QuimicoService,
  QuimicoDTO
} from '../quimicos/quimico.service';

// tipo que vem do back na rota /api/quimicos/estoque-agrupado
interface EstoqueAgrupadoDTO {
  tipoQuimico: string;
  estadoLocalArmazenamento: string | null;
  estoqueTotal: number;
}

// 🔒 força os níveis possíveis
type NivelEstoque = 'CRITICO' | 'ALERTA';

// model do card de “estoque baixo”
interface QuimicoBaixo {
  nivel: NivelEstoque;
  item: QuimicoDTO;
}

@Component({
  selector: 'app-quimico-estoque',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './quimico-estoque.component.html',
  styleUrls: ['./quimico-estoque.component.css']
})
export class QuimicoEstoqueComponent implements OnInit {

  private quimicoService = inject(QuimicoService);
  private toastr = inject(ToastrService);

  carregando = false;

  // lista vinda do /api/quimicos
  quimicos: QuimicoDTO[] = [];

  // lista vinda do /api/quimicos/estoque-agrupado
  estoqueAgrupado: EstoqueAgrupadoDTO[] = [];

  ngOnInit(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.carregando = true;

    // pega os químicos
    this.quimicoService.listar().subscribe({
      next: lista => {
        this.quimicos = lista ?? [];
        this.carregando = false;
      },
      error: err => {
        this.carregando = false;
        this.toastr.error('Falha ao carregar químicos.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });

    // pega o agrupado (tipo + estado)
    this.quimicoService.listarEstoqueAgrupado().subscribe({
      next: lista => {
        this.estoqueAgrupado = lista ?? [];
      },
      error: err => {
        this.toastr.error('Falha ao carregar estoque agrupado.', 'Erro', { positionClass: 'toast-bottom-center' });
        console.error(err);
      }
    });
  }

  // ==================== DERIVADOS ====================

  /**
   * Químicos que estão com estoque baixo (baseado no campo estoqueInicial que já veio do /api/quimicos)
   * < 20  -> CRITICO
   * < 40  -> ALERTA
   */
  get quimicosBaixoEstoque(): QuimicoBaixo[] {
    return (this.quimicos ?? [])
      .filter(q => q.estoqueInicial != null)
      .filter(q => Number(q.estoqueInicial) < 40)
      .map<QuimicoBaixo>(q => ({
        nivel: Number(q.estoqueInicial) < 20 ? 'CRITICO' : 'ALERTA',
        item: q
      }))
      // ordena: primeiro os críticos, depois por menor estoque
      .sort((a, b) => {
        if (a.nivel !== b.nivel) {
          return a.nivel === 'CRITICO' ? -1 : 1;
        }
        return Number(a.item.estoqueInicial ?? 0) - Number(b.item.estoqueInicial ?? 0);
      });
  }

  /** helper só pra colocar corzinha no badge */
  getBadgeClass(nivel: NivelEstoque): string {
    return nivel === 'CRITICO'
      ? 'bg-danger-subtle text-danger border border-danger'
      : 'bg-warning-subtle text-warning border border-warning';
  }

  /** deixar bonitinho na listagem */
  formatEstado(estado: string | null): string {
    return estado && estado.trim().length > 0 ? estado : '—';
  }
}
