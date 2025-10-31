import { TestBed } from '@angular/core/testing';

import { PocoService } from './poco.service';

describe('PocoServiceService', () => {
  let service: PocoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PocoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
