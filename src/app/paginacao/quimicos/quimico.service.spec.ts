import { TestBed } from '@angular/core/testing';

import { QuimicoService } from './quimico.service';

describe('QuimicoService', () => {
  let service: QuimicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuimicoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
