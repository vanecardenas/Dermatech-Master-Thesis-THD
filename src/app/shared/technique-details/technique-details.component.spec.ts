import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechniqueDetailsComponent } from './technique-details.component';

describe('TechniqueDetailsComponent', () => {
  let component: TechniqueDetailsComponent;
  let fixture: ComponentFixture<TechniqueDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TechniqueDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechniqueDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
