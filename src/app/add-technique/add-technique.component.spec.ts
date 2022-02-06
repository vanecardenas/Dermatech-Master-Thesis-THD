import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTechniqueComponent } from './add-technique.component';

describe('AddTechniqueComponent', () => {
  let component: AddTechniqueComponent;
  let fixture: ComponentFixture<AddTechniqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTechniqueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
