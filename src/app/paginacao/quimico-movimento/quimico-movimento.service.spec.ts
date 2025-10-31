import { TestBed } from '@angular/core/testing';

import { QuimicoMovimentoService } from './quimico-movimento.service';

describe('QuimicoMovimentoService', () => {
  let service: QuimicoMovimentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuimicoMovimentoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
