import { Role } from '../enums/Role';

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    telephone: string;
    role: Role;
    otp?: string;
    otpExpiry?: Date;
}