import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporterOperadorComponent } from './reporter-operador.component';

describe('ReporterOperadorComponent', () => {
  let component: ReporterOperadorComponent;
  let fixture: ComponentFixture<ReporterOperadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporterOperadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporterOperadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
