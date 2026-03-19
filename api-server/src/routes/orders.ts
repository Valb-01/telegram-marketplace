import { Router, Response } from 'express';
import { db } from '../db';
import { orders, orderItems, products, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendStarsInvoice } from '../bot';
import { z } from 'zod';

const router = Router();

// ── Create Order + Send Stars Invoice ─────────────────────────────────────────

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).default(1),
  })).min(1),
  paymentMethod: z.enum(['stars', 'usdt_trc20']),
  telegramChatId: z.number().int(), // needed to send invoice via bot
});

router.post('/', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    // Fetch products
    const productIds = parsed.items.map((i) => i.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    // Validate all products exist
    for (const item of parsed.items) {
      if (!productMap.has(item.productId)) {
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }
    }

    // Calculate totals
    let totalStars = 0;
    let totalUsdt = 0;

    for (const item of parsed.items) {
      const product = productMap.get(item.productId)!;
      totalStars += product.priceStars * item.quantity;
      if (product.priceUsdt) {
        totalUsdt += parseFloat(product.priceUsdt) * item.quantity;
      }
    }

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        paymentMethod: parsed.paymentMethod,
        status: 'pending',
        totalStars: parsed.paymentMethod === 'stars' ? totalStars : null,
        totalUsdt: parsed.paymentMethod === 'usdt_trc20' ? totalUsdt.toString() : null,
      })
      .returning();

    // Create order items
    await db.insert(orderItems).values(
      parsed.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceStars: product.priceStars,
          priceUsdt: product.priceUsdt,
        };
      })
    );

    // Handle Stars payment
    if (parsed.paymentMethod === 'stars') {
      const firstProduct = productMap.get(parsed.items[0].productId)!;
      const title = parsed.items.length === 1
        ? firstProduct.name
        : `𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾 Order #${order.id}`;

      const description = parsed.items.length === 1
        ? (firstProduct.shortDescription || firstProduct.name)
        : `${parsed.items.length} items from 𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾`;

      try {
        await sendStarsInvoice({
          chatId: parsed.telegramChatId,
          orderId: order.id,
          title,
          description,
          amount: totalStars,
        });
      } catch (botErr) {
        console.error('[Orders] Failed to send Stars invoice:', botErr);
        // Don't fail the order creation, client can retry
      }

      res.status(201).json({
        orderId: order.id,
        paymentMethod: 'stars',
        totalStars,
        status: 'pending',
        message: 'Invoice sent to your Telegram chat',
      });
    } else {
      // USDT handled by separate endpoint
      res.status(201).json({
        orderId: order.id,
        paymentMethod: 'usdt_trc20',
        totalUsdt,
        status: 'pending',
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ── Get User Orders ───────────────────────────────────────────────────────────

router.get('/my', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    res.json(userOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── Get All Orders (Admin) ────────────────────────────────────────────────────

router.get('/', requireAdmin as any, async (_req: AuthRequest, res: Response) => {
  try {
    const allOrders = await db
      .select({
        order: orders,
        user: users,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    res.json(allOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── Get Single Order ──────────────────────────────────────────────────────────

router.get('/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Only allow admin or order owner
    if (order.userId !== userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const items = await db
      .select({ orderItem: orderItems, product: products })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    res.json({
      ...order,
      items: items.map(({ orderItem, product }) => ({
        ...orderItem,
        product: { ...product, fileUrl: undefined },
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
