import { PaymentMethod } from './enums/PaymentMethod';
import { RepaymentStatus } from './enums/RepaymentStatus';
import { Credit } from './Credit';

export interface Repayment {
    repaymentId: number;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    reference: string;
    status: RepaymentStatus;
    credit?: Credit;
}