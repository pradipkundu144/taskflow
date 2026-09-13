import pino from 'pino';
import { loadEnv } from '../config/env';

const env = loadEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { pid: process.pid },
  timestamp: pino.stdTimeFunctions.isoTime,
});
