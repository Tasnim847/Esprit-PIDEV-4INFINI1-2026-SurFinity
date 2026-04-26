import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAccountsComponent } from './client-accounts.component';

describe('ClientAccountsComponent', () => {
  let component: ClientAccountsComponent;
  let fixture: ComponentFixture<ClientAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAccountsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
