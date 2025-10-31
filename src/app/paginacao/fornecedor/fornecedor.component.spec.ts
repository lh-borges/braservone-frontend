import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FornecedorComponent } from './fornecedor.component';
import { HeaderComponent } from '../utilities/header/header.component';
import { MenuLateralComponent } from '../utilities/menu-lateral/menu-lateral.component';

describe('FornecedorComponent', () => {
  let component: FornecedorComponent;
  let fixture: ComponentFixture<FornecedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FornecedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FornecedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
