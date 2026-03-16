require('dotenv').config();
const crypto = require('crypto');

const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_secret_change_me';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

// Validate Telegram WebApp initData
function validateTelegramWebApp(initData) {
  if (!initData) return null;
  
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    const computedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    if (computedHash !== hash) return null;
    
    const userStr = params.get('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return {};
  } catch (err) {
    return null;
  }
}

// Middleware: Require valid Telegram WebApp data
function requireTelegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData;
  
  if (!initData) {
    // In development, allow requests without auth
    if (process.env.NODE_ENV === 'development') {
      req.telegramUser = { id: 0, first_name: 'Dev', username: 'dev' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing Telegram auth' });
  }
  
  const user = validateTelegramWebApp(initData);
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      req.telegramUser = { id: 0, first_name: 'Dev', username: 'dev' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid Telegram auth' });
  }
  
  req.telegramUser = user;
  next();
}

// Middleware: Require admin access
function requireAdmin(req, res, next) {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  const initData = req.headers['x-telegram-init-data'];
  
  // Check admin secret key
  if (adminSecret === ADMIN_SECRET) {
    req.isAdmin = true;
    return next();
  }
  
  // Check Telegram user ID
  if (initData) {
    const user = validateTelegramWebApp(initData);
    if (user && user.id && user.id.toString() === ADMIN_ID?.toString()) {
      req.telegramUser = user;
      req.isAdmin = true;
      return next();
    }
  }
  
  // Dev mode bypass
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-admin'] === 'true') {
    req.isAdmin = true;
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
}

module.exports = { requireTelegramAuth, requireAdmin, validateTelegramWebApp };
