import { User } from './User';
import { AgentAssurance } from './AgentAssurance';
import { AgentFinance } from './AgentFinance';
import { Account } from './Account';
import { Credit } from './Credit';
import { InsuranceContract } from './InsuranceContract';
import { Complaint } from './Complaint';
import { Document } from './Document';
import { Claim } from './Claim';
import { ContractStatus } from '../enums/ContractStatus';
import { ClaimStatus } from '../enums/ClaimStatus';

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
    
    // Relations
    agentAssurance?: AgentAssurance;
    agentFinance?: AgentFinance;
    accounts?: Account[];
    credits?: Credit[];
    contracts?: InsuranceContract[];
    complaints?: Complaint[];
    documents?: Document[];
    claims?: Claim[];
}

// Méthodes utilitaires (à implémenter dans un service)
export function getClientAge(client: Client): number {
    if (!client.dateOfBirth) return 40;
    const diff = new Date().getTime() - new Date(client.dateOfBirth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
}

export function getClientTenureInDays(client: Client): number {
    if (!client.createdAt) return 0;
    const diff = new Date().getTime() - new Date(client.createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getActiveContracts(client: Client): InsuranceContract[] {
    return client.contracts?.filter(c => c.status === ContractStatus.ACTIVE) || [];
}

export function getTotalPremiums(client: Client): number {
    return client.contracts?.reduce((sum, c) => sum + (c.premium || 0), 0) || 0;
}

export function getApprovedClaims(client: Client): number {
    return client.claims?.filter(c => c.status === ClaimStatus.APPROVED).length || 0;
}