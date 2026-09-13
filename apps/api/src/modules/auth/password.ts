import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

const BLOCKLIST = new Set([
  'password12345',
  'password1234',
  '123456789012',
  '1234567890123',
  'qwertyuiop12',
  'qwerty1234567',
  'letmein12345',
  'welcome12345',
  'iloveyou1234',
  'admin1234567',
  'passwordpassword',
  'p@ssword1234',
  'p@ssw0rd1234',
  'trustno112345',
  'superman1234',
]);

export function isBlocklisted(pw: string): boolean {
  return BLOCKLIST.has(pw.toLowerCase());
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_COST);
}

export async function verifyPassword(
  pw: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
