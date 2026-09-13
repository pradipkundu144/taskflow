import { createHash } from 'node:crypto';
import { loadEnv } from '../../config/env';
import { redis } from '../../infra/redis';

const env = loadEnv();

function parseTTLSeconds(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) throw new Error(`invalid ttl: ${s}`);
  const n = Number(m[1]);
  const unit = m[2] ?? '';
  const mul: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (mul[unit] ?? 0);
}

const REFRESH_TTL_SECONDS = parseTTLSeconds(env.REFRESH_TOKEN_TTL);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function tokenKey(jti: string): string {
  return `refresh:${jti}`;
}

function familyKey(family: string): string {
  return `refresh:family:${family}:revoked`;
}

export interface RefreshRecord {
  userId: string;
  family: string;
  tokenHash: string;
}

export async function storeRefresh(
  userId: string,
  jti: string,
  family: string,
  rawToken: string,
): Promise<void> {
  const key = tokenKey(jti);
  await redis
    .multi()
    .hset(key, { userId, family, tokenHash: hashToken(rawToken) })
    .expire(key, REFRESH_TTL_SECONDS)
    .exec();
}

export async function readRefresh(jti: string): Promise<RefreshRecord | null> {
  const record = await redis.hgetall(tokenKey(jti));
  const { userId, family, tokenHash } = record ?? {};
  if (!userId || !family || !tokenHash) return null;
  return { userId, family, tokenHash };
}

export async function deleteRefresh(jti: string): Promise<void> {
  await redis.del(tokenKey(jti));
}

export async function revokeFamily(family: string): Promise<void> {
  await redis.set(familyKey(family), '1', 'EX', REFRESH_TTL_SECONDS);
}

export async function isFamilyRevoked(family: string): Promise<boolean> {
  const val = await redis.get(familyKey(family));
  return val !== null;
}

export function verifyTokenHash(rawToken: string, storedHash: string): boolean {
  return hashToken(rawToken) === storedHash;
}
