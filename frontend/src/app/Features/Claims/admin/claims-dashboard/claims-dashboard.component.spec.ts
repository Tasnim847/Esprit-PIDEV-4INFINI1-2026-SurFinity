import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimsDashboardComponent } from './claims-dashboard.component';

describe('ClaimsDashboardComponent', () => {
  let component: ClaimsDashboardComponent;
  let fixture: ComponentFixture<ClaimsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClaimsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
