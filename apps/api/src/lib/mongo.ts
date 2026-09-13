import mongoose from 'mongoose';
import { loadEnv } from '../config/env';
import { logger } from './logger';

const env = loadEnv();

export async function connectMongo(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('mongo connected'));
  mongoose.connection.on('disconnected', () =>
    logger.warn('mongo disconnected'),
  );
  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongo error'));

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function mongoStatus(): 'connected' | 'connecting' | 'disconnected' {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}
