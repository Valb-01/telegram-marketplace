import { Router, Response } from 'express';
import { db } from '../db';
import { orders, users, products, categories } from '../db/schema';
import { eq, count, sum, desc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Analytics Dashboard ───────────────────────────────────────────────────────

router.get('/analytics', requireAdmin as any, async (_req: AuthRequest, res: Response) => {
  try {
    const [totalOrders] = await db.select({ count: count() }).from(orders);
    const [paidOrders] = await db.select({ count: count() }).from(orders).where(eq(orders.status, 'paid'));
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalProducts] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));

    const [starRevenue] = await db
      .select({ total: sum(orders.totalStars) })
      .from(orders)
      .where(eq(orders.status, 'paid'));

    const [usdtRevenue] = await db
      .select({ total: sum(orders.totalUsdt) })
      .from(orders)
      .where(eq(orders.status, 'paid'));

    const recentOrders = await db
      .select({ order: orders, user: users })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    const topProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.downloadCount))
      .limit(5);

    res.json({
      stats: {
        totalOrders: totalOrders.count,
        paidOrders: paidOrders.count,
        totalUsers: totalUsers.count,
        totalProducts: totalProducts.count,
        starRevenue: starRevenue.total || 0,
        usdtRevenue: parseFloat(usdtRevenue.total || '0').toFixed(2),
      },
      recentOrders: recentOrders.map(({ order, user }) => ({ ...order, user })),
      topProducts: topProducts.map(p => ({ ...p, fileUrl: undefined })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ── Get All Users ─────────────────────────────────────────────────────────────

router.get('/users', requireAdmin as any, async (_req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
    res.json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
