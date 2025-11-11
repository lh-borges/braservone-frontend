import { TestBed } from '@angular/core/testing';

import { ReporteCampoServiceService } from './reporte-campo-service.service';

describe('ReporteCampoServiceService', () => {
  let service: ReporteCampoServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteCampoServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
