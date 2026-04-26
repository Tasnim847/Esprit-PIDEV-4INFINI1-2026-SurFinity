export interface CashApprovalRequest {
  id: number;
  paymentId: number;
  contractId: number;
  amount: number;
  clientEmail: string;
  clientName: string;
  clientId: number;
  agentId: number;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
}