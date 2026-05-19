import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { AppError } from '../utils/apiError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        branch_id?: string;
      };
    }
  }
}

// Pure JWT auth — no server-side session store. The signed token is the
// session. Tokens are issued without expiry (see auth.service.ts), so a user
// stays logged in until they explicitly clear the token on the client.
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      role: string;
      branch_id?: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Invalid token');
    }
    next(error);
  }
};

const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Unauthorized access');
    }
    next();
  };
};

export { authenticate, authorize };
