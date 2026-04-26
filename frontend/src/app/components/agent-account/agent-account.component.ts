import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

export interface ClientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  accounts: AccountInfo[];
  totalBalance: number;
}

export interface AccountInfo {
  accountId: number;
  rip: string;
  balance: number;
  type: string;
  status: string;
}

@Component({
  selector: 'app-agent-account',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './agent-account.component.html',
  styleUrls: ['./agent-account.component.css']
})
export class AgentAccountComponent implements OnInit {
  clients: ClientInfo[] = [];
  filteredClients: ClientInfo[] = [];
  searchTerm: string = '';
  isLoading = false;
  
  // Deposit modal
  showDepositModal = false;
  selectedAccount: AccountInfo | null = null;
  selectedClient: ClientInfo | null = null;
  depositAmount = 0;
  depositDescription = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  
  // History modal
  showHistoryModal = false;
  selectedAccountForHistory: AccountInfo | null = null;
  transactionHistory: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadAgentClients();
  }

  loadAgentClients() {
    this.isLoading = true;
    const agentId = this.authService.getUserId();
    
    // Get clients for this agent
    this.http.get<ClientInfo[]>(`http://localhost:8083/agents/finance/${agentId}/clients`).subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading clients', err);
        this.loadAllClients();
        this.isLoading = false;
      }
    });
  }

  loadAllClients() {
    this.http.get<ClientInfo[]>('http://localhost:8083/api/clients/all').subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
      },
      error: (err) => console.error('Error', err)
    });
  }

  searchClients() {
    if (!this.searchTerm.trim()) {
      this.filteredClients = this.clients;
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.firstName.toLowerCase().includes(term) ||
      client.lastName.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term)
    );
  }

  openDepositModal(client: ClientInfo, account: AccountInfo) {
    this.selectedClient = client;
    this.selectedAccount = account;
    this.depositAmount = 0;
    this.depositDescription = '';
    this.message = '';
    this.showDepositModal = true;
  }

  submitDeposit() {
    if (this.depositAmount <= 0) {
      this.showMessage('Amount must be greater than 0', 'error');
      return;
    }

    this.isLoading = true;
    const token = this.authService.getToken();
    
    const body = {
      amount: this.depositAmount,
      type: 'DEPOSIT',
      description: this.depositDescription || 'Deposit by agent'
    };
    
    this.http.post(
      `http://localhost:8083/api/transactions/account/${this.selectedAccount!.accountId}`,
      body,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).subscribe({
      next: (response: any) => {
        this.showMessage(`Deposit of ${this.depositAmount} TND completed successfully!`, 'success');
        
        // Update balance locally
        if (this.selectedAccount) {
          this.selectedAccount.balance += this.depositAmount;
          if (this.selectedClient) {
            this.selectedClient.totalBalance = this.selectedClient.accounts.reduce((sum, acc) => sum + acc.balance, 0);
          }
        }
        
        this.showDepositModal = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error during deposit', 'error');
        this.isLoading = false;
      }
    });
  }

  showHistory(account: AccountInfo) {
    this.selectedAccountForHistory = account;
    const token = this.authService.getToken();
    
    this.http.get(`http://localhost:8083/api/transactions/account/${account.accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data: any) => {
        this.transactionHistory = data;
        this.showHistoryModal = true;
      },
      error: (err) => console.error('Error', err)
    });
  }

  copyRip(rip: string) {
    navigator.clipboard.writeText(rip);
    this.showMessage('RIP copied to clipboard!', 'success');
    setTimeout(() => this.message = '', 3000);
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }

  closeModals() {
    this.showDepositModal = false;
    this.showHistoryModal = false;
    this.selectedAccount = null;
    this.selectedClient = null;
    this.selectedAccountForHistory = null;
  }

  getAccountTypeLabel(type: string): string {
    return type === 'CURRENT' ? 'Current Account' : 'Savings Account';
  }
}