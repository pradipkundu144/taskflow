import { Redis } from 'ioredis';
import { loadEnv } from '../config/env';
import { logger } from './logger';

const env = loadEnv();

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('redis connected'));
redis.on('close', () => logger.warn('redis disconnected'));
redis.on('error', (err) => logger.error({ err }, 'redis error'));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export async function redisStatus(): Promise<'ready' | 'disconnected'> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG' ? 'ready' : 'disconnected';
  } catch {
    return 'disconnected';
  }
}
