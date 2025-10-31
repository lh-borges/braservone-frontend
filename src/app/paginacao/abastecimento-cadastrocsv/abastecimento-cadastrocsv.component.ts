import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AbastecimentoService,
  AbastecimentoCreateDTO
} from '../abastecimento/abastecimento.service'; // ajuste o path se necessário
import { firstValueFrom } from 'rxjs';

type RowStatus = 'ok' | 'erro' | undefined;

interface CsvRowPreview {
  placa: string;
  distRodadaKm: number | null;
  volumeLitros: number | null;
  valorTotal: number | null;
  valorPorLitro: number | null;
  mediaKmPorL: number | null;
  mediaRsPorKm: number | null;
  dataStr: string;        // para exibição
  dataIso: string | null; // 'yyyy-MM-ddTHH:mm:ss' (sem timezone)
  status?: RowStatus;
  msgErro?: string;
}

@Component({
  selector: 'app-abastecimento-cadastrocsv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abastecimento-cadastrocsv.component.html',
  styleUrls: ['./abastecimento-cadastrocsv.component.css']
})
export class AbastecimentoCadastroCsvComponent {
  private svc = inject(AbastecimentoService);

  // state
  csvText = '';
  rows: CsvRowPreview[] = [];
  importing = false;
  totalDone = 0;
  errorMsg: string | null = null;
  infoMsg: string | null = null;

  // computed
  get progressPercent(): number {
    if (!this.rows.length) return 0;
    return Math.round((this.totalDone / this.rows.length) * 100);
  }

  // ===== UI actions =====

  exemplo() {
    this.csvText =
`Placa;Dist. Rodada;Volume total;Valor;Valor por Litro;Media KM/L;Media R$/Km;Data Abastecimento
SKS9J06;413;42,6;284,99;6,69;9,694835681;0,690048426;02/09/2025
SKQ 4E28;88;35,85;239,16;6,671;2,454672245;2,717727273;03/09/2025
SKS 2B80;447;34,21;222,02;6,49;13,06635487;0,496689038;45901,62141`;
  }

  limpar() {
    this.csvText = '';
    this.rows = [];
    this.errorMsg = null;
    this.infoMsg = null;
    this.totalDone = 0;
  }

  parse() {
    this.errorMsg = null;
    this.infoMsg = null;
    try {
      this.rows = this.parseCsvToRows(this.csvText);
      if (!this.rows.length) {
        this.infoMsg = 'Nenhuma linha válida encontrada.';
      }
    } catch (e: any) {
      this.errorMsg = e?.message || 'Erro ao processar CSV.';
      this.rows = [];
    }
  }

  async importar() {
    if (!this.rows.length) return;
    this.errorMsg = null;
    this.infoMsg = null;
    this.importing = true;
    this.totalDone = 0;

    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      try {
        // validações mínimas de front (o back também valida)
        if (!r.placa) throw new Error('Placa vazia.');
        if (r.volumeLitros == null) throw new Error('Volume total (L) é obrigatório.');
        if (r.valorTotal == null && r.valorPorLitro == null) {
          throw new Error('Informe Valor ou Valor por Litro.');
        }
        if (!r.dataIso) throw new Error('Data inválida.');

        const placa = r.placa.toUpperCase().trim();

        // verifica veículo
        const existe = await firstValueFrom(this.svc.verificarVeiculo(placa));
        if (!existe) throw new Error('Veículo não encontrado.');

        const payload: AbastecimentoCreateDTO = {
          placaVeiculo: placa,
          distRodadaKm: this.round2(r.distRodadaKm) ?? 0,
          volumeLitros: this.round2(r.volumeLitros)!,
          valorTotal:   this.round2(r.valorTotal),
          valorPorLitro:this.round2(r.valorPorLitro),
          mediaKmPorL:  this.round2(r.mediaKmPorL),
          mediaRsPorKm: this.round2(r.mediaRsPorKm),
          dataAbastecimento: r.dataIso! // 'yyyy-MM-ddTHH:mm:ss'
        };

        await firstValueFrom(this.svc.criar(payload));
        r.status = 'ok';
        r.msgErro = undefined;
      } catch (err: any) {
        r.status = 'erro';
        r.msgErro = err?.error?.message || err?.message || 'Falha ao cadastrar.';
      } finally {
        this.totalDone++;
      }
    }

