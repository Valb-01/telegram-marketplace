import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { orders, users, orderItems, products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

let bot: TelegramBot;

export function getBot(): TelegramBot {
  if (!bot) {
    throw new Error('Bot not initialized');
  }
  return bot;
}

export async function initBot(): Promise<TelegramBot> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  bot = new TelegramBot(token, {
    polling: !isProduction,
    webHook: isProduction ? { port: parseInt(process.env.PORT || '3001') } : undefined,
  });

  if (isProduction && webhookUrl) {
    await bot.setWebHook(`${webhookUrl}/bot${token}`);
    console.log(`[Bot] Webhook set to ${webhookUrl}/bot${token}`);
  } else {
    console.log('[Bot] Polling mode active');
  }

  registerCommands();
  registerHandlers();

  console.log('[Bot] Initialized successfully');
  return bot;
}

function registerCommands(): void {
  const b = getBot();

  // ── /start ──────────────────────────────────────────────────────────────────
  b.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await upsertUser(msg);

    const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/your_bot/app';

    await b.sendMessage(
      chatId,
      `🌊 Welcome to *𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾* 💎\n\nYour premium digital marketplace for exclusive digital products.\n\n✨ *Browse* thousands of digital items\n⭐ *Pay* with Telegram Stars\n💎 *Get* instant delivery\n\nReady to explore?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛍 Browse Products',
                web_app: { url: miniAppUrl },
              },
            ],
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' },
              { text: '📞 Support', url: 'https://t.me/xri3bot' },
            ],
          ],
        },
      }
    );
  });

  // ── /shop ───────────────────────────────────────────────────────────────────
  b.onText(/\/shop/, async (msg) => {
    const chatId = msg.chat.id;
    const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/your_bot/app';

    await b.sendMessage(chatId, '🛍 Open *𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾* and explore our collection:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌊 Open Store', web_app: { url: miniAppUrl } }],
        ],
      },
    });
  });

  // ── /support ─────────────────────────────────────────────────────────────────
  b.onText(/\/support/, async (msg) => {
    const chatId = msg.chat.id;
    await b.sendMessage(
      chatId,
      `📞 *Support*\n\nNeed help? Contact our support team:\n\n👤 [@xri3bot](https://t.me/xri3bot)\n\n_We typically respond within 24 hours._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📬 Contact Support', url: 'https://t.me/xri3bot' }],
          ],
        },
      }
    );
  });
}

function registerHandlers(): void {
  const b = getBot();

  // ── Callback Queries ─────────────────────────────────────────────────────────
  b.on('callback_query', async (query) => {
    if (!query.message) return;
    const chatId = query.message.chat.id;
    const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/your_bot/app';

    if (query.data === 'main_menu') {
      await b.answerCallbackQuery(query.id);
      await b.sendMessage(
        chatId,
        `🏠 *Main Menu*\n\nWhat would you like to do?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍 Browse Products', web_app: { url: miniAppUrl } }],
              [{ text: '📞 Support', url: 'https://t.me/xri3bot' }],
            ],
          },
        }
      );
    }
  });

  // ── Pre-Checkout Query (REQUIRED for Stars payments) ─────────────────────────
  b.on('pre_checkout_query', async (query) => {
    console.log('[Bot] Pre-checkout query:', query.id, query.invoice_payload);
    try {
      const payload = query.invoice_payload;
      // payload format: "order_{orderId}"
      const orderId = parseInt(payload.replace('order_', ''), 10);

      if (isNaN(orderId)) {
        await b.answerPreCheckoutQuery(query.id, false, {
          error_message: 'Invalid order. Please try again.',
        });
        return;
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
        .limit(1);

      if (!order) {
        await b.answerPreCheckoutQuery(query.id, false, {
          error_message: 'Order not found or already processed.',
        });
        return;
      }

      // Approve the payment
      await b.answerPreCheckoutQuery(query.id, true);
      console.log(`[Bot] Pre-checkout approved for order ${orderId}`);
    } catch (err) {
      console.error('[Bot] Pre-checkout error:', err);
      await b.answerPreCheckoutQuery(query.id, false, {
        error_message: 'An error occurred. Please try again.',
      });
    }
  });

  // ── Successful Payment Handler ────────────────────────────────────────────────
  b.on('message', async (msg) => {
    if (!msg.successful_payment) return;

    const payment = msg.successful_payment;
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    console.log('[Bot] Successful payment received:', payment);

    try {
      const payload = payment.invoice_payload;
      const orderId = parseInt(payload.replace('order_', ''), 10);

      if (isNaN(orderId)) {
        console.error('[Bot] Invalid payload in successful payment:', payload);
        return;
      }

      // Get user from DB
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramUserId!))
        .limit(1);

      if (!user) {
        console.error('[Bot] User not found for payment:', telegramUserId);
        return;
      }

      // Get and validate order
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
        .limit(1);

      if (!order) {
        console.error('[Bot] Order not found or user mismatch:', orderId, user.id);
        return;
      }

      if (order.status === 'paid' && order.fileDelivered) {
        await b.sendMessage(chatId, '✅ Your order has already been fulfilled!');
        return;
      }

      // Mark order as paid
      await db
        .update(orders)
        .set({
          status: 'paid',
          telegramPaymentChargeId: payment.telegram_payment_charge_id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`[Bot] Order ${orderId} marked as paid`);

      // Send confirmation
      await b.sendMessage(
        chatId,
        `✅ *Payment Confirmed!*\n\nOrder #${orderId}\nAmount: ⭐ ${payment.total_amount} Stars\n\nPreparing your digital files...`,
        { parse_mode: 'Markdown' }
      );

      // Deliver files
      await deliverOrderFiles(chatId, orderId, user.id);
    } catch (err) {
      console.error('[Bot] Error processing successful payment:', err);
      await b.sendMessage(
        chatId,
        '❌ There was an issue processing your payment. Please contact support at @xri3bot'
      );
    }
  });
}

