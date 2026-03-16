require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const { readDB, writeDB } = require('../data/db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-mini-app-url.com';
const ADMIN_BOT_USERNAME = process.env.ADMIN_BOT_USERNAME || 'xri3bot';
const DIGITAL_FILES_DIR = path.join(__dirname, '../digital-files');

let bot = null;

function initBot() {
  if (!BOT_TOKEN) {
    console.warn('⚠️  BOT_TOKEN not set. Bot functionality disabled.');
    return null;
  }

  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  console.log('🤖 Telegram bot started');

  // ─── /start command ───────────────────────────────────────────
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';

    const welcomeText = `
✨ *Welcome to Digital Marketplace!*

Hey ${firstName}! 👋

Discover and instantly download premium digital products:
🔧 Software Tools
🎨 Design Assets  
📚 Courses & eBooks
🤖 Scripts & Bots
🎮 Game Assets

Pay with ⭐ *Telegram Stars* or 💎 *USDT*
Instant delivery after payment!

Use the buttons below to get started 👇
    `.trim();

    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🏠 Main Menu', callback_data: 'main_menu' },
            { text: '📞 Support', callback_data: 'support' }
          ],
          [
            {
              text: '🛍 Browse Products',
              web_app: { url: MINI_APP_URL }
            }
          ]
        ]
      }
    });
  });

  // ─── /shop command ─────────────────────────────────────────────
  bot.onText(/\/shop/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '🛍 *Open the Digital Marketplace*\n\nBrowse hundreds of premium digital products!', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛍 Open Shop',
              web_app: { url: MINI_APP_URL }
            }
          ]
        ]
      }
    });
  });

  // ─── /support command ──────────────────────────────────────────
  bot.onText(/\/support/, async (msg) => {
    const chatId = msg.chat.id;
    const supportText = `
📞 *Customer Support*

Need help? We're here for you!

• *Purchase issues* – Contact @${ADMIN_BOT_USERNAME}
• *Payment verification* – Contact @${ADMIN_BOT_USERNAME}
• *Refund requests* – Contact @${ADMIN_BOT_USERNAME}
• *Technical issues* – Contact @${ADMIN_BOT_USERNAME}

⏰ Support hours: 24/7
⚡ Average response time: Under 2 hours
    `.trim();

    await bot.sendMessage(chatId, supportText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Contact Support', url: `https://t.me/${ADMIN_BOT_USERNAME}` }],
          [{ text: '🛍 Back to Shop', web_app: { url: MINI_APP_URL } }]
        ]
      }
    });
  });

  // ─── /admin command ────────────────────────────────────────────
  bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.id !== ADMIN_ID) {
      return bot.sendMessage(chatId, '❌ Unauthorized access.');
    }

    const db = readDB();
    const pendingOrders = db.orders.filter(o => o.status === 'pending_usdt');

    const adminText = `
🔐 *Admin Dashboard*

📊 *Statistics:*
• Total Products: ${db.products.length}
• Total Orders: ${db.orders.length}
• Pending USDT: ${pendingOrders.length}

Use the Mini App admin panel for full control.
    `.trim();

    await bot.sendMessage(chatId, adminText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚙️ Open Admin Panel', web_app: { url: `${MINI_APP_URL}/admin` } }],
          [
            { text: `📋 Pending (${pendingOrders.length})`, callback_data: 'admin_pending' },
            { text: '📦 All Orders', callback_data: 'admin_orders' }
          ]
        ]
      }
    });
  });

  // ─── Callback query handler ────────────────────────────────────
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id;

    await bot.answerCallbackQuery(query.id);

    if (data === 'main_menu') {
      const menuText = `
🏠 *Main Menu*

Welcome to Digital Marketplace!

What would you like to do?
      `.trim();
      await bot.sendMessage(chatId, menuText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍 Browse Products', web_app: { url: MINI_APP_URL } }],
            [
              { text: '📦 My Orders', callback_data: 'my_orders' },
              { text: '📞 Support', callback_data: 'support' }
            ]
          ]
        }
      });
    }

    if (data === 'support') {
      await bot.sendMessage(chatId, `📞 *Support*\n\nContact our support team:\n@${ADMIN_BOT_USERNAME}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Contact @' + ADMIN_BOT_USERNAME, url: `https://t.me/${ADMIN_BOT_USERNAME}` }]
          ]
        }
      });
    }

    if (data === 'my_orders') {
      const db = readDB();
      const userOrders = db.orders.filter(o => o.userId === userId.toString());

      if (userOrders.length === 0) {
        return bot.sendMessage(chatId, '📦 *My Orders*\n\nYou have no orders yet.\n\nStart shopping! 🛍', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍 Browse Products', web_app: { url: MINI_APP_URL } }]
            ]
          }
        });
      }

      let orderText = '📦 *My Recent Orders:*\n\n';
      userOrders.slice(-5).forEach((order, i) => {
        const statusEmoji = {
          completed: '✅',
          pending_stars: '⏳',
          pending_usdt: '🔄',
          rejected: '❌'
        }[order.status] || '❓';
        orderText += `${statusEmoji} Order #${order.id.slice(-6)}\n`;
        orderText += `   📦 ${order.productName}\n`;
        orderText += `   💰 ${order.priceStars}⭐\n`;
        orderText += `   📅 ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
      });

      await bot.sendMessage(chatId, orderText, { parse_mode: 'Markdown' });
    }

    // Admin actions
    if (data === 'admin_pending' && userId === ADMIN_ID) {
      const db = readDB();
      const pending = db.orders.filter(o => o.status === 'pending_usdt');

      if (pending.length === 0) {
        return bot.sendMessage(chatId, '✅ No pending USDT payments.');
      }

      for (const order of pending.slice(0, 5)) {
        const buttons = [
          [
            { text: '✅ Approve', callback_data: `approve_${order.id}` },
            { text: '❌ Reject', callback_data: `reject_${order.id}` }
          ]
        ];
        await bot.sendMessage(chatId, formatOrderForAdmin(order), {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      }
    }

    // Approve USDT order
    if (data.startsWith('approve_') && userId === ADMIN_ID) {
      const orderId = data.replace('approve_', '');
      await approveOrder(orderId, chatId);
    }

    // Reject USDT order
    if (data.startsWith('reject_') && userId === ADMIN_ID) {
      const orderId = data.replace('reject_', '');
      await rejectOrder(orderId, chatId);
    }
  });

  // ─── Pre-checkout query ────────────────────────────────────────
  bot.on('pre_checkout_query', async (query) => {
    try {
      await bot.answerPreCheckoutQuery(query.id, true);
    } catch (err) {
      console.error('Pre-checkout error:', err);
      await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'Payment failed. Please try again.' });
    }
  });

  // ─── Successful payment ────────────────────────────────────────
  bot.on('message', async (msg) => {
    if (msg.successful_payment) {
      const chatId = msg.chat.id;
      const payment = msg.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);

      const db = readDB();
      const orderId = payload.orderId;
      const order = db.orders.find(o => o.id === orderId);

      if (order) {
        order.status = 'completed';
        order.telegramPaymentChargeId = payment.telegram_payment_charge_id;
        order.completedAt = new Date().toISOString();
        writeDB(db);

        await bot.sendMessage(chatId, `
✅ *Payment Successful!*

Thank you for your purchase! 🎉

📦 *${order.productName}*
⭐ Paid: ${payment.total_amount} Stars

Your digital product is being delivered below 👇
        `.trim(), { parse_mode: 'Markdown' });

        await deliverProduct(chatId, order, db);
      }
    }
  });

  bot.on('polling_error', (err) => {
    console.error('Bot polling error:', err.message);
  });

  return bot;
}

// ─── Helper: Format order for admin ─────────────────────────────
function formatOrderForAdmin(order) {
  return `
🔔 *Pending USDT Payment*

📋 *Order ID:* \`${order.id}\`
👤 *User:* ${order.userName || 'Unknown'} (ID: ${order.userId})
📦 *Product:* ${order.productName}
💰 *Amount:* $${order.priceUSDT} USDT
📅 *Date:* ${new Date(order.createdAt).toLocaleString()}

${order.usdtProofNote ? `📝 *Note:* ${order.usdtProofNote}` : ''}
  `.trim();
}

// ─── Deliver digital product ─────────────────────────────────────
async function deliverProduct(chatId, order, db) {
  if (!bot) return;

  try {
    const product = db.products.find(p => p.id === order.productId);
    if (!product) {
      await bot.sendMessage(chatId, '⚠️ Product delivery error. Please contact support.');
      return;
    }

    const digitalFile = db.digitalFiles.find(f => f.id === product.digitalFileId);

    // Send delivery message
    const deliveryMsg = `
🎁 *Your Digital Product*

📦 *${product.name}*

✅ Purchase confirmed and verified!

${digitalFile ? '📥 *Download link / file below:*' : '📩 *Contact support for your download link.*'}
    `.trim();

    await bot.sendMessage(chatId, deliveryMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⭐ Rate this product', callback_data: `rate_${product.id}` }],
          [{ text: '💬 Support', url: `https://t.me/${ADMIN_BOT_USERNAME}` }]
        ]
      }
    });

    // Try to send the actual file
    if (digitalFile) {
      const filePath = path.resolve(__dirname, '..', digitalFile.path.replace('./', ''));
      if (fs.existsSync(filePath)) {
        await bot.sendDocument(chatId, filePath, {
          caption: `📦 *${product.name}*\n\nEnjoy your purchase! ⭐`,
          parse_mode: 'Markdown'
        });
      } else {
        // Send a placeholder message with download instructions
        await bot.sendMessage(chatId, `
📥 *Download Instructions*

Your file: \`${digitalFile.filename}\`

Please contact @${ADMIN_BOT_USERNAME} with your order ID \`${order.id}\` to receive your download link.

We'll send it within minutes! ⚡
        `.trim(), { parse_mode: 'Markdown' });
      }
    }
  } catch (err) {
    console.error('Product delivery error:', err);
    await bot.sendMessage(chatId, `⚠️ There was an issue delivering your product. Please contact @${ADMIN_BOT_USERNAME} with order ID: \`${order.id}\``, {
      parse_mode: 'Markdown'
    });
  }
}

