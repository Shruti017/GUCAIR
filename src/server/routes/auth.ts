import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User';
import University from '../models/University';
import RefreshSession from '../models/RefreshSession';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hashToken, signAccess, signRefresh, verifyRefresh } from '../utils/tokens';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../utils/session-cookies';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

function publicUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    university: user.university,
  };
}

async function issueSession(user: any, res: import('express').Response) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(String(user._id));
  await RefreshSession.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_DAYS || 7) * 86_400_000),
  });
  setAuthCookies(res, accessToken, refreshToken);
  return publicUser(user);
}

router.post('/register', async (req, res, next) => {
  try {
    const parsed = credentials.extend({
      password: z.string().min(12).max(128),
      name: z.string().trim().min(2).max(100),
      role: z.enum(['faculty', 'student']).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid registration details', errors: parsed.error.flatten() });

    const email = parsed.data.email.toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      name: parsed.data.name,
      role: parsed.data.role || 'student',
    });
    res.status(201).json({ user: await issueSession(user, res) });
  } catch (error) {
    next(error);
  }
});

router.post('/register-university', async (req, res, next) => {
  try {
    const parsed = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(12).max(128),
      universityName: z.string().trim().min(2).max(180),
      country: z.string().trim().min(2).max(100),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid registration details', errors: parsed.error.flatten() });

    const email = parsed.data.email.toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists' });
    const slug = `${parsed.data.universityName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
    const university = await University.create({
      name: parsed.data.universityName,
      country: parsed.data.country,
      slug,
      status: 'pending',
    });
    try {
      const user = await User.create({
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: 'university_admin',
        university: university._id,
      });
      university.createdBy = user._id;
      await university.save();
      res.status(201).json({ user: await issueSession(user, res) });
    } catch (error) {
      await University.deleteOne({ _id: university._id });
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ user: await issueSession(user, res) });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (typeof token !== 'string') {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired. Sign in again.' });
    }
    let payload: ReturnType<typeof verifyRefresh>;
    try {
      payload = verifyRefresh(token);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired. Sign in again.' });
    }
    if (typeof payload.sub !== 'string') throw new Error('Invalid refresh token subject');
    const session = await RefreshSession.findOneAndDelete({
      user: payload.sub,
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      await RefreshSession.deleteMany({ user: payload.sub });
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired. Sign in again.' });
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Account unavailable' });
    }
    res.json({ user: await issueSession(user, res) });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (typeof token === 'string') {
      try {
        const payload = verifyRefresh(token);
        if (typeof payload.sub === 'string') {
          await RefreshSession.deleteOne({ user: payload.sub, tokenHash: hashToken(token) });
        }
      } catch {
        // Logout remains successful when the refresh token has already expired.
      }
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(12).max(128),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'The new password must contain at least 12 characters.' });

    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();
    await RefreshSession.deleteMany({ user: user._id });
    clearAuthCookies(res);
    res.json({ message: 'Password changed. Sign in again on all devices.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
