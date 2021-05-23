import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LesionSelectionComponent } from './lesion-selection.component';

describe('LesionSelectionComponent', () => {
  let component: LesionSelectionComponent;
  let fixture: ComponentFixture<LesionSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LesionSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LesionSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
