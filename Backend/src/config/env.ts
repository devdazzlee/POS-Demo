import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL!;
export const REDIS_SERVICE_URI = process.env.DATABASE_URL!;
export const REDIS_HOST = process.env.DATABASE_URL!;
export const REDIS_PORT = process.env.DATABASE_URL!;
export const REDIS_PASSWORD = process.env.DATABASE_URL!;
export const JWT_SECRET = process.env.DATABASE_URL!;
export const JWT_EXPIRES_IN = process.env.DATABASE_URL!;
export const COOKIE_EXPIRES_IN = process.env.COOKIE_EXPIRES_IN!;
export const REDIS_DB = process.env.REDIS_DB!;

export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

export const PORT = process.env.PORT!;
export const NODE_ENV = process.env.PORT!;
export const vAPI = process.env.PORT!;

// Email Configuration
export const EMAIL_USER = process.env.EMAIL_USER!;
export const EMAIL_PASS = process.env.EMAIL_PASS!;
export const EMAIL_HOST = process.env.EMAIL_HOST!;
export const EMAIL_PORT = process.env.EMAIL_PORT!;
