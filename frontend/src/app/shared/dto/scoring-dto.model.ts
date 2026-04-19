// shared/dto/scoring-dto.model.ts

export interface ClaimScoreDTO {
  claimId: number;
  claimedAmount: number;
  riskScore: number;
  riskLevel: 'TRES_FAIBLE' | 'FAIBLE' | 'MODERE' | 'ELEVE' | 'TRES_ELEVE';
  recommendation: string;
  colorCode: string;
  delayInfo: string;
  documentTypeInfo: string;
  frequencyInfo: string;
  isSuspicious: boolean;
  decisionSuggestion: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'MANUAL_REVIEW';
}

export interface ClientScoreResult {
  clientId: number;
  globalScore: number;
  riskLevel: string;
  riskClass: string;
  recommendations: string[];
}

export interface DetailedAnalysis {
  claimScore: ClaimScoreDTO;
  clientScore: ClientScoreResult;
  finalScore: {
    value: number;
    level: string;
    decision: string;
    isSuspicious: boolean;
  };
}