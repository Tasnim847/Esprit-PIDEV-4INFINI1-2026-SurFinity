import { Claim } from './Claim';

export interface AutoClaimDetails {
    id: number;
    driverA: string;
    driverB: string;
    vehicleA: string;
    vehicleB: string;
    accidentLocation: string;
    accidentDate: Date;
    claim?: Claim;
}