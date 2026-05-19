import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiError';

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, `Not Found - ${req.originalUrl}`));
};

export { notFoundHandler };
