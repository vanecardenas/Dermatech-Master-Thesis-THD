import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedTechniquesComponent } from './associated-techniques.component';

describe('AssociatedTechniquesComponent', () => {
  let component: AssociatedTechniquesComponent;
  let fixture: ComponentFixture<AssociatedTechniquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssociatedTechniquesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedTechniquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
