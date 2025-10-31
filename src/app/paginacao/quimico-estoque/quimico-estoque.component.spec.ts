import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuimicoEstoqueComponent } from './quimico-estoque.component';

describe('QuimicoEstoqueComponent', () => {
  let component: QuimicoEstoqueComponent;
  let fixture: ComponentFixture<QuimicoEstoqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuimicoEstoqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuimicoEstoqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
