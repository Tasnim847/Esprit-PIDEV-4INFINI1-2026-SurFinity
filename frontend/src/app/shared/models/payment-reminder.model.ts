import { Payment } from './payment.model';

export interface PaymentReminder {
    id: number;
    sentDate: Date;
    daysBefore: number;
    sent: boolean;
    emailStatus: string;
    payment?: Payment;
}
