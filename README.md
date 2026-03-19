# 🌊 𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾

A production-ready **Telegram Mini App Digital Marketplace** with real Telegram Stars payments, USDT TRC20 payments, instant file delivery, and a full admin panel.

---

## ✨ Features

- **Telegram Stars (XTR)** — real native invoice via Bot API, no mocks
- **USDT TRC20** — monitored via TronGrid API, auto-detected
- **Instant file delivery** — bot sends digital files after confirmed payment
- **Admin panel** — add/edit/delete products, view orders, analytics
- **Mobile-first UI** — dark Web3 aesthetic, Framer Motion animations
- **Secure** — payment validated server-side, files never exposed publicly

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### 2. Clone & Install

```bash
git clone <repo>
cd telegram-marketplace
cp .env.example .env
pnpm install
```

### 3. Configure Environment

Edit `.env`:

```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_TELEGRAM_ID=your_telegram_user_id
DATABASE_URL=postgresql://user:pass@localhost:5432/snawi_store
JWT_SECRET=your_secret_key_min_32_chars

# USDT (optional but recommended)
TRONGRID_API_KEY=your_trongrid_key
USDT_WALLET_ADDRESS=your_tron_wallet_address

# Mini App URL (set after deploying frontend)
MINI_APP_URL=https://t.me/your_bot/app

# Production only
TELEGRAM_WEBHOOK_URL=https://yourdomain.com
NODE_ENV=development
PORT=3001
```

### 4. Setup Database

```bash
pnpm db:push
```

### 5. Run Development

```bash
pnpm dev
```

This starts:
- **API + Bot** on `http://localhost:3001`
- **Frontend** on `http://localhost:5173`

---

## 🏗️ Project Structure

```
telegram-marketplace/
├── api-server/                 # Express backend + Telegram bot
│   ├── src/
│   │   ├── bot/index.ts        # Bot commands + Stars payment handler
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle ORM schema
│   │   │   └── index.ts        # DB connection
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT + Telegram WebApp validation
│   │   ├── routes/
│   │   │   ├── auth.ts         # POST /api/auth/telegram
│   │   │   ├── products.ts     # CRUD products
│   │   │   ├── categories.ts   # CRUD categories
│   │   │   ├── orders.ts       # Create orders + send invoice
│   │   │   ├── payments.ts     # USDT payment creation + status
│   │   │   └── admin.ts        # Analytics + user list
│   │   ├── services/
│   │   │   └── usdtService.ts  # TronGrid monitor + payment detection
│   │   ├── app.ts              # Express setup
│   │   └── index.ts            # Entry point
│
├── marketplace/                # React frontend (Telegram Mini App)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx
│   │   │   ├── product/ProductCard.tsx
│   │   │   └── ui/Skeleton.tsx
│   │   ├── hooks/
│   │   │   └── useTelegram.ts  # Telegram WebApp SDK hook
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios API client + types
│   │   │   ├── auth.ts         # Zustand auth store
│   │   │   └── cart.ts         # Zustand cart store
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProductPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│
└── packages/
    └── api-client-react/       # Shared API client package
```

---

## 💳 Payment Flows

### Telegram Stars (XTR)

```
User clicks "Pay ⭐ Stars"
  → Frontend creates order (POST /api/orders)
  → Backend creates order in DB (status: pending)
  → Bot sends invoice via sendInvoice() with currency: "XTR"
  → User pays in Telegram
  → Telegram sends pre_checkout_query → bot approves
  → Telegram sends successful_payment message
  → Bot extracts orderId from payload
  → Bot verifies userId matches order
  → Bot marks order as paid in DB
  → Bot sends digital file via sendDocument()
```

### USDT TRC20

```
User clicks "Pay USDT"
  → Frontend creates order (POST /api/orders)
  → Frontend calls POST /api/payments/usdt/create
  → Backend generates unique amount (with orderId micro-amount)
  → User sends exact USDT amount to wallet address
  → Background monitor checks TronGrid every 30s
  → Transaction detected → order marked paid
  → Bot sends digital file to user's Telegram
```

---

## 🔐 Security

- Telegram WebApp `initData` validated using HMAC-SHA256
- JWT tokens for API authentication (7-day expiry)
- Digital files stored outside public directory (`uploads/`)
- Only thumbnails served statically (`/uploads/thumbnails/`)
- Files delivered only via bot after verified payment
- One-time delivery (fileDelivered flag prevents duplicates)
- Admin routes protected by `isAdmin` flag + JWT
- Rate limiting on all API routes (100 req/15min)

---

## 🤖 Bot Commands

| Command | Action |
|---------|--------|
| `/start` | Welcome message with store button |
| `/shop` | Opens Mini App directly |
| `/support` | Shows support contact |

---

## 🛠️ Admin Panel

Access at `/admin` in the Mini App (requires ADMIN_TELEGRAM_ID match).

- **Analytics**: Total orders, revenue in Stars & USDT, user counts
- **Products**: Add/edit/delete with file upload
- **Categories**: Manage product categories with emoji icons
- **Orders**: Recent order list with status

---

## 🌐 Production Deployment

### 1. Set webhook

```env
NODE_ENV=production
TELEGRAM_WEBHOOK_URL=https://yourdomain.com
```

The bot auto-sets webhook on startup.

### 2. Build

```bash
pnpm build
```

### 3. Telegram Mini App Setup

In [@BotFather](https://t.me/BotFather):
1. `/newapp` → set your frontend URL
2. Set `MINI_APP_URL` to `https://t.me/your_bot/app`

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Framer Motion |
| State | TanStack Query, Zustand |
| Router | Wouter |
| Backend | Node.js, Express, TypeScript |
| Bot | node-telegram-bot-api |
| Database | PostgreSQL + Drizzle ORM |
| Payments | Telegram Stars (XTR), USDT TRC20 via TronGrid |

---

## 📞 Support

[@xri3bot](https://t.me/xri3bot)
