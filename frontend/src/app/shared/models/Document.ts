import { DocumentStatus } from '../enums/DocumentStatus';
import { Client } from './Client';
import { Claim } from './Claim';
import { Credit } from './Credit';
import { AgentAssurance } from './AgentAssurance';
import { AgentFinance } from './AgentFinance';

export interface Document {
    documentId: number;
    name: string;
    type: string;
    filePath: string;
    uploadDate: Date;
    status: DocumentStatus;
    
    // Relations
    client?: Client;
    claim?: Claim;
    credit?: Credit;
    verifiedByAssurance?: AgentAssurance;
    verifiedByFinance?: AgentFinance;
}