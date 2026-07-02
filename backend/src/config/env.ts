import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getPort = (): number => {
  const port = parseInt(process.env.PORT || '5002', 10);
  return Number.isNaN(port) ? 5000 : port;
};

const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = value ? parseInt(value, 10) : fallback;
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  port: getPort(),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: getNumber(process.env.EMAIL_PORT, 587),
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'Society Maintenance <noreply@society.com>',
  overdueThresholdDays: getNumber(process.env.OVERDUE_THRESHOLD_DAYS, 7),
};

export default env;
