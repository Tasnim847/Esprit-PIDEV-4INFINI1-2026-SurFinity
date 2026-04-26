import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentPendingRequestsComponent } from './agent-pending-requests.component';

describe('AgentPendingRequestsComponent', () => {
  let component: AgentPendingRequestsComponent;
  let fixture: ComponentFixture<AgentPendingRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentPendingRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentPendingRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
