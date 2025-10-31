import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuimicoMovimentoComponent } from './quimico-movimento.component';

describe('QuimicoMovimentoComponent', () => {
  let component: QuimicoMovimentoComponent;
  let fixture: ComponentFixture<QuimicoMovimentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuimicoMovimentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuimicoMovimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
