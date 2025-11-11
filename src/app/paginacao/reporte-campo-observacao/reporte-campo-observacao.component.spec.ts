import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCampoObservacaoComponent } from './reporte-campo-observacao.component';

describe('ReporteCampoObservacaoComponent', () => {
  let component: ReporteCampoObservacaoComponent;
  let fixture: ComponentFixture<ReporteCampoObservacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteCampoObservacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteCampoObservacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
