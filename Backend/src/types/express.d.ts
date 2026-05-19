import { IUser } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Omit<IUser, 'password'>; 
    }
  }
}
