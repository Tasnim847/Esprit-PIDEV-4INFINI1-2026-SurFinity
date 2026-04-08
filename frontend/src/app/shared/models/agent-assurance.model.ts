import { User } from './user.model';
import { InsuranceContract } from './insurance-contract.model';
import { Client } from './client.model';
import { Complaint } from './complaint.model';

export interface AgentAssurance extends User {
    contracts?: InsuranceContract[];
    clients?: Client[];
    complaints?: Complaint[];
}
