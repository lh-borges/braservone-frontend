import { TestBed } from '@angular/core/testing';

import { AbastecimentoGraficoService } from './abastecimento-grafico.service';

describe('AbastecimentoGraficoService', () => {
  let service: AbastecimentoGraficoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbastecimentoGraficoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
