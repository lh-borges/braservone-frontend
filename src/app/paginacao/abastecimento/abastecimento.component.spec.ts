import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbastecimentoComponent } from './abastecimento.component';

describe('AbastecimentoComponent', () => {
  let component: AbastecimentoComponent;
  let fixture: ComponentFixture<AbastecimentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbastecimentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbastecimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