    const ok = this.rows.filter(x => x.status === 'ok').length;
    const fail = this.rows.length - ok;
    this.infoMsg = `Processo concluído. Sucesso: ${ok}. Falhas: ${fail}.`;
    this.importing = false;
  }

  // ===== Parsing helpers =====

  private parseCsvToRows(text: string): CsvRowPreview[] {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (!lines.length) return [];

    // detecta header na 1ª linha
    const headerLike = /^placa\s*;|^placa;/i.test(lines[0]);
    const start = headerLike ? 1 : 0;

    const rows: CsvRowPreview[] = [];
    for (let i = start; i < lines.length; i++) {
      const raw = lines[i];
      const cols = raw.split(';').map(c => c.trim());

      // completa colunas faltantes até 8
      while (cols.length < 8) cols.push('');

      const [
        placaRaw,
        distRaw,
        volRaw,
        valorRaw,
        vplRaw,
        mediaKmRaw,
        mediaRsRaw,
        dataRaw
      ] = cols;

      const placa = this.normalizePlate(placaRaw);
      const distRodadaKm = this.toNumberBR(distRaw);
      const volumeLitros = this.toNumberBR(volRaw);
      const valorTotal   = this.toNumberBR(valorRaw);
      const valorPorLitro= this.toNumberBR(vplRaw);
      const mediaKmPorL  = this.toNumberBR(mediaKmRaw);
      const mediaRsPorKm = this.toNumberBR(mediaRsRaw);

      const { iso, display } = this.parseDateSmart(dataRaw);

      rows.push({
        placa,
        distRodadaKm: this.round2(distRodadaKm),
        volumeLitros: this.round2(volumeLitros),
        valorTotal:   this.round2(valorTotal),
        valorPorLitro:this.round2(valorPorLitro),
        mediaKmPorL:  this.round2(mediaKmPorL),
        mediaRsPorKm: this.round2(mediaRsPorKm),
        dataStr: display,
        dataIso: iso
      });
    }
    return rows;
  }

  /**
   * Normaliza placa:
   * - remove acentos
   * - remove tudo que não for [A-Z0-9]
   * - transforma em MAIÚSCULO
   * Ex.: "SKQ 4E-28" -> "SKQ4E28"
   */
  private normalizePlate(p: string): string {
    if (!p) return '';
    // remove acentos
    const noAccents = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // remove não-alfanuméricos (inclui espaços e pontuação)
    const onlyAZ09 = noAccents.replace(/[^a-zA-Z0-9]/g, '');
    return onlyAZ09.toUpperCase();
  }

  /** Arredonda para no máximo 2 casas (Number, não string). Null permanece null. */
  private round2(n: number | null): number | null {
    if (n == null || !Number.isFinite(n)) return n;
    return Math.round(n * 100) / 100;
  }

  /** Converte número BR (vírgula decimal). Vazio -> null. Limita a 2 casas. */
  private toNumberBR(s: string): number | null {
    if (s == null) return null;
    let t = s.replace(/\s+/g, '');
    if (t === '') return null;

    // normaliza vírgula para ponto
    t = t.replace(',', '.');

    // corta para no máximo 2 casas na própria string
    const m = /^(-?\d+)(?:\.(\d+))?$/.exec(t);
    if (!m) return null;

    const int = m[1];
    const dec = (m[2] ?? '').slice(0, 2); // no máximo 2 dígitos
    const normalized = dec ? `${int}.${dec}` : int;

    const n = Number(normalized);
    return Number.isFinite(n) ? this.round2(n) : null;
  }

  /** Converte dd/MM/yyyy ou serial Excel (ex.: 45901,62141) para ISO local 'yyyy-MM-ddTHH:mm:ss' */
  private parseDateSmart(s: string): { iso: string | null; display: string } {
    const trimmed = (s || '').trim();
    if (trimmed === '') return { iso: null, display: '' };

    // dd/MM/yyyy
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (m) {
      const [_, dd, MM, yyyy] = m;
      const iso = `${yyyy}-${MM}-${dd}T00:00:00`;
      return { iso, display: `${dd}/${MM}/${yyyy}` };
    }

    // serial Excel (com vírgula/ponto)
    const maybeNum = trimmed.replace(',', '.');
    const num = Number(maybeNum);
    if (Number.isFinite(num) && num > 20000) {
      // Excel epoch: 1899-12-30
      const excelEpoch = Date.UTC(1899, 11, 30);
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.floor(num);
      const frac = num - days;
      const ms = excelEpoch + days * msPerDay + Math.round(frac * msPerDay);

      const d = new Date(ms);
      const yyyy = d.getUTCFullYear();
      const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mi = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');

      const iso = `${yyyy}-${MM}-${dd}T${hh}:${mi}:${ss}`;
      const display = `${dd}/${MM}/${yyyy}${(hh+mi+ss) !== '000000' ? ` ${hh}:${mi}` : ''}`;
      return { iso, display };
    }

    // fallback
    return { iso: null, display: trimmed };
  }
}
