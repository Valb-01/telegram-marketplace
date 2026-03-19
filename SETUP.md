# 🚀 إعداد المتجر — خطوات التشغيل

## ✅ البيانات المُدخلة

| المتغير | القيمة |
|---------|--------|
| BOT_TOKEN | `8685346654:AAH9-hR_Ru5FEdfrIGpD36kRmUfh0NpBWNQ` |
| ADMIN_ID | `8177426092` |
| TRC20 Wallet | `TGeWnL3Uc7CLK8MrLA4tkLdmhNmDJXiEbb` |

---

## طريقة 1 — تشغيل محلي (Development)

```bash
# 1. فك الضغط
tar -xzf 7snawi-store-final.tar.gz
cd telegram-marketplace

# 2. تشغيل PostgreSQL (لازم Docker مثبت)
docker run -d \
  --name snawi-db \
  -e POSTGRES_USER=snawi \
  -e POSTGRES_PASSWORD=snawi_secret \
  -e POSTGRES_DB=snawi_store \
  -p 5432:5432 \
  postgres:16-alpine

# 3. تثبيت المكتبات
pnpm install

# 4. إنشاء جداول قاعدة البيانات
pnpm db:push

# 5. إضافة منتجات تجريبية
pnpm db:seed

# 6. تشغيل المشروع
pnpm dev
```

الآن:
- **API + Bot**: http://localhost:3001
- **Frontend**: http://localhost:5173

---

## طريقة 2 — Docker Compose (كامل)

```bash
docker-compose up -d --build
```

---

## طريقة 3 — Production (VPS)

```bash
# على السيرفر
git clone ... || scp الملفات

# عدّل MINI_APP_URL في .env بعد إنشاء Mini App في BotFather
nano .env

# شغّل
docker-compose up -d --build

# أنشئ الجداول
docker-compose exec api node dist/db/seed.js
```

---

## إعداد Mini App في BotFather

1. افتح @BotFather
2. اختر البوت تاعك
3. `/newapp` أو `/myapps`
4. حط رابط الفرونت (السيرفر تاعك أو ngrok للتجربة)
5. انسخ الرابط وحطه في `.env`:
   ```
   MINI_APP_URL=https://t.me/YOUR_BOT_USERNAME/app
   ```

---

## تجربة محلية بدون سيرفر (ngrok)

```bash
# في terminal منفصل
npx ngrok http 5173

# انسخ الرابط مثل: https://abc123.ngrok.io
# حطه في .env:
MINI_APP_URL=https://abc123.ngrok.io
```

---

## الأوامر المتاحة

```bash
pnpm dev          # تشغيل كل شيء
pnpm db:push      # إنشاء/تحديث الجداول
pnpm db:seed      # إضافة بيانات تجريبية
pnpm db:studio    # واجهة بصرية لقاعدة البيانات
pnpm build        # بناء للإنتاج
```

---

## البوت جاهز للأوامر

| الأمر | الوظيفة |
|-------|---------|
| `/start` | رسالة ترحيب + أزرار |
| `/shop` | فتح المتجر مباشرة |
| `/support` | رابط الدعم @xri3bot |

