import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientAccountService, ClientAccount } from '../../services/client-account.service';
import { AccountRequestService, AccountRequest } from '../../services/account-request.service';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit {
  // Data
  accounts: ClientAccount[] = [];
  transactions: any[] = [];
  myRequests: AccountRequest[] = [];
  
  // UI States
  activeTab: string = 'accounts';
  showRequestModal = false;
  showTransferModal = false;
  newRequestType: string = 'CURRENT';
  selectedAccountId: number | null = null;
  
  // Transfer
  transferData = {
    sourceRip: '',
    targetRip: '',
    amount: 0,
    description: ''
  };
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  
  // Loading
  isLoading = false;

  constructor(
    private clientAccountService: ClientAccountService,
    private accountRequestService: AccountRequestService,
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.loadAccounts();
    this.loadRequests();
  }

  loadAccounts() {
    this.isLoading = true;
    this.clientAccountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        if (this.accounts.length > 0) {
          this.loadTransactions(this.accounts[0].accountId);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading accounts', err);
        this.isLoading = false;
      }
    });
  }

  loadTransactions(accountId: number) {
    this.selectedAccountId = accountId;
    this.transactionService.getTransactionsByAccount(accountId).subscribe({
      next: (data) => {
        this.transactions = data;
      },
      error: (err) => console.error('Error loading transactions', err)
    });
  }

  loadRequests() {
    this.accountRequestService.getMyRequests().subscribe({
      next: (data) => {
        this.myRequests = data;
      },
      error: (err) => console.error('Error loading requests', err)
    });
  }

  getTotalBalance(): number {
    return this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }

  submitRequest() {
    if (!this.newRequestType) {
      this.showMessage('Please select an account type', 'error');
      return;
    }

    this.accountRequestService.createRequest({ type: this.newRequestType }).subscribe({
      next: () => {
        this.showRequestModal = false;
        this.loadRequests();
        this.showMessage('Request sent successfully!', 'success');
        this.newRequestType = 'CURRENT';
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error submitting request', 'error');
      }
    });
  }

  submitTransfer() {
    if (!this.transferData.sourceRip) {
      this.showMessage('Please select a source account', 'error');
      return;
    }
    if (this.transferData.targetRip.length !== 21) {
      this.showMessage(`Destination RIP must be exactly 21 digits (currently: ${this.transferData.targetRip.length})`, 'error');
      return;
    }
    if (this.transferData.amount <= 0) {
      this.showMessage('Amount must be greater than 0', 'error');
      return;
    }

    this.transactionService.transferByRip(
      this.transferData.sourceRip,
      this.transferData.targetRip,
      this.transferData.amount,
      this.transferData.description || 'Transfer'
    ).subscribe({
      next: (response) => {
        this.showMessage(response, 'success');
        this.loadAccounts();
        this.showTransferModal = false;
        this.transferData = { sourceRip: '', targetRip: '', amount: 0, description: '' };
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error during transfer', 'error');
      }
    });
  }

  downloadStatement() {
    if (this.selectedAccountId) {
      this.transactionService.getAccountStatement(this.selectedAccountId).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `account_statement_${this.selectedAccountId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showMessage('PDF downloaded successfully', 'success');
        },
        error: () => {
          this.showMessage('Error downloading PDF', 'error');
        }
      });
    }
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }

  copyRip(rip: string) {
    navigator.clipboard.writeText(rip);
    this.showMessage('RIP copied!', 'success');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}