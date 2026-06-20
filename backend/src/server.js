require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const subscriptionRoutes = require('./routes/subscription');
const sessionRoutes = require('./routes/session');
const { setupWebSocket } = require('./websocket/pairingHandler');
const { startSubscriptionCron } = require('./jobs/subscriptionExpiry.cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Portni sozlash
const PORT = process.env.PORT || 5000;

// CORS — Render va Telegram uchun barcha domenlardan ruxsat
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Express Rate Limiting (API xavfsizligi uchun)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Juda ko\'p so\'rov yuborildi, iltimos keyinroq urinib ko\'ring.' }
});

app.use('/api/', apiLimiter);

// API Marshrutlari (Routes)
app.use('/api', subscriptionRoutes);
app.use('/api/session', sessionRoutes);

// Frontend statik fayllarni xizmat ko'rsatish (Render deploy uchun)
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// SPA fallback — API bo'lmagan barcha so'rovlarni index.html ga yo'naltirish
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'CurWeb Telegram Mini App API ishlamoqda.',
      status: 'online',
      version: '1.0.0',
      note: 'Frontend build topilmadi. npm run build buyrug\'ini frontend papkasida ishga tushiring.'
    });
  }
});

// WebSocket-ni sozlash
setupWebSocket(io);

// Cron jobni ishga tushirish
startSubscriptionCron();

// Serverni tinglash
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`CurWeb API Server ishga tushdi.`);
  console.log(`Port: http://localhost:${PORT}`);
  console.log(`Vaqt: ${new Date().toISOString()}`);
  console.log(`=============================================`);
});
