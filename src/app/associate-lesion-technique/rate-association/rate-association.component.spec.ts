import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateAssociationComponent } from './rate-association.component';

describe('RateAssociationComponent', () => {
  let component: RateAssociationComponent;
  let fixture: ComponentFixture<RateAssociationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RateAssociationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RateAssociationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
