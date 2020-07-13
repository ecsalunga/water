import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesWaterComponent } from './sales-water.component';

describe('SalesWaterComponent', () => {
  let component: SalesWaterComponent;
  let fixture: ComponentFixture<SalesWaterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalesWaterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesWaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
