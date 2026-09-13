import { RateLimiterRedis } from 'rate-limiter-flexible';
import type { Request, RequestHandler } from 'express';
import { redis } from '../../infra/redis';
import { TooManyRequestsError } from '../../lib/errors';

interface Rule {
  points: number;
  duration: number;
}

function makeLimiter(keyPrefix: string, rule: Rule): RateLimiterRedis {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points: rule.points,
    duration: rule.duration,
    blockDuration: rule.duration,
  });
}

const limiters = {
  registerByIp: makeLimiter('rl:register:ip', { points: 5, duration: 3600 }),
  loginByIp: makeLimiter('rl:login:ip', { points: 5, duration: 900 }),
  loginByEmail: makeLimiter('rl:login:email', { points: 5, duration: 900 }),
  refreshByJti: makeLimiter('rl:refresh:jti', { points: 30, duration: 3600 }),
};

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    const first = fwd.split(',')[0];
    if (first) return first.trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

async function consume(limiter: RateLimiterRedis, key: string): Promise<void> {
  try {
    await limiter.consume(key);
  } catch {
    throw new TooManyRequestsError();
  }
}

export const registerRateLimit: RequestHandler = async (req, _res, next) => {
  try {
    await consume(limiters.registerByIp, clientIp(req));
    next();
  } catch (err) {
    next(err);
  }
};

export const loginRateLimit: RequestHandler = async (req, _res, next) => {
  try {
    const body = (req.body as { email?: string } | undefined) ?? {};
    const email = body.email?.toLowerCase();
    const ip = clientIp(req);
    const promises = [consume(limiters.loginByIp, ip)];
    if (email) {
      promises.push(consume(limiters.loginByEmail, email));
    }
    await Promise.all(promises);
    next();
  } catch (err) {
    next(err);
  }
};

export async function consumeRefresh(jti: string): Promise<void> {
  await consume(limiters.refreshByJti, jti);
}
