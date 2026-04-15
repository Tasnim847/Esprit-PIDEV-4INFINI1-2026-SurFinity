import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { InsuranceContract } from './insurance-contract.model';

export interface Payment {
    paymentId: number;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    contract?: InsuranceContract;
}
