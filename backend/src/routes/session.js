const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../db/client');
const { verifyTelegramAuth } = require('../middleware/telegramAuth');
const { loadUser } = require('../middleware/loadUser');

// In-memory pairing codes (PIN -> Session ID)
// Real-world production setup: Redis
const pairingCodes = new Map();

// PIN generator (6-digit)
function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Receiver yangi sessiya ochadi va PIN kod oladi
router.post('/create', async (req, res) => {
  try {
    const session = await prisma.session.create({
      data: {
        status: 'pending'
      }
    });

    // 6-xonali noyob PIN kod generatsiya qilamiz
    let pin = generatePIN();
    while (pairingCodes.has(pin)) {
      pin = generatePIN();
    }

    // Kodni 5 daqiqaga xotirada saqlaymiz
    pairingCodes.set(pin, {
      sessionId: session.session_id,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 daqiqa
    });

    // PIN eskirgach avtomatik o'chirib yuborish
    setTimeout(() => {
      if (pairingCodes.has(pin) && pairingCodes.get(pin).sessionId === session.session_id) {
        pairingCodes.delete(pin);
      }
    }, 5 * 60 * 1000);

    // Receiver uchun JWT token beriladi
    const token = jwt.sign(
      { sessionId: session.session_id, role: 'receiver' },
      process.env.JWT_SECRET || 'super_secret_key_change_me_in_production',
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      sessionId: session.session_id,
      pin,
      token,
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Sessiya yaratishda xatolik:', err);
    res.status(500).json({ error: 'Sessiya yaratishda xatolik yuz berdi.' });
  }
});

// 2. Controller PIN kod orqali ulanadi va pair qiladi
router.post('/pair', verifyTelegramAuth, loadUser, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN kod kiritilmagan.' });
    }

    const sessionData = pairingCodes.get(pin.toString().trim());

    if (!sessionData || sessionData.expiresAt < Date.now()) {
      return res.status(404).json({ error: 'PIN kod noto\'g\'ri yoki muddati tugagan.' });
    }

    const { sessionId } = sessionData;

    // Sessiya statusini yangilash
    const session = await prisma.session.update({
      where: { session_id: sessionId },
      data: { status: 'paired' }
    });

    // PIN kodni o'chirib tashlaymiz (faqat bir marta ishlatilishi uchun)
    pairingCodes.delete(pin);

    // Controller uchun JWT token beriladi
    const token = jwt.sign(
      { sessionId, role: 'controller', user: req.user },
      process.env.JWT_SECRET || 'super_secret_key_change_me_in_production',
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      sessionId,
      token,
      status: session.status
    });
  } catch (err) {
    console.error('Pairing jarayonida xatolik:', err);
    res.status(500).json({ error: 'Pairing xatoligi.' });
  }
});

// 3. Sessiya holatini tekshirish
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findUnique({
      where: { session_id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessiya topilmadi.' });
    }

    res.json({
      sessionId: session.session_id,
      status: session.status,
      created_at: session.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Sessiya holatini olishda xatolik.' });
  }
});

module.exports = router;
