import { PaymentMethod } from '../enums/payment-method.enum';
import { RepaymentStatus } from '../enums/repayment-status.enum';
import { Credit } from './credit.model';
import { Client } from './client.model';

export interface Repayment {
    repaymentId: number;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    reference: string;
    status: RepaymentStatus;
    credit?: Credit;
    client?: Client;
}
