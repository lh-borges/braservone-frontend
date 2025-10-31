import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuimicoGraficoComponent } from './quimico-grafico.component';

describe('QuimicoGraficoComponent', () => {
  let component: QuimicoGraficoComponent;
  let fixture: ComponentFixture<QuimicoGraficoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuimicoGraficoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuimicoGraficoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
