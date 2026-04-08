import { Account } from './account.model';

export interface Transaction {
    transactionId: number;
    date: Date;
    amount: number;
    type: string;
    account?: Account;
}
