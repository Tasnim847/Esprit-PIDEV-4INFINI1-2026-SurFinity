import { DocumentStatus } from '../enums/document-status.enum';
import { Client } from './client.model';
import { Claim } from './claim.model';
import { Credit } from './credit.model';
import { AgentAssurance } from './agent-assurance.model';
import { AgentFinance } from './agent-finance.model';

export interface Document {
    documentId: number;
    name: string;
    type: string;
    filePath: string;
    uploadDate: Date;
    status: DocumentStatus;
    client?: Client;
    claim?: Claim;
    credit?: Credit;
    verifiedByAssurance?: AgentAssurance;
    verifiedByFinance?: AgentFinance;
}
