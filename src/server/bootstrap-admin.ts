import dotenv from 'dotenv';
import path from 'node:path';
import { existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db';
import User from './models/User';

const envFile = ['.env.local', '.env'].map((file) => path.resolve(process.cwd(), file)).find(existsSync);
if (envFile) dotenv.config({ path: envFile });

async function main() {
  const uri = process.env.MONGODB_URI || '';
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';

  if (!uri.startsWith('mongodb+srv://')) {
    throw new Error('The bootstrap script accepts MongoDB Atlas URIs only (mongodb+srv://).');
  }
  if (!name || name.length < 2 || name.length > 100) {
    throw new Error('Set BOOTSTRAP_ADMIN_NAME to a name between 2 and 100 characters.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL to a valid email address.');
  }
  if (password.length < 16 || password.length > 128) {
    throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD to a unique password between 16 and 128 characters.');
  }

  await connectDatabase(uri);
  try {
    if (await User.exists({ role: 'super_admin' })) {
      throw new Error('A super administrator already exists. Bootstrap is one-time only.');
    }
    if (await User.exists({ email })) {
      throw new Error('An account with BOOTSTRAP_ADMIN_EMAIL already exists.');
    }
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'super_admin',
      university: null,
      isActive: true,
    });
    console.log(`Created initial super administrator: ${user.email}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Super administrator bootstrap failed.');
  process.exitCode = 1;
});
