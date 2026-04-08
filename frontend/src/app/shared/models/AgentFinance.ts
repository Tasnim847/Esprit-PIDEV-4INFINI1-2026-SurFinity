import { User } from './User';
import { Client } from './Client';
import { Credit } from './Credit';
import { Complaint } from './Complaint';

export interface AgentFinance extends User {
    clients?: Client[];
    credits?: Credit[];
    complaints?: Complaint[];
}