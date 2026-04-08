import { AccountType } from './enums/AccountType';
import { Client } from './Client';
import { Transaction } from './Transaction';

export interface Account {
    accountId: number;
    balance: number;
    type: AccountType;
    status: string;
    dailyLimit: number;
    monthlyLimit: number;
    
    // Relations
    client?: Client;
    transactions?: Transaction[];
}