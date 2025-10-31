import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbastecimentoGraficoComponent } from './abastecimento-grafico.component';

describe('AbastecimentoGraficoComponent', () => {
  let component: AbastecimentoGraficoComponent;
  let fixture: ComponentFixture<AbastecimentoGraficoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbastecimentoGraficoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbastecimentoGraficoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
