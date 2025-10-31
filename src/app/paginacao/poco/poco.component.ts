import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

import { PocoService, PageResponse } from './poco.service';
import { catchError, finalize, of, from, mergeMap, toArray, map } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { Poco } from '../../model/poco';
import { PocoDTO } from '../../dto/poco-dto';

type PocoView = PocoDTO & {
  nomeCampo?: string;
  local?: string;
  latitude?: number | null;
  longitude?: number | null;
};

interface PocoForm {
  codigoAnp: string;
  nomeCampo?: string;
  bacia?: string;
  status?: string;
  fluido?: string;
  local?: string;
  latitude?: number | null;
  longitude?: number | null;
}

@Component({
  selector: 'app-pocos',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, MenuLateralComponent],
  templateUrl: './poco.component.html',
  styleUrls: ['./poco.component.css'],
})
export class PocoComponent implements OnInit {
  // UI state
  alertSucess = false;
  loading = false;
  saving = false;
  errorMsg = '';
  deleting = new Set<string>();

  // modal criar/editar
  showAdd = false;
  adicionar = false;
  edit = false;

  // modal import CSV
  showImport = false;
  csvText = '';
  csvError = '';
  importing = false;

  // busca (client-side sobre a página atual)
  searchTerm = '';

  // dados (conteúdo da página atual)
  allPocos: PocoView[] = [];
  filteredPocos: PocoView[] = [];

  // ===== paginação =====
  pageIndex = 0;              // 0-based
  pageSize = 50;
  pageSizeOptions = [20, 50, 100, 200];
  totalElements = 0;
  totalPages = 0;
  sort: string[] = ['codigoAnp,asc']; // mesmo formato do backend

  // ===== listas auxiliares =====
  bacias: string[] = [
    'DESCONHECIDO','ACRE','ALAGOAS','ALMADA','AMAZONAS','ARARIPE','BARREIRINHAS','BRAGANCA_VIZEU',
    'CAMAMU','CAMPOS','CEARA','CUMURUXATIBA','ESPIRITO_SANTO','FOZ_DO_AMAZONAS','JACUIPE',
    'JATOBA','JEQUITINHONHA','MARAJO','MUCURI','PANTANAL','PARANA','PARA_MARANHAO',
    'PARECIS_ALTO_XINGU','PARNAIBA','PELOTAS','PERNAMBUCO_PARAIBA','POTIGUAR','RECONCAVO',
    'RIO_DO_PEIXE','SANTOS','SAO_FRANCISCO','SAO_LUIS','SERGIPE','SOLIMOES','TACUTU',
    'TUCANO_CENTRAL','TUCANO_NORTE','TUCANO_SUL'
  ];

  fluidos = [
    { value: 'OLEO_LEVE',         label: 'Óleo leve' },
    { value: 'OLEO_MEDIO',        label: 'Óleo médio' },
    { value: 'OLEO_PESADO',       label: 'Óleo pesado' },
    { value: 'OLEO_EXTRA_PESADO', label: 'Óleo extra pesado' },
    { value: 'GAS_NATURAL',       label: 'Gás natural' },
    { value: 'CONDENSADO',        label: 'Condensado' },
    { value: 'MISTO',             label: 'Misto' },
  ];

