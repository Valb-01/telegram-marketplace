import { Router, Response } from 'express';
import { db } from '../db';
import { orders } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { createUsdtPayment } from '../services/usdtService';
import { z } from 'zod';

const router = Router();

// ── Create USDT Payment ────────────────────────────────────────────────────────

router.post('/usdt/create', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = z.object({ orderId: z.number().int().positive() }).parse(req.body);
    const userId = req.user!.id;

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({ error: 'Order is not pending' });
      return;
    }

    if (order.paymentMethod !== 'usdt_trc20') {
      res.status(400).json({ error: 'Order is not a USDT payment' });
      return;
    }

    if (!order.totalUsdt) {
      res.status(400).json({ error: 'Order has no USDT amount' });
      return;
    }

    const paymentInfo = await createUsdtPayment(orderId, parseFloat(order.totalUsdt));

    res.json({
      orderId,
      walletAddress: paymentInfo.walletAddress,
      expectedAmount: paymentInfo.expectedAmount,
      currency: 'USDT TRC20',
      expiresAt: paymentInfo.expiresAt,
      network: 'TRON (TRC20)',
      memo: `Order #${orderId}`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create USDT payment' });
  }
});

// ── Check Payment Status ──────────────────────────────────────────────────────

router.get('/status/:orderId', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const userId = req.user!.id;

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      fileDelivered: order.fileDelivered,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
