"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = [];
    if (err instanceof apiError_1.AppError) {
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
        const prismaErr = err;
        if (prismaErr.code === 'P2002') {
            const target = prismaErr.meta?.target;
            message = 'Unique constraint failed';
            errors = [{
                    message: `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`,
                    code: prismaErr.code,
                }];
        }
        else {
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
        logger_1.logger.error(err.stack);
    }
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map