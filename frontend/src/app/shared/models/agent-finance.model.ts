import { User } from './user.model';
import { Client } from './client.model';
import { Credit } from './credit.model';
import { Complaint } from './complaint.model';

export interface AgentFinance extends User {
    clients?: Client[];
    credits?: Credit[];
    complaints?: Complaint[];
}
