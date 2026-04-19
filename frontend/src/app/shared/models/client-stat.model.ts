// src/app/shared/models/client-stat.model.ts
export interface ClientStat {
  clientId: number;
  clientName: string;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  pendingClaims: number;
  inReviewClaims: number;
  compensatedClaims: number;
  totalAmount: number;
  approvedAmount: number;
}