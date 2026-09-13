import type { CookieOptions, Request, Response } from 'express';
import { loadEnv } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import { asyncHandler } from '../../middleware/error';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

const env = loadEnv();

const REFRESH_COOKIE = 'refresh_token';

function parseTTLMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) throw new Error(`invalid ttl: ${s}`);
  const n = Number(m[1]);
  const unit = m[2] ?? '';
  const mul: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * (mul[unit] ?? 0);
}

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: parseTTLMs(env.REFRESH_TOKEN_TTL),
  });
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> })
    .cookies;
  return cookies?.[REFRESH_COOKIE];
}

export const registerController = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const { refreshToken, accessToken, user } = await authService.register(input);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});

export const loginController = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { refreshToken, accessToken, user } = await authService.login(input);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const refreshController = asyncHandler(async (req, res) => {
  const token = readRefreshCookie(req);
  if (!token) throw new UnauthorizedError('missing refresh cookie');
  const { refreshToken, accessToken, user } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const logoutController = asyncHandler(async (req, res) => {
  const token = readRefreshCookie(req);
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS);
  res.status(204).end();
});
