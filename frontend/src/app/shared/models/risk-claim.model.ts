import { InsuranceContract } from './insurance-contract.model';

export interface RiskClaim {
    riskId: number;
    riskScore: number;
    riskLevel: string;
    evaluationNote: string;
    contract?: InsuranceContract;
}
