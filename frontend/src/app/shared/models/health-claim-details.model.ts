import { Claim } from './claim.model';

export interface HealthClaimDetails {
    id: number;
    patientName: string;
    hospitalName: string;
    doctorName: string;
    medicalCost: number;
    illnessType: string;
    claim?: Claim;
}
