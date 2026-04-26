import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferByRipComponent } from './transfer-by-rip.component';

describe('TransferByRipComponent', () => {
  let component: TransferByRipComponent;
  let fixture: ComponentFixture<TransferByRipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferByRipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferByRipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