  statusList: string[] = [
    'ABANDONADO_AGUARDANDO_ABANDONO_DEFINITIVO_ARRASAMENTO',
    'ABANDONADO_PERMANENTEMENTE',
    'ABANDONADO_POR_LOGISTICA_EXPLORATORIA',
    'ABANDONADO_TEMPORARIAMENTE_COM_MONITORAMENTO',
    'ABANDONADO_TEMPORARIAMENTE_SEM_MONITORAMENTO',
    'ABANDONADO_PARADO_AGUARDANDO_INTERVENCAO_PARA_AVALIACAO_COMPLETACAO_OU_RESTAURACAO',
    'ARRASADO',
    'CEDIDO_PARA_CAPTACAO_DE_AGUA',
    'DEVOLVIDO',
    'EM_AVALIACAO',
    'EM_COMPLETACAO',
    'EM_INTERVENCAO',
    'EM_OBSERVACAO',
    'EM_PERFURACAO',
    'EQUIPADO_AGUARDANDO_INICIO_DE_OPERACAO',
    'EQUIPADO_AGUARDANDO_INICIO_DE_PRODUCAO',
    'FECHADO',
    'INJETANDO',
    'OPERANDO_PARA_CAPTACAO_DE_AGUA',
    'OPERANDO_PARA_DESCARTE',
    'OUTRO',
    'PRODUZINDO',
    'PRODUZINDO_E_INJETANDO'
  ];

  // form model
  newPoco: PocoForm = this.criarNovoPocoVazio();

  constructor(private pocoSvc: PocoService) {}

  ngOnInit(): void { this.loadPage(0); }

  /** --------- Carregamento paginado --------- */
  loadPage(page: number): void {
    this.loading = true;
    this.errorMsg = '';
    this.pageIndex = Math.max(0, page);

    this.pocoSvc.getPocosPaged(this.pageIndex, this.pageSize, this.sort).pipe(
      finalize(() => (this.loading = false)),
      catchError(err => {
        this.errorMsg = 'Não foi possível carregar os poços paginados. Veja o console.';
        console.error('[Pocos] erro em getPocosPaged', err);
        return of(null as unknown as PageResponse<PocoDTO>);
      })
    ).subscribe(res => {
      if (!res) return;

      this.totalElements = res.totalElements ?? 0;
      this.totalPages = res.totalPages ?? 0;
      this.pageIndex = res.number ?? 0;
      this.pageSize = res.size ?? this.pageSize;

      const data = res.content ?? [];
      this.allPocos = data.map(d => ({
        codANP: (d as any).codANP,
        bacia: (d as any).bacia,
        status: (d as any).status,
        fluido: (d as any).fluido,
        nomeCampo: (d as any).nomeCampo,
        local: (d as any).local,
        latitude: (d as any).latitude ?? null,
        longitude: (d as any).longitude ?? null,
      }));

      // filtro client-side apenas sobre a página atual
      this.applyFilter();
    });
  }

  // Helpers para paginação
  firstItemIndex(): number {
    if (this.totalElements === 0) return 0;
    return this.pageIndex * this.pageSize + 1;
    }
  lastItemIndex(): number {
    const last = (this.pageIndex + 1) * this.pageSize;
    return Math.min(last, this.totalElements);
  }
  canPrev(): boolean { return this.pageIndex > 0; }
  canNext(): boolean { return this.pageIndex + 1 < this.totalPages; }
  goPrev(): void { if (this.canPrev()) this.loadPage(this.pageIndex - 1); }
  goNext(): void { if (this.canNext()) this.loadPage(this.pageIndex + 1); }
  changePageSize(size: number): void {
    this.pageSize = Number(size) || 50;
    this.loadPage(0);
  }
  setSort(field: string): void {
    // alterna asc/desc para o mesmo campo
    const current = this.sort.find(s => s.startsWith(field + ','));
    const dir = current?.endsWith(',asc') ? 'desc' : 'asc';
    this.sort = [`${field},${dir}`];
    this.loadPage(0);
  }

  /** --------- Busca local (na página) --------- */
  applyFilter(): void {
    const q = this.normalize(this.searchTerm);
    if (!q) { this.filteredPocos = [...this.allPocos]; return; }

    this.filteredPocos = this.allPocos.filter(p =>
      this.normalize(`${(p as any).codANP} ${(p as any).bacia} ${(p as any).status} ${(p as any).nomeCampo ?? ''} ${(p as any).local ?? ''}`)
        .includes(q)
    );
  }
  clearSearch(): void { this.searchTerm = ''; this.applyFilter(); }
  private normalize(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }
  trackByCod = (_: number, p: PocoView) => this.getCodigo(p) ?? _;

