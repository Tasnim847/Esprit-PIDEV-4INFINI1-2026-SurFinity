import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplaintPageComponent } from './complaint-page.component';

describe('ComplaintPageComponent', () => {
  let component: ComplaintPageComponent;
  let fixture: ComponentFixture<ComplaintPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplaintPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplaintPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
