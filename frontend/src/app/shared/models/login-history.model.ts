import { User } from './user.model';

export interface LoginHistory {
    id: number;
    user?: User;
    loginTime: Date;
    ipAddress?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}