  getCodigo(p: PocoView): string { return (p as any).codANP || (p as any).codigoAnp; }

  /** --------- Modal Criar/Editar --------- */
  onAdd(): void {
    this.showAdd = true; this.adicionar = true; this.edit = false;
    this.newPoco = this.criarNovoPocoVazio();
  }

  onEdit(p: PocoView): void {
    const codigo = this.getCodigo(p); if (!codigo) return;
    this.showAdd = true; this.adicionar = false; this.edit = true;

    this.pocoSvc.getByCodigoAnp(codigo)
      .pipe(catchError(err => { console.error('Erro ao buscar poço', err); return of(null); }))
      .subscribe(po => {
        if (!po) return;
        this.newPoco = {
          codigoAnp: (po as any).codigoAnp ?? (po as any).codANP ?? '',
          nomeCampo: (po as any).nomeCampo ?? '',
          bacia: (po as any).bacia ?? undefined,
          status: (po as any).status ?? undefined,
          fluido: (po as any).fluido ?? undefined,
          local: (po as any).local ?? '',
          latitude: ((po as any).latitude as any) ?? null,
          longitude: ((po as any).longitude as any) ?? null,
        };
      });
  }

  closeModal(): void {
    this.showAdd = false; this.adicionar = false; this.edit = false;
    this.newPoco = this.criarNovoPocoVazio();
  }

