import { ContractStatus } from './enums/ContractStatus';
import { PaymentFrequency } from './enums/PaymentFrequency';
import { Client } from './Client';
import { InsuranceProduct } from './InsuranceProduct';
import { AgentAssurance } from './AgentAssurance';
import { RiskClaim } from './RiskClaim';
import { Claim } from './Claim';
import { Payment } from './Payment';

export interface InsuranceContract {
    contractId: number;
    startDate: Date;
    endDate: Date;
    premium: number;
    deductible: number;
    coverageLimit: number;
    totalPaid: number;
    remainingAmount: number;
    contractDurationYears: number;
    status: ContractStatus;
    paymentFrequency: PaymentFrequency;
    
    // Relations
    riskClaim?: RiskClaim;
    client?: Client;
    product?: InsuranceProduct;
    agentAssurance?: AgentAssurance;
    claims?: Claim[];
    payments?: Payment[];
}

// Méthode utilitaire
export function calculateInstallmentAmount(contract: InsuranceContract): number {
    if (!contract.paymentFrequency) return contract.premium;
    
    let numberOfPayments = 1;
    switch (contract.paymentFrequency) {
        case 'MONTHLY':
            numberOfPayments = 12;
            break;
        case 'SEMI_ANNUAL':
            numberOfPayments = 2;
            break;
        case 'ANNUAL':
            numberOfPayments = contract.contractDurationYears || 1;
            break;
    }
    return contract.premium / numberOfPayments;
}