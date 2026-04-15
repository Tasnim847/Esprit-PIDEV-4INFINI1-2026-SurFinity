import { CategoryRiskDTO } from "./category-risk.dto";
import { RiskFactorDTO } from "./risk-factor.dto";


export interface RiskEvaluationDTO {
    contractId?: number;
    contractReference?: string;
    clientName?: string;
    agentName?: string;
    evaluationDate?: string;
    globalRiskScore?: number;
    globalRiskLevel?: string;
    globalRiskClass?: string;
    recommendation?: string;
    autoReject?: boolean;
    categories?: Map<string, CategoryRiskDTO> | { [key: string]: CategoryRiskDTO };
    riskFactors?: RiskFactorDTO[];
    positivePoints?: string[];
    recommendedActions?: string[];
    detailedReport?: string;
}