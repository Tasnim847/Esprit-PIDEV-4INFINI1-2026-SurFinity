import { User } from './user.model';

export interface Complaint {
    id: number;
    status: string;
    message: string;
    claimDate: Date;
    resolutionDate: Date;
    phone: string;
    client?: User;
    agentAssurance?: User;
    agentFinance?: User;
}
