require('dotenv').config();
const express = require('express');
const http = require('http');
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
    origin: '*', // Socket.io uchun ham CORS sozlamalari
    methods: ['GET', 'POST']
  }
});

// Portni sozlash
const PORT = process.env.PORT || 5000;

// CORS sozlamalari (Faqat Telegram domenlari va localhost-ga ruxsat)
const allowedOrigins = [
  /telegram\.org$/,
  /web\.telegram\.org$/,
  /localhost/,
  /127\.0\.0\.1/
];

const corsOptions = {
  origin: function (origin, callback) {
    // Agar origin bo'lmasa (masalan, server-to-server yoki postman) ruxsat berish
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(regex => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS taqiqladi: Ushbu domendan kirishga ruxsat yo\'q.'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Express Rate Limiting (API xavfsizligi uchun)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 200, // Har bir IP uchun max 200 ta so'rov
  message: { error: 'Juda ko\'p so\'rov yuborildi, iltimos keyinroq urinib ko\'ring.' }
});

app.use('/api/', apiLimiter);

// API Marshrutlari (Routes)
app.use('/api', subscriptionRoutes);
app.use('/api/session', sessionRoutes);

// Bosh sahifa salomlashuv
app.get('/', (req, res) => {
  res.json({
    message: 'CurWeb Telegram Mini App API ishlamoqda.',
    status: 'online',
    version: '1.0.0'
  });
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
