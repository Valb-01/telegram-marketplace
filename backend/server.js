require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Ensure directories exist ─────────────────────────────────────
const dirsToCreate = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'digital-files')
];
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.MINI_APP_URL, process.env.BACKEND_URL].filter(Boolean)
    : '*',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Serve uploaded files (payment proofs - admin only)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Webhook endpoint for Telegram (alternative to polling)
app.post('/webhook', express.json(), (req, res) => {
  // Handle Telegram updates here if using webhook mode
  res.sendStatus(200);
});

// ─── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Digital Marketplace Backend`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Initialize bot
  try {
    const { initBot } = require('./bot/bot');
    const bot = initBot();
    if (bot) {
      console.log('🤖 Telegram bot initialized');
    }
  } catch (err) {
    console.error('Bot initialization error:', err.message);
  }
});

module.exports = app;
