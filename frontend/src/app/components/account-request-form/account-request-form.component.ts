import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountRequestService, CreateAccountRequest } from '../../services/account-request.service';

@Component({
  selector: 'app-account-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-request-form.component.html',
  styleUrls: ['./account-request-form.component.css']
})
export class AccountRequestFormComponent {
  @Output() requestCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  requestType: string = 'CURRENT';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  showConfirmation: boolean = false;

  constructor(private accountRequestService: AccountRequestService) {}

  submitRequest(): void {
    this.isLoading = true;
    this.message = '';
    
    const requestData: CreateAccountRequest = {
      type: this.requestType
    };

    this.accountRequestService.createRequest(requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showConfirmation = true;
        this.message = 'Your request has been sent successfully!';
        this.messageType = 'success';
        
        // Emit event to notify parent
        setTimeout(() => {
          this.requestCreated.emit();
          this.closeModal();
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err.error?.message || 'Error sending request';
        this.messageType = 'error';
        
        setTimeout(() => {
          this.message = '';
        }, 5000);
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.requestType = 'CURRENT';
    this.message = '';
    this.showConfirmation = false;
  }
}