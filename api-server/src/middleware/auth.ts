import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    telegramId: string;
    isAdmin: boolean;
  };
}

// ── Validate Telegram WebApp InitData ─────────────────────────────────────────

export function validateTelegramWebAppData(initData: string): Record<string, string> | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) return null;

    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  } catch {
    return null;
  }
}

// ── JWT Auth Middleware ───────────────────────────────────────────────────────

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      telegramId: string;
      isAdmin: boolean;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Admin Auth Middleware ─────────────────────────────────────────────────────

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Forbidden: Admins only' });
      return;
    }
    next();
  });
}

// ── Telegram Login Route Helper ───────────────────────────────────────────────

export async function telegramAuth(req: Request, res: Response): Promise<void> {
  const { initData } = req.body;

  if (!initData) {
    res.status(400).json({ error: 'initData is required' });
    return;
  }

  const data = validateTelegramWebAppData(initData);
  if (!data) {
    res.status(401).json({ error: 'Invalid Telegram WebApp data' });
    return;
  }

  const userJson = data['user'];
  if (!userJson) {
    res.status(400).json({ error: 'No user data in initData' });
    return;
  }

  const telegramUser = JSON.parse(userJson) as {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };

  const telegramId = telegramUser.id.toString();
  const adminId = process.env.ADMIN_TELEGRAM_ID;

  // Upsert user
  const [user] = await db
    .insert(users)
    .values({
      telegramId,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      isAdmin: telegramId === adminId,
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        updatedAt: new Date(),
      },
    })
    .returning();

  const token = jwt.sign(
    { id: user.id, telegramId: user.telegramId, isAdmin: user.isAdmin },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
}
