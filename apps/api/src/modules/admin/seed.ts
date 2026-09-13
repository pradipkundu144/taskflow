import { loadEnv } from '../../config/env';
import { logger } from '../../lib/logger';
import { hashPassword } from '../auth/password';
import * as userRepo from '../users/user.repository';

export async function seedAdmin(): Promise<void> {
  const env = loadEnv();
  const existing = await userRepo.findByEmail(env.ADMIN_EMAIL);
  if (existing) {
    logger.info({ email: env.ADMIN_EMAIL }, 'admin already present');
    return;
  }
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await userRepo.create({
    username: env.ADMIN_USERNAME,
    email: env.ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });
  logger.info({ email: env.ADMIN_EMAIL }, 'admin seeded');
}
