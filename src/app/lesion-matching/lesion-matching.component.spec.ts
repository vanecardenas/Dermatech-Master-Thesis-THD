import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LesionMatchingComponent } from './lesion-matching.component';

describe('LesionMatchingComponent', () => {
  let component: LesionMatchingComponent;
  let fixture: ComponentFixture<LesionMatchingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LesionMatchingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LesionMatchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
