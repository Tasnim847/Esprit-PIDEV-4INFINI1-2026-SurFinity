import { CreditStatus } from './enums/CreditStatus';
import { Client } from './Client';
import { AgentFinance } from './AgentFinance';
import { Admin } from './Admin';
import { Repayment } from './Repayment';

export interface Credit {
    creditId: number;
    amount: number;
    interestRate: number;
    monthlyPayment: number;
    durationInMonths: number;
    startDate: Date;
    endDate: Date;
    status: CreditStatus;
    dueDate?: Date;
    
    // Relations
    client?: Client;
    agentFinance?: AgentFinance;
    admin?: Admin;
    repayments?: Repayment[];
}