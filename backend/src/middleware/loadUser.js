const prisma = require('../db/client');

async function loadUser(req, res, next) {
  if (!req.user || !req.user.telegram_id) {
    return res.status(401).json({ error: 'Foydalanuvchi avtorizatsiyadan o\'tmagan.' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { telegram_id: req.user.telegram_id }
    });

    // Foydalanuvchi bazada bo'lmasa, uni yaratamiz
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: req.user.telegram_id,
          username: req.user.username || 'unknown',
          subscription_tier: 'free'
        }
      });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.error('Foydalanuvchini yuklashda xatolik:', err);
    return res.status(500).json({ error: 'Foydalanuvchini ma\'lumotlar bazasidan olishda xatolik.' });
  }
}

module.exports = { loadUser };
