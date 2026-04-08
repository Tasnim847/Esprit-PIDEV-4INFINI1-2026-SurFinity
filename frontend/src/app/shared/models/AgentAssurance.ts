import { User } from './User';
import { InsuranceContract } from './InsuranceContract';
import { Client } from './Client';
import { Complaint } from './Complaint';

export interface AgentAssurance extends User {
    contracts?: InsuranceContract[];
    clients?: Client[];
    complaints?: Complaint[];
}