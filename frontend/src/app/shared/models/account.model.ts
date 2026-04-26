import { AccountType } from '../enums/account-type.enum';
import { Client } from './client.model';
import { Transaction } from './transaction.model';

export interface Account {
    accountId: number;
    balance: number;
    type: AccountType;
    status: string;
    dailyLimit: number;
    monthlyLimit: number;
    rip: string;
    dailyTransferLimit: number;
    createdAt: string;
    updatedAt: string;
    client?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    transactions?: Transaction[];
}
