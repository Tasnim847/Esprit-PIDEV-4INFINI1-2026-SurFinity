import { InsuranceContract } from './InsuranceContract';

export interface RiskClaim {
    riskId: number;
    riskScore: number;
    riskLevel: string;
    evaluationNote: string;
    contract?: InsuranceContract;
}