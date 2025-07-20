// types/express/index.d.ts
import { User } from '../../models/user'; // Adjust path to your User model

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export interface UserPayload {
    id: number;
    email?: string;
    role?: string;
}
