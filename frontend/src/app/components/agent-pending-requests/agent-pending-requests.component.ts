import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountRequestService, AccountRequest } from '../../services/account-request.service';

@Component({
  selector: 'app-agent-pending-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './agent-pending-requests.component.html',
  styleUrls: ['./agent-pending-requests.component.css']
})
export class AgentPendingRequestsComponent implements OnInit {
  pendingRequests: AccountRequest[] = [];
  selectedRequest: AccountRequest | null = null;
  rejectReason: string = '';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private accountRequestService: AccountRequestService) {}

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.isLoading = true;
    this.accountRequestService.getPendingRequests().subscribe({
      next: (data) => {
        this.pendingRequests = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading requests', err);
        this.showMessage('Error loading requests', 'error');
        this.isLoading = false;
      }
    });
  }

  approveRequest(requestId: number): void {
    if (confirm('Confirm approval of this request?')) {
      this.isLoading = true;
      this.accountRequestService.approveRequest(requestId).subscribe({
        next: () => {
          this.showMessage('Request approved successfully!', 'success');
          this.loadPendingRequests();
        },
        error: (err) => {
          this.showMessage(err.error?.message || 'Error during approval', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  openRejectModal(request: AccountRequest): void {
    this.selectedRequest = request;
    this.rejectReason = '';
  }

  closeRejectModal(): void {
    this.selectedRequest = null;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (this.selectedRequest && this.rejectReason.trim()) {
      this.isLoading = true;
      this.accountRequestService.rejectRequest(this.selectedRequest.id, this.rejectReason).subscribe({
        next: () => {
          this.showMessage('Request rejected successfully', 'success');
          this.closeRejectModal();
          this.loadPendingRequests();
        },
        error: (err) => {
          this.showMessage(err.error?.message || 'Error during rejection', 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.showMessage('Please enter a rejection reason', 'error');
    }
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }
}