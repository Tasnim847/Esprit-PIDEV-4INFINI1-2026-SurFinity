import { Claim } from './Claim';

export interface HealthClaimDetails {
    id: number;
    patientName: string;
    hospitalName: string;
    doctorName: string;
    medicalCost: number;
    illnessType: string;
    claim?: Claim;
}