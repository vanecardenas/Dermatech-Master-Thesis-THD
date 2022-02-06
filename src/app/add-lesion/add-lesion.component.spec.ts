import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLesionComponent } from './add-lesion.component';

describe('AddLesionComponent', () => {
  let component: AddLesionComponent;
  let fixture: ComponentFixture<AddLesionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddLesionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
