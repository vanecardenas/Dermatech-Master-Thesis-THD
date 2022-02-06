import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociateLesionTechniqueComponent } from './associate-lesion-technique.component';

describe('AssociateLesionTechniqueComponent', () => {
  let component: AssociateLesionTechniqueComponent;
  let fixture: ComponentFixture<AssociateLesionTechniqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssociateLesionTechniqueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociateLesionTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
