import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import { getBot } from './bot';

export function createApp() {
  const app = express();

  // ── Security ─────────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || '']
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // ── Body Parsing ──────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Static Uploads (thumbnails only — no digital files exposed) ───────────────
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  [uploadsDir, thumbnailsDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Only expose thumbnails, NOT root uploads (which contain digital files)
  app.use('/uploads/thumbnails', express.static(thumbnailsDir));

  // ── Routes ─────────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);

  // ── Health Check ──────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: '7snawi-store-api', timestamp: new Date().toISOString() });
  });

  // ── Telegram Webhook (production) ─────────────────────────────────────────────
  // node-telegram-bot-api registers this automatically in webHook mode,
  // but we expose a manual route so Express handles it before 404.
  app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    try {
      const bot = getBot();
      bot.processUpdate(req.body);
      res.sendStatus(200);
    } catch {
      res.sendStatus(200); // always 200 to Telegram
    }
  });

  // ── 404 ───────────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ── Error Handler ─────────────────────────────────────────────────────────────
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[App] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
