# 🛍 Telegram Digital Marketplace

A full-stack digital marketplace as a Telegram Mini App with Stars payments, USDT payments, and automatic digital product delivery.

---

## 🏗 Project Structure

```
telegram-marketplace/
├── backend/                  # Node.js + Express API + Telegram Bot
│   ├── bot/bot.js            # Telegram Bot (commands, payments, delivery)
│   ├── routes/
│   │   ├── products.js       # Products CRUD API
│   │   ├── orders.js         # Orders & payments API
│   │   └── admin.js          # Admin dashboard API
│   ├── middleware/auth.js    # Telegram WebApp auth + Admin auth
│   ├── data/
│   │   ├── db.json           # JSON database (products, orders, categories)
│   │   └── db.js             # Database helpers
│   ├── digital-files/        # Store digital product files here
│   ├── uploads/              # Payment proof uploads
│   └── server.js             # Express server entry point
│
├── frontend/                 # React + Vite + TailwindCSS Mini App
│   └── src/
│       ├── pages/
│       │   ├── HomePage.jsx      # Landing with featured products
│       │   ├── ShopPage.jsx      # Browse with filters & search
│       │   ├── ProductPage.jsx   # Product detail
│       │   ├── CartPage.jsx      # Shopping cart
│       │   ├── CheckoutPage.jsx  # Stars + USDT checkout flows
│       │   ├── OrderSuccessPage.jsx
│       │   └── AdminPage.jsx     # Full admin dashboard
│       ├── components/
│       │   ├── ProductCard.jsx   # Product grid card
│       │   ├── CartDrawer.jsx    # Slide-in cart
│       │   ├── BottomNav.jsx     # Mobile navigation
│       │   └── Skeleton.jsx      # Loading skeletons
│       ├── hooks/
│       │   └── useTelegram.js    # Telegram WebApp hook
│       ├── store/
│       │   └── useStore.js       # Zustand global state
│       └── lib/
│           └── api.js            # Axios API client
│
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Install root + all packages
npm install
npm run install:all
```

### 2. Configure Environment Variables

**Backend** — copy and edit:
```bash
cp .env.example backend/.env
```

Fill in `backend/.env`:
```env
BOT_TOKEN=         # From @BotFather
ADMIN_ID=          # Your Telegram user ID (from @userinfobot)
MINI_APP_URL=      # URL where frontend is deployed
USDT_WALLET_ADDRESS=  # Your TRC20 USDT wallet
ADMIN_SECRET=      # Strong random secret for admin panel login
```

**Frontend** — copy and edit:
```bash
cp frontend/.env.example frontend/.env
```

Fill in `frontend/.env`:
```env
VITE_ADMIN_ID=     # Same as ADMIN_ID above
VITE_ADMIN_BOT=xri3bot
```

### 3. Add Your Digital Products

Place product files in `backend/digital-files/`. Then update `backend/data/db.json` to point to them:

```json
"digitalFiles": [
  { "id": "file_001", "filename": "my-product.zip", "path": "./digital-files/my-product.zip" }
]
```

### 4. Run Development Servers

```bash
# Start both backend + frontend
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

---

## 🤖 Telegram Bot Setup

### 1. Create Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Run `/newbot` and follow steps
3. Copy the bot token to `BOT_TOKEN` in your `.env`

### 2. Set Up Mini App

1. In @BotFather, run `/newapp` or use `/mybots` → select bot → Bot Settings → Menu Button
2. Set the Mini App URL to your deployed frontend URL
3. Enable inline mode if needed

### 3. Configure Bot Commands

Send to @BotFather:
```
/setcommands
```
Then paste:
```
start - Start the marketplace
shop - Browse products
support - Get help
admin - Admin panel (admin only)
```

### 4. Enable Payments (Stars)

1. In @BotFather: `/mybots` → your bot → Payments
2. Enable Telegram Stars (no provider token needed for Stars)
3. Leave `PAYMENT_PROVIDER_TOKEN` empty in `.env` (Stars uses empty string)

---

## 💳 Payment Flows

### ⭐ Telegram Stars

1. User clicks "Buy with Stars" in Mini App
2. Backend creates order → calls `bot.sendInvoice()` with currency `XTR`
3. Telegram shows native Stars payment dialog
4. User approves in Telegram → `pre_checkout_query` fires → bot approves
5. `successful_payment` event fires → bot marks order complete
6. Bot automatically sends digital file to user

### 💎 USDT (Manual)

1. User clicks "Pay with USDT"  
2. Backend creates USDT order → returns wallet address
3. User sends USDT to displayed address
4. User uploads transaction hash + optional screenshot
5. Bot forwards proof to admin with Approve/Reject buttons
6. Admin clicks Approve → bot delivers product to user
7. Admin clicks Reject → user is notified

---

## 🔐 Admin Panel

Access at: `http://localhost:5173/admin`

**Features:**
- Dashboard with revenue stats and recent orders
- Add/Edit/Delete products
- Manage categories
- View all orders with status
- Approve/Reject USDT payments (triggers bot delivery)

**Login:**
- In development: any secret works (DEV bypass active)
- In production: use the `ADMIN_SECRET` from your `.env`
- Or use Telegram auth (admin's Telegram ID matches `ADMIN_ID`)

---

## 🚀 Production Deployment

### Backend (Railway / Render / VPS)

```bash
cd backend
npm start
```

Set all environment variables in your hosting provider dashboard.

For Telegram webhook mode (instead of polling), uncomment webhook setup in `server.js` and configure with:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_BACKEND_URL>/webhook
```

### Frontend (Vercel / Netlify / Cloudflare Pages)

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

Set `VITE_API_URL` to your backend URL, e.g.:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

---

## 📋 Bot Commands Summary

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + buttons |
| `/shop` | Open Mini App shop |
| `/support` | Support contact info |
| `/admin` | Admin stats (admin only) |

### Inline Buttons

| Button | Action |
|--------|--------|
| 🏠 Main Menu | Show menu inline |
| 🛍 Browse Products | Open Mini App |
| 📞 Support | Show support info |
| ✅ Approve (admin) | Approve USDT order + deliver |
| ❌ Reject (admin) | Reject USDT order |

---

## 🛠 Customization

### Add Products via Admin Panel
1. Go to `/admin/products`
2. Click "Add"
3. Fill form and upload digital file
4. Product appears in shop immediately

### Add Categories
1. Go to `/admin/categories`
2. Choose emoji icon + name
3. Products can now be assigned to it

### Modify USDT Wallet
In `backend/.env`:
```env
USDT_WALLET_ADDRESS=TYourNewWalletAddressHere
USDT_NETWORK=TRC20  # or ERC20, BEP20
```

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Bot | node-telegram-bot-api |
| Backend | Node.js + Express |
| Database | JSON file (upgrade to MongoDB/PostgreSQL for scale) |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS v3 |
| Animations | Framer Motion |
| State | Zustand + localStorage |
| Auth | Telegram WebApp initData HMAC validation |

---

## 🔄 Upgrading to a Real Database

Replace `backend/data/db.js` with a real ORM:

```bash
npm install mongoose  # MongoDB
# or
npm install prisma    # PostgreSQL/MySQL
```

The `readDB()` / `writeDB()` interface makes it easy to swap implementations.

---

## 📞 Support

Contact the admin bot: [@xri3bot](https://t.me/xri3bot)
