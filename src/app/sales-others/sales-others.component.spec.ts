import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesOthersComponent } from './sales-others.component';

describe('SalesOthersComponent', () => {
  let component: SalesOthersComponent;
  let fixture: ComponentFixture<SalesOthersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalesOthersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesOthersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
