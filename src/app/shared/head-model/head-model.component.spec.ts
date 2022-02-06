import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadModelComponent } from './head-model.component';

describe('HeadModelComponent', () => {
  let component: HeadModelComponent;
  let fixture: ComponentFixture<HeadModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeadModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeadModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
