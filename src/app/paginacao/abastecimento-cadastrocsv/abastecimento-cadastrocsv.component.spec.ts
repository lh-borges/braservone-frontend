import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbastecimentoCadastroCsvComponent } from './abastecimento-cadastrocsv.component';

describe('AbastecimentoCadastrocsvComponent', () => {
  let component: AbastecimentoCadastroCsvComponent;
  let fixture: ComponentFixture<AbastecimentoCadastroCsvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbastecimentoCadastroCsvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbastecimentoCadastroCsvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
