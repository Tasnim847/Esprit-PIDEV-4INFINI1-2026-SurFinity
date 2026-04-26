import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { ClientAccount } from '../../services/client-account.service';

@Component({
  selector: 'app-transfer-by-rip',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './transfer-by-rip.component.html',
  styleUrls: ['./transfer-by-rip.component.css']
})
export class TransferByRipComponent {
  @Input() accounts: ClientAccount[] = [];
  @Output() transferSuccess = new EventEmitter<void>();

  transferData = {
    sourceRip: '',
    targetRip: '',
    amount: 0,
    description: ''
  };
  
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;

  constructor(private transactionService: TransactionService) {}

  isValid(): boolean {
    return !!this.transferData.sourceRip && 
           this.transferData.targetRip.length === 21 && 
           this.transferData.amount > 0;
  }

  submitTransfer(): void {
    if (!this.isValid()) {
      this.showMessage('Please check the information (RIP must be 21 digits)', 'error');
      return;
    }
    
    this.isLoading = true;
    this.message = '';

    this.transactionService.transferByRip(
      this.transferData.sourceRip,
      this.transferData.targetRip,
      this.transferData.amount,
      this.transferData.description
    ).subscribe({
      next: (response) => {
        this.showMessage(response, 'success');
        this.transferSuccess.emit();
        this.resetForm();
        this.isLoading = false;
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error during transfer', 'error');
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.transferData = {
      sourceRip: '',
      targetRip: '',
      amount: 0,
      description: ''
    };
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }
}