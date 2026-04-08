import { PaymentMethod } from '../enums/PaymentMethod';
import { PaymentStatus } from '../enums/PaymentStatus';
import { InsuranceContract } from './InsuranceContract';

export interface Payment {
    paymentId: number;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    contract?: InsuranceContract;
}