import { User } from './User';

export interface Complaint {
    id: number;
    status: string;
    message: string;
    claimDate: Date;
    resolutionDate: Date;
    phone: string;
    
    // Relations
    client?: User;
    agentAssurance?: User;
    agentFinance?: User;
}