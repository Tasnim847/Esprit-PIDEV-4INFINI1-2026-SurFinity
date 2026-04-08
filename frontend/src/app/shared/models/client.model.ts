import { User } from './user.model';
import { AgentAssurance } from './agent-assurance.model';
import { AgentFinance } from './agent-finance.model';
import { Account } from './account.model';
import { Credit } from './credit.model';
import { InsuranceContract } from './insurance-contract.model';
import { Complaint } from './complaint.model';
import { Document } from './document.model';
import { Claim } from './claim.model';

export interface Client extends User {
    dateOfBirth?: Date;
    profession?: string;
    employmentStatus?: string;
    annualIncome?: number;
    maritalStatus?: string;
    numberOfDependents?: number;
    educationLevel?: string;
    housingStatus?: string;
    createdAt?: Date;
    lastActivityDate?: Date;
    currentRiskScore?: number;
    currentRiskLevel?: string;
    lastScoringDate?: Date;
    agentAssurance?: AgentAssurance;
    agentFinance?: AgentFinance;
    accounts?: Account[];
    credits?: Credit[];
    contracts?: InsuranceContract[];
    complaints?: Complaint[];
    documents?: Document[];
    claims?: Claim[];
}
