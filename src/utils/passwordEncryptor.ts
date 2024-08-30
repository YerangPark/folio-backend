import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(password: string | undefined): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}
