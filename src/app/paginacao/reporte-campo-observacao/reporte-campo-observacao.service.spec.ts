import { TestBed } from '@angular/core/testing';

import { ReporteCampoObservacaoService } from './reporte-campo-observacao.service';

describe('ReporteCampoObservacaoService', () => {
  let service: ReporteCampoObservacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteCampoObservacaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
