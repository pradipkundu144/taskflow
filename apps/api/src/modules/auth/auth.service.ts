import type {
  AuthUser,
  LoginResponse,
  RefreshResponse,
} from '@taskflow/shared';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../lib/errors';
import type { UserDoc } from '../users/user.model';
import * as userRepo from '../users/user.repository';
import {
  newFamily,
  newJti,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessPayload,
} from './jwt';
import { hashPassword, isBlocklisted, verifyPassword } from './password';
import { consumeRefresh } from './rate-limit';
import {
  deleteRefresh,
  isFamilyRevoked,
  readRefresh,
  revokeFamily,
  storeRefresh,
  verifyTokenHash,
} from './refresh-store';
import type { LoginInput, RegisterInput } from './auth.schema';

export interface AuthResult extends LoginResponse {
  refreshToken: string;
}

export interface RefreshResult extends RefreshResponse {
  refreshToken: string;
}

function toAuthUser(u: UserDoc): AuthUser {
  return {
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    role: u.role,
    manager: u.manager?.toString(),
    teamLead: u.teamLead?.toString(),
  };
}

function accessPayloadFor(u: UserDoc): AccessPayload {
  return {
    sub: u._id.toString(),
    role: u.role,
    manager: u.manager?.toString(),
    teamLead: u.teamLead?.toString(),
  };
}

async function issueTokens(user: UserDoc, family: string): Promise<AuthResult> {
  const jti = newJti();
  const accessToken = signAccessToken(accessPayloadFor(user));
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    jti,
    family,
  });
  await storeRefresh(user._id.toString(), jti, family, refreshToken);
  return { accessToken, refreshToken, user: toAuthUser(user) };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (isBlocklisted(input.password)) {
    throw new BadRequestError('password is on the blocklist');
  }

  const [existingEmail, existingUsername] = await Promise.all([
    userRepo.findByEmail(input.email),
    userRepo.findByUsername(input.username),
  ]);
  if (existingEmail) throw new ConflictError('email taken');
  if (existingUsername) throw new ConflictError('username taken');

  const passwordHash = await hashPassword(input.password);
  const user = await userRepo.create({
    username: input.username,
    email: input.email,
    passwordHash,
    role: input.role,
  });
  return issueTokens(user, newFamily());
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepo.findByEmail(input.email);
  if (!user) throw new UnauthorizedError('invalid credentials');
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('invalid credentials');
  return issueTokens(user, newFamily());
}

export async function refresh(rawToken: string): Promise<RefreshResult> {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new UnauthorizedError('invalid refresh token');
  }

  await consumeRefresh(payload.jti);

  if (await isFamilyRevoked(payload.family)) {
    throw new UnauthorizedError('refresh token family revoked');
  }

  const record = await readRefresh(payload.jti);
  if (!record) {
    await revokeFamily(payload.family);
    throw new UnauthorizedError('refresh token reused');
  }
  if (!verifyTokenHash(rawToken, record.tokenHash)) {
    await revokeFamily(payload.family);
    throw new UnauthorizedError('refresh token mismatch');
  }

  await deleteRefresh(payload.jti);

  const user = await userRepo.findById(payload.sub);
  if (!user) throw new UnauthorizedError('user not found');

  const nextJti = newJti();
  const accessToken = signAccessToken(accessPayloadFor(user));
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    jti: nextJti,
    family: payload.family,
  });
  await storeRefresh(user._id.toString(), nextJti, payload.family, refreshToken);
  return { accessToken, refreshToken };
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  try {
    const payload = verifyRefreshToken(rawToken);
    await deleteRefresh(payload.jti);
  } catch {
    return;
  }
}
