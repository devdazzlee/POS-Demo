import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  port: number;
  env: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieExpiresIn: number;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000'),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieExpiresIn: parseInt(process.env.COOKIE_EXPIRES_IN || '86400000'),
};

export { config };
