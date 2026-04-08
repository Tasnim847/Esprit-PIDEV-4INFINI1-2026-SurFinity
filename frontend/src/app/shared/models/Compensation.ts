import { CompensationStatus } from '../enums/CompensationStatus';
import { Claim } from './Claim';

export interface Compensation {
    compensationId: number;
    amount: number;
    paymentDate: Date;
    clientOutOfPocket: number;
    coverageLimit: number;
    deductible: number;
    originalClaimedAmount: number;
    approvedAmount: number;
    message: string;
    status: CompensationStatus;
    riskScore: number;
    riskLevel: string;
    decisionSuggestion: string;
    scoringDetails: string;
    adjustedAmount: number;
    calculationDate: Date;
    
    // Relations
    claim?: Claim;
}

// Méthode utilitaire
export function calculateClientOutOfPocket(compensation: Compensation): number {
    if (compensation.approvedAmount && compensation.amount) {
        return compensation.approvedAmount - compensation.amount;
    }
    return 0;
}