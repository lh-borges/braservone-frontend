import { TestBed } from '@angular/core/testing';

import { OperadoraService } from './operadora.service';

describe('OperadoraService', () => {
  let service: OperadoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperadoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
