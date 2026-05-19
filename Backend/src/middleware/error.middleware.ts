import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/apiError';
import { logger } from '../utils/logger';

const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errors = [{ message: err.message }];
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;

    if (prismaErr.code === 'P2002') {
      const target = (prismaErr.meta as any)?.target;
      message = 'Unique constraint failed';
      errors = [{
        message: `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`,
        code: prismaErr.code,
      }];
    } else {
      message = 'Database request error';
      errors = [{
        message: prismaErr.message,
        code: prismaErr.code,
      }];
    }

    statusCode = 400;
  }

  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid database query';
    errors = [{ message: err.message }];
  }

  if (err.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Database connection failed';
    errors = [{ message: err.message }];
  }

  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export { errorHandler };
