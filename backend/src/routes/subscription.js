const express = require('express');
const router = express.Router();
const prisma = require('../db/client');
const { verifyTelegramAuth } = require('../middleware/telegramAuth');
const { loadUser } = require('../middleware/loadUser');
const { verifyTier } = require('../middleware/tierCheck');

// Hozirgi foydalanuvchi ma'lumotlarini olish
router.get('/me', verifyTelegramAuth, loadUser, async (req, res) => {
  try {
    const user = req.dbUser;
    res.json({
      telegram_id: user.telegram_id,
      username: user.username,
      subscription_tier: user.subscription_tier,
      subscription_expires_at: user.subscription_expires_at,
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Foydalanuvchi ma\'lumotlarini olishda xatolik.' });
  }
});

// Premiumga obuna bo'lish route (Payment provider integration placeholder)
router.post('/subscribe', verifyTelegramAuth, loadUser, async (req, res) => {
  try {
    const user = req.dbUser;

    // TODO: To'lov provayderi integratsiyasi (e.g. Stripe, Payme, Click yoki Telegram Stars) keyinroq qo'shiladi.
    // Hozircha obunani simulyatsiya qilamiz va muddatini 1 oyga o'rnatamiz.

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 oy muddat

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_tier: 'premium',
        subscription_expires_at: expiresAt
      }
    });

    res.json({
      success: true,
      message: 'Premium obuna muvaffaqiyatli faollashtirildi!',
      subscription_tier: updatedUser.subscription_tier,
      subscription_expires_at: updatedUser.subscription_expires_at
    });
  } catch (err) {
    console.error('Obuna bo\'lishda xatolik:', err);
    res.status(500).json({ error: 'Obuna bo\'lishda xatolik yuz berdi.' });
  }
});

// Admin yoki Test maqsadlari uchun foydalanuvchi tarifini qo'lda o'zgartirish (Admin panel imkoniyati)
router.post('/admin/set-tier', verifyTelegramAuth, loadUser, async (req, res) => {
  try {
    const { tier, expires_in_seconds } = req.body;
    if (!['free', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Noto\'g\'ri tarif turi. Faqat free yoki premium.' });
    }

    let expiresAt = null;
    if (tier === 'premium') {
      expiresAt = new Date();
      if (expires_in_seconds) {
        expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(expires_in_seconds));
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.dbUser.id },
      data: {
        subscription_tier: tier,
        subscription_expires_at: expiresAt
      }
    });

    res.json({
      success: true,
      message: `Foydalanuvchi tarifi ${tier} ga muvaffaqiyatli o'zgartirildi.`,
      subscription_tier: updatedUser.subscription_tier,
      subscription_expires_at: updatedUser.subscription_expires_at
    });
  } catch (err) {
    console.error('Tarifni o\'zgartirishda xatolik:', err);
    res.status(500).json({ error: 'Tarifni o\'zgartirishda xatolik yuz berdi.' });
  }
});

// Ovozli buyruq logini yaratish endpoint (va tarifni tekshirish)
router.post('/voice-command/execute', verifyTelegramAuth, loadUser, verifyTier, async (req, res) => {
  try {
    const { command } = req.body;
    const user = req.dbUser;

    // Logga muvaffaqiyatli buyruqni yozib qo'yamiz
    const log = await prisma.voiceCommandLog.create({
      data: {
        user_id: user.id,
        command,
        tier_required: req.commandTier,
        success: true
      }
    });

    res.json({
      success: true,
      command,
      tier_required: req.commandTier,
      log_id: log.id
    });
  } catch (err) {
    console.error('Buyruq logini yozishda xatolik:', err);
    res.status(500).json({ error: 'Buyruq bajarilishini logga yozishda xatolik.' });
  }
});

// Buyruqlar tarixi va analitika
router.get('/logs', verifyTelegramAuth, loadUser, async (req, res) => {
  try {
    const logs = await prisma.voiceCommandLog.findMany({
      where: { user_id: req.dbUser.id },
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Loglarni olishda xatolik.' });
  }
});

module.exports = router;
