import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { AppError } from '../utils/apiError';
import { Customer } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      customer: {
        id: string;
        email: string;
      };
    }
  }
}

// Pure JWT — no Redis session lookup. The earlier implementation rejected
// any request when the Redis key was missing, which is the single biggest
// source of "Session expired" complaints (Redis evictions, restarts, TTL).
const authenticateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required. Please provide a valid token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: Customer['id'];
      email: Customer['email'];
    };

    if (!decoded.id || !decoded.email) {
      throw new AppError(401, 'Invalid token structure');
    }

    req.customer = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Invalid token'));
    }
    next(error);
  }
};

export { authenticateCustomer };
