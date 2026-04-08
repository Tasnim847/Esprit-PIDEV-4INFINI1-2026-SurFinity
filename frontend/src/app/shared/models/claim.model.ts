import { ClaimStatus } from '../enums/claim-status.enum';
import { Client } from './client.model';
import { InsuranceContract } from './insurance-contract.model';
import { Compensation } from './compensation.model';
import { Document } from './document.model';
import { AutoClaimDetails } from './auto-claim-details.model';
import { HealthClaimDetails } from './health-claim-details.model';
import { HomeClaimDetails } from './home-claim-details.model';

export interface Claim {
    claimId: number;
    claimDate: Date;
    claimedAmount: number;
    approvedAmount: number;
    description: string;
    status: ClaimStatus;
    fraud: boolean;
    message?: string;
    client?: Client;
    contract?: InsuranceContract;
    compensation?: Compensation;
    documents?: Document[];
    autoDetails?: AutoClaimDetails;
    healthDetails?: HealthClaimDetails;
    homeDetails?: HomeClaimDetails;
}
