import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarFooterLayoutComponent } from './navbar-footer-layout.component';

describe('NavbarFooterLayoutComponent', () => {
  let component: NavbarFooterLayoutComponent;
  let fixture: ComponentFixture<NavbarFooterLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarFooterLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarFooterLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