// ─── Approve USDT order ───────────────────────────────────────────
async function approveOrder(orderId, adminChatId) {
  if (!bot) return;

  const db = readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return bot.sendMessage(adminChatId, `❌ Order ${orderId} not found.`);
  }

  if (order.status === 'completed') {
    return bot.sendMessage(adminChatId, `⚠️ Order ${orderId} already completed.`);
  }

  order.status = 'completed';
  order.approvedAt = new Date().toISOString();
  order.approvedBy = adminChatId.toString();
  writeDB(db);

  // Notify admin
  await bot.sendMessage(adminChatId, `✅ Order \`${orderId}\` approved! Delivering product to user...`, {
    parse_mode: 'Markdown'
  });

  // Notify user and deliver product
  if (order.userId) {
    try {
      await bot.sendMessage(order.userId, `
✅ *Payment Approved!*

Your USDT payment has been verified! 🎉

📦 *${order.productName}*
💰 $${order.priceUSDT} USDT

Your digital product is being delivered now 👇
      `.trim(), { parse_mode: 'Markdown' });

      await deliverProduct(order.userId, order, db);
    } catch (err) {
      console.error('Error notifying user:', err);
      await bot.sendMessage(adminChatId, `⚠️ Could not deliver to user ${order.userId}. Please deliver manually.`);
    }
  }
}

