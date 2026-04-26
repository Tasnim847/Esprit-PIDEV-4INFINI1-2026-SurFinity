import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountRequestFormComponent } from './account-request-form.component';

describe('AccountRequestFormComponent', () => {
  let component: AccountRequestFormComponent;
  let fixture: ComponentFixture<AccountRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountRequestFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
