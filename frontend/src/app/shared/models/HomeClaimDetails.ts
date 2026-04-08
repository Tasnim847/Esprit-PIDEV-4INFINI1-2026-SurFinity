import { Claim } from './Claim';

export interface HomeClaimDetails {
    id: number;
    damageType: string;
    address: string;
    estimatedLoss: number;
    claim?: Claim;
}