// ─── Reject USDT order ────────────────────────────────────────────
async function rejectOrder(orderId, adminChatId) {
  if (!bot) return;

  const db = readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return bot.sendMessage(adminChatId, `❌ Order ${orderId} not found.`);
  }

  order.status = 'rejected';
  order.rejectedAt = new Date().toISOString();
  writeDB(db);

  await bot.sendMessage(adminChatId, `❌ Order \`${orderId}\` rejected.`, { parse_mode: 'Markdown' });

  if (order.userId) {
    try {
      await bot.sendMessage(order.userId, `
❌ *Payment Rejected*

Your USDT payment proof for *${order.productName}* could not be verified.

Please contact @${ADMIN_BOT_USERNAME} for assistance or try again.
      `.trim(), { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error notifying user of rejection:', err);
    }
  }
}

// ─── Send Stars invoice ───────────────────────────────────────────
async function sendStarsInvoice(chatId, order, product) {
  if (!bot) return;

  try {
    await bot.sendInvoice(
      chatId,
      product.name,
      product.shortDescription || product.description.substring(0, 200),
      JSON.stringify({ orderId: order.id, productId: product.id }),
      '',  // empty provider token = Telegram Stars
      'XTR',  // Telegram Stars currency
      [{ label: product.name, amount: product.price }]
    );
  } catch (err) {
    console.error('Error sending Stars invoice:', err);
    throw err;
  }
}

// ─── Notify admin of USDT payment ─────────────────────────────────
async function notifyAdminUSDT(order, proofFileId, proofNote) {
  if (!bot || !ADMIN_ID) return;

  try {
    const caption = `
🔔 *New USDT Payment Proof*

📋 *Order ID:* \`${order.id}\`
👤 *User:* ${order.userName || 'Unknown'} (ID: ${order.userId})
📦 *Product:* ${order.productName}
💰 *Amount:* $${order.priceUSDT} USDT
📅 *Date:* ${new Date(order.createdAt).toLocaleString()}

${proofNote ? `📝 *Note:* ${proofNote}` : ''}
    `.trim();

    const buttons = {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `approve_${order.id}` },
          { text: '❌ Reject', callback_data: `reject_${order.id}` }
        ]
      ]
    };

    if (proofFileId) {
      await bot.sendPhoto(ADMIN_ID, proofFileId, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    } else {
      await bot.sendMessage(ADMIN_ID, caption, {
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    }
  } catch (err) {
    console.error('Error notifying admin:', err);
  }
}

module.exports = { initBot, sendStarsInvoice, notifyAdminUSDT, approveOrder, rejectOrder, deliverProduct };
