import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { Role } from '@taskflow/shared';
import { loadEnv } from '../../config/env';

const env = loadEnv();

export interface AccessPayload {
  sub: string;
  role: Role;
  teamLead?: string;
  manager?: string;
}

export interface RefreshPayload {
  sub: string;
  jti: string;
  family: string;
}

const accessOpts: SignOptions = {
  expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
};

const refreshOpts: SignOptions = {
  expiresIn: env.REFRESH_TOKEN_TTL as SignOptions['expiresIn'],
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOpts);
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOpts);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('unexpected token shape');
  }
  return decoded as unknown as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('unexpected token shape');
  }
  return decoded as unknown as RefreshPayload;
}

export function newJti(): string {
  return randomUUID();
}

export function newFamily(): string {
  return randomUUID();
}