// ── File Delivery ────────────────────────────────────────────────────────────

async function deliverOrderFiles(
  chatId: number,
  orderId: number,
  userId: number
): Promise<void> {
  const b = getBot();

  try {
    // Get order items with product details
    const items = await db
      .select({
        orderItem: orderItems,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      await b.sendMessage(chatId, '⚠️ No items found in order. Contact support.');
      return;
    }

    let deliveredCount = 0;

    for (const { product } of items) {
      if (!product.fileUrl) {
        await b.sendMessage(chatId, `⚠️ File for "${product.name}" is not available yet. Support will assist you.`);
        continue;
      }

      const filePath = path.join(process.cwd(), 'uploads', product.fileUrl);

      if (!fs.existsSync(filePath)) {
        console.error(`[Bot] File not found: ${filePath}`);
        await b.sendMessage(chatId, `⚠️ File for "${product.name}" could not be found. Please contact support.`);
        continue;
      }

      // Send the file
      await b.sendDocument(chatId, fs.createReadStream(filePath), {
        caption: `📦 *${product.name}*\n\nThank you for your purchase from *𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾* 💎\n\nEnjoy your digital product!`,
        parse_mode: 'Markdown',
      });

      // Increment download count
      await db
        .update(products)
        .set({ downloadCount: (product.downloadCount || 0) + 1 })
        .where(eq(products.id, product.id));

      deliveredCount++;
    }

    // Mark order as delivered
    if (deliveredCount > 0) {
      await db
        .update(orders)
        .set({ fileDelivered: true, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      await b.sendMessage(
        chatId,
        `🎉 *Delivery Complete!*\n\n${deliveredCount} file(s) delivered successfully.\n\nThank you for shopping at *𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾* 💎\n\nFor support: @xri3bot`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    console.error('[Bot] File delivery error:', err);
    await b.sendMessage(
      chatId,
      '❌ Error delivering files. Please contact support at @xri3bot with your order #' + orderId
    );
  }
}

// ── Send Invoice (called from payment route) ──────────────────────────────────

export async function sendStarsInvoice(params: {
  chatId: number;
  orderId: number;
  title: string;
  description: string;
  amount: number; // in Stars
}): Promise<void> {
  const b = getBot();

  await b.sendInvoice(
    params.chatId,
    params.title,
    params.description,
    `order_${params.orderId}`,
    '', // provider_token is empty for XTR/Stars
    'XTR',
    [{ label: params.title, amount: params.amount }],
    {
      photo_url: process.env.STORE_LOGO_URL,
      photo_width: 512,
      photo_height: 512,
    }
  );
}

// ── Upsert User ───────────────────────────────────────────────────────────────

async function upsertUser(msg: TelegramBot.Message): Promise<void> {
  if (!msg.from) return;
  const telegramId = msg.from.id.toString();
  const adminId = process.env.ADMIN_TELEGRAM_ID;

  await db
    .insert(users)
    .values({
      telegramId,
      username: msg.from.username,
      firstName: msg.from.first_name,
      lastName: msg.from.last_name,
      isAdmin: telegramId === adminId,
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        updatedAt: new Date(),
      },
    });
}

// ── USDT Delivery (called from USDT monitor) ──────────────────────────────────

export async function deliverUsdtOrder(
  telegramChatId: number,
  orderId: number,
  userId: number
): Promise<void> {
  await deliverOrderFiles(telegramChatId, orderId, userId);
}
