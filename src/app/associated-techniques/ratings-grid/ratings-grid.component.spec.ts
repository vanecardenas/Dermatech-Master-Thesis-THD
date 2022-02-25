import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingsGridComponent } from './ratings-grid.component';

describe('RatingsGridComponent', () => {
  let component: RatingsGridComponent;
  let fixture: ComponentFixture<RatingsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RatingsGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
