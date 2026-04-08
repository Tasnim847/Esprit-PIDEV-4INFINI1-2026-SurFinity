import { Claim } from './claim.model';

export interface HomeClaimDetails {
    id: number;
    damageType: string;
    address: string;
    estimatedLoss: number;
    claim?: Claim;
}
