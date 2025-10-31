import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperadoraComponent } from './operadora.component';

describe('OperadoraComponent', () => {
  let component: OperadoraComponent;
  let fixture: ComponentFixture<OperadoraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperadoraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperadoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
