import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentCashApprovalsComponent } from './agent-cash-approvals.component';

describe('AgentCashApprovalsComponent', () => {
  let component: AgentCashApprovalsComponent;
  let fixture: ComponentFixture<AgentCashApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentCashApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentCashApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
