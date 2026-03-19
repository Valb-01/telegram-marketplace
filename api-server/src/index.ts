import 'dotenv/config';
import { createApp } from './app';
import { initBot } from './bot';
import { startUsdtMonitor } from './services/usdtService';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  const app = createApp();

  // Initialize Telegram bot
  try {
    await initBot();
  } catch (err) {
    console.error('[Server] Failed to initialize bot:', err);
    process.exit(1);
  }

  // Start USDT payment monitor
  startUsdtMonitor();

  app.listen(PORT, () => {
    console.log(`[Server] 🌊 7snawi Store API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
