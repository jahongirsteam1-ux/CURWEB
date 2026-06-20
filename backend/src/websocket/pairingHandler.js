const jwt = require('jsonwebtoken');
const prisma = require('../db/client');

function setupWebSocket(io) {
  // JWT middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Avtorizatsiya tokeni topilmadi.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_change_me_in_production');
      socket.decoded = decoded; // { sessionId, role, user }
      next();
    } catch (err) {
      return next(new Error('Noto\'g\'ri token.'));
    }
  });

  io.on('connection', async (socket) => {
    const { sessionId, role, user } = socket.decoded;
    socket.join(sessionId);

    console.log(`[WS] Yangi ulanish: Session ${sessionId}, Rol: ${role}, SocketID: ${socket.id}`);

    // Rate limiting o'zgaruvchilari (har bir socket uchun)
    let messageCounter = 0;
    const MAX_MESSAGES_PER_SECOND = 60; // Max 60 ta xabar sekundiga
    
    const intervalId = setInterval(() => {
      messageCounter = 0; // Har bir sekundda hisoblagichni yangilaymiz
    }, 1000);

    // Bazadagi sessiya yozuvini yangilash
    try {
      const updateData = {};
      if (role === 'receiver') {
        updateData.receiver_socket = socket.id;
      } else if (role === 'controller') {
        updateData.controller_socket = socket.id;
      }
      
      await prisma.session.update({
        where: { session_id: sessionId },
        data: updateData
      });

      // Boshqa ulangan ishtirokchiga xabar berish
      socket.to(sessionId).emit('peer_connected', { role, socketId: socket.id });
    } catch (err) {
      console.error('[WS] Sessiyani yangilashda xatolik:', err);
    }

    // Harakat (gesture/pointer) ma'lumotlarini qabul qilish va receiver-ga yo'naltirish
    socket.on('action', (data) => {
      messageCounter++;
      if (messageCounter > MAX_MESSAGES_PER_SECOND) {
        // Limitdan oshsa xabarni tashlab yuboramiz (Rate limiting)
        return;
      }

      // Faqat controller yuborgan harakatlarni receiver-ga jo'natamiz
      if (role === 'controller') {
        socket.to(sessionId).emit('action', data);
      }
    });

    // Ovozli buyruqlarni qabul qilish va qayta ishlash
    socket.on('voice-command', async (data, callback) => {
      // data = { command, isPremium }
      try {
        if (role === 'controller') {
          // Receiver-ga ovozli buyruq va uning bajarilishini yuboramiz
          socket.to(sessionId).emit('voice-command', data);
          if (callback) callback({ success: true });
        }
      } catch (err) {
        console.error('[WS] Ovozli buyruq uzatishda xatolik:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Ulanish uzilganda
    socket.on('disconnect', async () => {
      clearInterval(intervalId);
      console.log(`[WS] Ulanish uzildi: ${socket.id}, Rol: ${role}`);
      
      try {
        const updateData = {};
        if (role === 'receiver') {
          updateData.receiver_socket = null;
        } else if (role === 'controller') {
          updateData.controller_socket = null;
        }
        
        // Agar ikkala ulanish ham uzilgan bo'lsa sessiya statusini o'zgartirish
        const session = await prisma.session.findUnique({
          where: { session_id: sessionId }
        });

        if (session) {
          if (role === 'receiver') {
            updateData.status = 'disconnected';
          }
          await prisma.session.update({
            where: { session_id: sessionId },
            data: updateData
          });
        }

        socket.to(sessionId).emit('peer_disconnected', { role, socketId: socket.id });
      } catch (err) {
        console.error('[WS] Ulanish uzilishini yozishda xatolik:', err);
      }
    });
  });
}

module.exports = { setupWebSocket };
