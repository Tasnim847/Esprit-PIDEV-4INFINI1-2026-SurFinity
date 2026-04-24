import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentComplaintsComponent } from './agent-complaints.component';

describe('AgentComplaintsComponent', () => {
  let component: AgentComplaintsComponent;
  let fixture: ComponentFixture<AgentComplaintsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentComplaintsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentComplaintsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
