import { ClaimStatus } from '../enums/ClaimStatus';
import { Client } from './Client';
import { InsuranceContract } from './InsuranceContract';
import { Compensation } from './Compensation';
import { Document } from './Document';
import { AutoClaimDetails } from './AutoClaimDetails';
import { HealthClaimDetails } from './HealthClaimDetails';
import { HomeClaimDetails } from './HomeClaimDetails';

export interface Claim {
    claimId: number;
    claimDate: Date;
    claimedAmount: number;
    approvedAmount: number;
    description: string;
    status: ClaimStatus;
    fraud: boolean;
    message?: string;
    
    // Relations
    client?: Client;
    contract?: InsuranceContract;
    compensation?: Compensation;
    documents?: Document[];
    autoDetails?: AutoClaimDetails;
    healthDetails?: HealthClaimDetails;
    homeDetails?: HomeClaimDetails;
}