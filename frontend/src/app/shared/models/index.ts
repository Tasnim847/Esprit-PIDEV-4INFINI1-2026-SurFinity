// Enums
export { AccountType } from '../enums/AccountType';
export { ClaimStatus } from '../enums/ClaimStatus';
export { CompensationStatus } from '../enums/CompensationStatus';
export { ContractApprovalStatus } from '../enums/ContractApprovalStatus';
export { ContractStatus } from '../enums/ContractStatus';
export { CreditStatus } from '../enums/CreditStatus';
export { DocumentStatus } from '../enums/DocumentStatus';
export { NewsStatus } from '../enums/NewsStatus';
export { PaymentFrequency } from '../enums/PaymentFrequency';
export { PaymentMethod } from '../enums/PaymentMethod';
export { PaymentStatus } from '../enums/PaymentStatus';
export { ProductStatus } from '../enums/ProductStatus';
export { ProductType } from '../enums/ProductType';
export { RepaymentStatus } from '../enums/RepaymentStatus';
export { Role } from '../enums/Role';
export { TransactionType } from '../enums/TransactionType';

// Models
export type { Account } from './Account';
export type { Admin } from './Admin';
export type { AgentAssurance } from './AgentAssurance';
export type { AgentFinance } from './AgentFinance';
export type { AutoClaimDetails } from './AutoClaimDetails';
export type { Claim } from './Claim';
export type { Client } from './Client';
export type { Compensation } from './Compensation';
export type { Complaint } from './Complaint';
export type { Credit } from './Credit';
export type { Document } from './Document';
export type { HealthClaimDetails } from './HealthClaimDetails';
export type { HomeClaimDetails } from './HomeClaimDetails';
export type { InsuranceContract } from './InsuranceContract';
export type { InsuranceProduct } from './InsuranceProduct';
export type { News } from './News';
export type { Payment } from './Payment';
export type { PaymentReminder } from './PaymentReminder';
export type { Repayment } from './Repayment';
export type { RiskClaim } from './RiskClaim';
export type { Transaction } from './Transaction';
export type { User } from './User';

// Utility functions
export { getClientAge, getClientTenureInDays, getActiveContracts, getTotalPremiums, getApprovedClaims } from './Client';
export { calculateInstallmentAmount } from './InsuranceContract';
export { calculateClientOutOfPocket } from './Compensation';