  /** --------- Ações CRUD --------- */
  adicionarPoco(): void {
    if (this.saving) return; this.saving = true;
    const body: Poco = this.formToModel(this.newPoco);

    this.pocoSvc.createPoco(body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.alertSucess = true; this.loadPage(0); this.closeModal();
          setTimeout(() => (this.alertSucess = false), 5000);
        },
        error: (err: any) => { console.error('Erro ao adicionar poço:', err); },
      });
  }

  editarPoco(): void {
    if (this.saving) return; this.saving = true;
    const body: Poco = this.formToModel(this.newPoco);

    this.pocoSvc.updatePocoByCodigoAnp(body.codigoAnp!, body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.alertSucess = true; this.loadPage(this.pageIndex); this.closeModal();
          setTimeout(() => (this.alertSucess = false), 5000);
        },
        error: (err: any) => { console.error('Erro ao editar poço:', err); },
      });
  }

  delete(p: PocoView): void {
    const cod = this.getCodigo(p); if (!cod) return;
    if (!confirm(`Excluir o poço ${cod}?`)) return;
    if (this.deleting.has(cod)) return;

    this.deleting.add(cod);
    this.pocoSvc.deletePoco(cod)
      .pipe(finalize(() => this.deleting.delete(cod)))
      .subscribe({
        next: () => this.onDeleteSuccess(cod),
        error: (err: any) => {
          if (err instanceof HttpErrorResponse && (err.status === 200 || err.status === 204)) {
            this.onDeleteSuccess(cod); return;
          }
          alert(`Não foi possível excluir o poço ${cod}.`);
          console.error(`Falha ao excluir ${cod}:`, err);
        }
      });
  }

  private onDeleteSuccess(cod: string): void {
    // recarrega a página atual (pode ter “sobrado” espaço)
    this.loadPage(this.pageIndex);
    this.alertSucess = true;
    setTimeout(() => (this.alertSucess = false), 3000);
  }

  // ===== Import CSV (inalterado) =====
  openImport(): void { this.csvText = ''; this.csvError = ''; this.showImport = true; }
  closeImport(): void { this.showImport = false; this.csvText = ''; this.csvError = ''; this.importing = false; }

  addFromCsvText(): void {
    const raw = (this.csvText || '').trim();
    this.csvError = '';
    if (!raw) { this.csvError = 'Cole as linhas do CSV.'; return; }

    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !this.isHeader(l));

    if (lines.length === 0) {
      this.csvError = 'Nenhuma linha de dados encontrada.';
      return;
    }

    const parsed = lines.map((line, i) => {
      const poco = this.parseCsvLine(line);
      return { idx: i + 1, line, poco };
    });

    const valid = parsed.filter(x => x.poco && x.poco.codigoAnp);
    const invalid = parsed.filter(x => !x.poco || !x.poco.codigoAnp);

    if (valid.length === 0) {
      this.csvError = 'Nenhuma linha válida (faltando codigoAnp).';
      return;
    }

    this.importing = true;

    from(valid).pipe(
      mergeMap(({ poco }) =>
        this.pocoSvc.createPoco(poco!).pipe(
          map(() => ({ ok: true })),
          catchError(err => of({ ok: false, err }))
        ),
        4
      ),
      toArray(),
      finalize(() => (this.importing = false))
    ).subscribe(results => {
      const ok = results.filter(r => r.ok).length;
      const fail = results.length - ok;

      this.closeImport();
      this.alertSucess = true;
      this.loadPage(0); // volta para primeira página
      setTimeout(() => (this.alertSucess = false), 4000);

      if (fail > 0 || invalid.length > 0) {
        const inv = invalid.length ? ` + ${invalid.length} inválida(s)` : '';
        this.errorMsg = `Importação: ${ok} sucesso(s), ${fail} falha(s)${inv}.`;
      }
    });
  }

  private isHeader(line: string): boolean {
    const t = line.replace(/\s+/g, '').toLowerCase();
    return t.startsWith('codigoanp;') || t.startsWith('codigoanp,');
  }

  private parseCsvLine(line: string): Poco | null {
    const sep = line.includes(';') ? ';' : ',';
    const parts = line.split(sep).map(s => s.trim().replace(/^"(.*)"$/, '$1'));
    while (parts.length < 8) parts.push('');

    const [codigoAnp, nomeCampo, bacia, status, fluido, local, latStr, lonStr] = parts;
    const latitude  = this.parseNumOrNull(latStr);
    const longitude = this.parseNumOrNull(lonStr);

    return {
      codigoAnp: (codigoAnp || '').trim() || undefined,
      nomeCampo: (nomeCampo || '').trim() || undefined,
      bacia: this.normEnum(bacia) || undefined,
      status: this.normEnum(status) || undefined,
      fluido: this.normEnum(fluido) || undefined,
      local: (local || '').trim() || undefined,
      latitude,
      longitude,
    } as Poco;
  }

  private parseNumOrNull(s?: string): number | null {
    if (!s || !s.trim()) return null;
    const n = Number(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  private normEnum(val?: string): string | undefined {
    if (!val) return undefined;
    const n = val
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
    if (n === 'STATUS' || n === 'FLUIDO' || n === 'BACIA') return undefined;
    return n || undefined;
  }

  private isPlaceholder(v?: string): boolean {
    if (!v) return true;
    const t = v.trim().toUpperCase();
    return t === '' || t === 'STATUS' || t === 'FLUIDO' || t === 'BACIA';
  }

  private criarNovoPocoVazio(): PocoForm {
    return {
      codigoAnp: '',
      nomeCampo: '',
      bacia: undefined,
      status: undefined,
      fluido: undefined,
      local: '',
      latitude: null,
      longitude: null
    };
  }

  private formToModel(form: PocoForm): Poco {
    return {
      codigoAnp: form.codigoAnp?.trim(),
      nomeCampo: form.nomeCampo || undefined,
      bacia: this.isPlaceholder(form.bacia) ? undefined : form.bacia,
      status: this.isPlaceholder(form.status) ? undefined : form.status,
      fluido: this.isPlaceholder(form.fluido) ? undefined : form.fluido,
      local: form.local || undefined,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
    } as Poco;
  }
}
