const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { readDB, writeDB } = require('../data/db');
const { requireTelegramAuth, requireAdmin } = require('../middleware/auth');

// Multer for payment proof uploads
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = uuidv4().slice(0, 8);
    cb(null, `proof-${unique}-${file.originalname}`);
  }
});
const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed for payment proof'));
  }
});

// ─── Create Stars order ────────────────────────────────────────────
router.post('/create-stars', requireTelegramAuth, async (req, res) => {
  try {
    const { productId, userId, userName } = req.body;
    const db = readDB();
    
    const product = db.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const order = {
      id: `ord_${uuidv4().slice(0, 10)}`,
      productId: product.id,
      productName: product.name,
      userId: userId?.toString() || req.telegramUser?.id?.toString(),
      userName: userName || req.telegramUser?.first_name || 'Unknown',
      priceStars: product.price,
      priceUSDT: product.priceUSDT,
      paymentMethod: 'stars',
      status: 'pending_stars',
      createdAt: new Date().toISOString()
    };
    
    db.orders.push(order);
    writeDB(db);
    
    // Trigger Telegram Stars invoice via bot
    const { sendStarsInvoice } = require('../bot/bot');
    if (order.userId) {
      try {
        await sendStarsInvoice(order.userId, order, product);
      } catch (err) {
        console.error('Failed to send Stars invoice:', err.message);
      }
    }
    
    res.json({ success: true, orderId: order.id, order });
  } catch (err) {
    console.error('Create Stars order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── Create USDT order ─────────────────────────────────────────────
router.post('/create-usdt', requireTelegramAuth, (req, res) => {
  const { productId, userId, userName } = req.body;
  const db = readDB();
  
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const order = {
    id: `ord_${uuidv4().slice(0, 10)}`,
    productId: product.id,
    productName: product.name,
    userId: userId?.toString() || req.telegramUser?.id?.toString(),
    userName: userName || req.telegramUser?.first_name || 'Unknown',
    priceStars: product.price,
    priceUSDT: product.priceUSDT,
    paymentMethod: 'usdt',
    status: 'awaiting_usdt_proof',
    walletAddress: process.env.USDT_WALLET_ADDRESS || 'TYourUSDTWalletHere',
    network: process.env.USDT_NETWORK || 'TRC20',
    createdAt: new Date().toISOString()
  };
  
  db.orders.push(order);
  writeDB(db);
  
  res.json({
    success: true,
    orderId: order.id,
    walletAddress: order.walletAddress,
    network: order.network,
    amount: product.priceUSDT,
    adminBot: process.env.ADMIN_BOT_USERNAME || 'xri3bot'
  });
});

// ─── Submit USDT payment proof ──────────────────────────────────────
router.post('/usdt-proof', uploadProof.single('proof'), async (req, res) => {
  try {
    const { orderId, txHash, note, userId } = req.body;
    const db = readDB();
    
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    order.status = 'pending_usdt';
    order.usdtTxHash = txHash || null;
    order.usdtProofNote = note || null;
    order.usdtProofSubmittedAt = new Date().toISOString();
    
    if (req.file) {
      order.usdtProofFile = req.file.filename;
    }
    
    writeDB(db);
    
    // Notify admin via bot
    const { notifyAdminUSDT } = require('../bot/bot');
    await notifyAdminUSDT(order, null, note);
    
    res.json({
      success: true,
      message: 'Payment proof submitted. Admin will verify shortly.',
      orderId: order.id,
      adminBot: process.env.ADMIN_BOT_USERNAME || 'xri3bot'
    });
  } catch (err) {
    console.error('USDT proof submission error:', err);
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
});

// ─── Get order status ──────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  // Don't expose sensitive fields to non-admins
  const { usdtProofFile, ...safeOrder } = order;
  res.json(safeOrder);
});

// ─── Get user orders ───────────────────────────────────────────────
router.get('/user/:userId', (req, res) => {
  const db = readDB();
  const orders = db.orders
    .filter(o => o.userId === req.params.userId)
    .map(({ usdtProofFile, ...o }) => o);
  res.json(orders);
});

// ─── Admin: Get all orders ─────────────────────────────────────────
router.get('/', requireAdmin, (req, res) => {
  const db = readDB();
  let orders = db.orders;
  
  if (req.query.status) {
    orders = orders.filter(o => o.status === req.query.status);
  }
  
  orders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  
  res.json({
    orders: orders.slice(start, start + limit),
    total: orders.length,
    page,
    totalPages: Math.ceil(orders.length / limit)
  });
});

// ─── Admin: Approve USDT order ────────────────────────────────────
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { approveOrder } = require('../bot/bot');
    await approveOrder(req.params.id, parseInt(process.env.ADMIN_ID));
    res.json({ success: true });
  } catch (err) {
    console.error('Approve order error:', err);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// ─── Admin: Reject USDT order ─────────────────────────────────────
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { rejectOrder } = require('../bot/bot');
    await rejectOrder(req.params.id, parseInt(process.env.ADMIN_ID));
    res.json({ success: true });
  } catch (err) {
    console.error('Reject order error:', err);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

module.exports = router;
