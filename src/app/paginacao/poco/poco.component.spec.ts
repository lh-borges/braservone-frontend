import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PocoComponent } from './poco.component';

describe('PocoComponent', () => {
  let component: PocoComponent;
  let fixture: ComponentFixture<PocoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PocoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PocoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
