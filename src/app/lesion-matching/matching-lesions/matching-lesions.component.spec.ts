import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingLesionsComponent } from './matching-lesions.component';

describe('MatchingLesionsComponent', () => {
  let component: MatchingLesionsComponent;
  let fixture: ComponentFixture<MatchingLesionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatchingLesionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatchingLesionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
