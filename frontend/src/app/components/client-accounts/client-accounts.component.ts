import { Component, OnInit, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ClientAccountService, ClientAccount } from '../../services/client-account.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './client-accounts.component.html',
  styleUrls: ['./client-accounts.component.css']
})
export class ClientAccountsComponent implements OnInit {
  accounts: ClientAccount[] = [];
  selectedAccount: ClientAccount | null = null;
  transactionHistory: any[] = [];
  isLoading: boolean = true;

  constructor(
    private clientAccountService: ClientAccountService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.clientAccountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading accounts', err);
        this.isLoading = false;
      }
    });
  }

  showAccountDetails(account: ClientAccount): void {
    this.selectedAccount = account;
    this.loadTransactionHistory(account.accountId);
  }

  loadTransactionHistory(accountId: number): void {
    this.transactionService.getTransactionsByAccount(accountId).subscribe({
      next: (data) => {
        this.transactionHistory = data;
      },
      error: (err) => console.error('Error loading transaction history', err)
    });
  }

  closeModal(): void {
    this.selectedAccount = null;
    this.transactionHistory = [];
  }

  copyRip(rip: string): void {
    navigator.clipboard.writeText(rip);
    alert('RIP copied to clipboard!');
  }

  getAccountIcon(type: string): string {
    return type === 'CURRENT' ? 'fa-wallet' : 'fa-piggy-bank';
  }

  getAccountLabel(type: string): string {
    return type === 'CURRENT' ? 'Current Account' : 'Savings Account';
  }
}