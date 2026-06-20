# CurWeb — Gesture & Voice Controlled Telegram Mini App

CurWeb — bu kamera orqali qo'l imo-ishoralari (MediaPipe Hands) va ovozli buyruqlar (Web Speech API) yordamida veb-ilovalarni ekranga TEGMASDAN boshqarish imkonini beruvchi to'liq ishlaydigan Telegram Mini App loyihasi.

Ushbu ilova **Freemium** modelida ishlaydi:
- **Free plan (Bepul):** 5 ta ovozli buyruq va asosiy kursor harakatlari.
- **Premium plan (Pullik):** Jami 15 ta ovozli buyruq, multitouch (zoom/pan), drag-and-drop va maxsus tizim simulyatsiyalari.

---

## Loyiha Tuzilishi

```text
curweb-app/
├── frontend/          # React (Vite) + MediaPipe CDN + Speech API
└── backend/           # Node.js + Express + Socket.io + Prisma (SQLite)
```

---

## O'rnatish va Ishga Tushirish

### 1. Talablar
Tizimingizda quyidagilar o'rnatilgan bo'lishi kerak:
- **Node.js** (v18 yoki undan yuqori)
- **NPM** (v9 yoki undan yuqori)

### 2. Backend-ni sozlash
1. `backend` katalogiga o'ting:
   ```bash
   cd backend
   ```
2. Bog'liqliklarni o'rnating:
   ```bash
   npm install
   ```
3. `.env` faylini sozlang (namuna `.env.example` faylida ko'rsatilgan):
   - `PORT=5000`
   - `BOT_TOKEN`: Telegram @BotFather dan olingan bot tokeni.
   - `JWT_SECRET`: JWT imzolash uchun maxfiy kalit.
4. Ma'lumotlar bazasini (SQLite) sinxronizatsiya qiling va Prisma client-ni generatsiya qiling:
   ```bash
   npm run db:push
   ```
5. Serverni ishga tushiring (Development rejimda):
   ```bash
   npm run dev
   ```

### 3. Frontend-ni sozlash
1. `frontend` katalogiga o'ting:
   ```bash
   cd ../frontend
   ```
2. Bog'liqliklarni o'rnating:
   ```bash
   npm install
   ```
3. Rivojlantirish serverini ishga tushiring:
   ```bash
   npm run dev
   ```
   *Frontend 3000-portda (`http://localhost:3000`) ishga tushadi.*

---

## Telegram BotFather orqali Sozlash

Mini App-ni Telegram botga ulash uchun quyidagi amallarni bajaring:
1. Telegramda [@BotFather](https://t.me/BotFather) botini oching va `/newbot` buyrug'ini yuboring.
2. Botga nom va username bering. Bot tokenini oling va backend `.env` faylidagi `BOT_TOKEN` maydoniga yozing.
3. Yangi Mini App qo'shish uchun `/newapp` buyrug'ini yuboring:
   - Botni tanlang.
   - Ilovaga nom va tavsif bering.
   - Rasm/GIF yuklang.
   - **URL manzilini so'raganda:** Mahalliy test qilish uchun HTTPS tunnel (masalan, `ngrok` yoki `localtunnel` orqali `http://localhost:3000` portini tashqariga yo'naltirib) manzilini kiriting. Masalan: `https://my-tunnel.ngrok-free.app`.
4. Bot menyusiga kirib, yaratilgan Mini App tugmasi orqali ilovani ishga tushiring.

---

## Texnik Cheklovlar va Muqobil Yechimlar

Veb-brauzer xavfsizlik qoidalari (Sandbox muhiti) sababli ba'zi tizim funksiyalarini veb-ilova ichidan bajarib bo'lmaydi. Quyida ushbu cheklovlar va ularga muqobil yechimlar ko'rsatilgan:

### 1. Tizim darajasidagi cheklovlar
- **Screenshot olish, Wi-Fi yoqish/o'chirish, Ekran yorqinligi va Tizim ovozi:**
  - *Cheklov:* Veb-brauzerda qurilmaning native parametrlarini boshqarish uchun ruxsatlar yo'q.
  - *Veb muqobili (Simulyatsiya):* Ilova ovoz balandligini faqat o'zidagi `HTMLMediaElement.volume` orqali o'zgartiradi. Ekran yorqinligi sahifa ustiga qora shaffof overlay (`opacity`) qo'yish orqali simulyatsiya qilinadi. Qolgan tizim amallari uchun UI'da mos belgi va ogohlantirish ko'rsatiladi.
  - *Native yechim:* Agar ushbu loyiha native mobil ilova (Kotlin/Swift yoki Flutter) sifatida qayta qurilsa, quyidagi API'lar ishlatiladi:
    - **Wi-Fi:** Android `WifiManager` yoki iOS `NEHotspotConfigurationManager`.
    - **Yorqinlik:** Android `Settings.System.putInt(..., SCREEN_BRIGHTNESS)` yoki iOS `UIScreen.main.brightness`.
    - **Ovoz:** Android `AudioManager` yoki iOS `MPVolumeView`.
    - **Screenshot:** Android `MediaProjection` yoki iOS `UIScreen.main.captured`.

### 2. Cross-Origin Iframe Cheklovi
- *Cheklov:* Agar ilova ichida boshqa sayt `<iframe>` orqali yuklansa, brauzerning **Same-Origin Policy** xavfsizlik siyosati sababli virtual kursor harakatlari va click hodisalarini iframe ichidagi elementlarga uzatib bo'lmaydi.
- *Muqobil yechim:* Saytlarni iframe-ga yuklash o'rniga ularni yangi tabda (`window.open`) ochish yoki brauzer kengaytmasi (Extension) orqali kursor hodisalarini inject qilish tavsiya etiladi.

---

## To'lov Provayderi Integratsiyasi (Yo'l xaritasi)

Premium tarifga obuna bo'lish uchun to'lov integratsiyasi hozircha placeholder rejimida ishlaydi (foydalanuvchi "Premiumga o'tish" tugmasini bossa, server test uchun darhol premium status beradi). Kelajakda to'lovni haqiqiy sozlash bo'yicha yo'riqnoma:

1. **Telegram Stars:**
   - Eng qulay usul — Telegram Mini App ichida Telegram Stars orqali to'lovni amalga oshirish.
   - Frontend tomondan `window.Telegram.WebApp.openInvoice(url)` chaqiriladi.
   - Backendda bot orqali invoice generatsiya qilinadi (`sendInvoice` API) va `pre_checkout_query` hamda `successful_payment` hodisalari orqali obuna statusi bazada yangilanadi.
2. **Stripe, Payme yoki Click:**
   - `/api/subscribe` endpointida to'lov provayderining Checkout seansi yaratiladi va foydalanuvchiga to'lov sahifasi URL manzili qaytariladi.
   - Muvaffaqiyatli to'lovdan so'ng provayder Webhook yordamida backendga xabar beradi va bazadagi userning `subscription_tier` qiymati `premium` ga o'zgartiriladi va `subscription_expires_at` muddati o'rnatiladi.
