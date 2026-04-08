import { Account } from './Account';

export interface Transaction {
    transactionId: number;
    date: Date;
    amount: number;
    type: string;
    account?: Account;
}