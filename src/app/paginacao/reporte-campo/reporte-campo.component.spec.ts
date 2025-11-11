import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCampoComponent } from './reporte-campo.component';

describe('ReporteCampoComponent', () => {
  let component: ReporteCampoComponent;
  let fixture: ComponentFixture<ReporteCampoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteCampoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteCampoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
