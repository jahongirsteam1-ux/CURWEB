const prisma = require('../db/client');

// Premium buyruqlar kalit so'zlari
const PREMIUM_COMMAND_KEYWORDS = [
  'skrinshot', 
  'orqaga', 
  'bosh ekranga', 
  'deb yoz', 
  'qo\'ng\'iroq qil', 
  'aylantir', 
  'yorug\'lik', 
  'wi-fi', 
  'wifi', 
  'taymer'
];

function getCommandTier(commandText) {
  const text = commandText.toLowerCase();
  
  // Bepul buyruqlar (Youtube, galereya, instagram va ovoz)
  if (
    text.includes('youtube') || 
    text.includes('galereya') || 
    text.includes('instagram')
  ) {
    return 'free';
  }
  
  if (
    text.includes('ovozni ko\'tar') || 
    text.includes('ovozni tushir') || 
    text.includes('tovushni') || 
    text.includes('ovozni oshir') ||
    text.includes('ovozni pasaytir')
  ) {
    return 'free';
  }
  
  // Agar boshqa ilovalarni ochish so'ralsa ("telegramni och", va hokazo), bu premium
  if (text.includes('och')) {
    return 'premium';
  }

  // Boshqa kalit so'zlar bo'yicha tekshirish
  for (const keyword of PREMIUM_COMMAND_KEYWORDS) {
    if (text.includes(keyword)) {
      return 'premium';
    }
  }

  return 'free';
}

async function verifyTier(req, res, next) {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Buyruq matni kiritilmagan.' });
  }

  const tierRequired = getCommandTier(command);
  req.commandTier = tierRequired;

  // Agar premium talab qilinsa, foydalanuvchining obunasini tekshiramiz
  if (tierRequired === 'premium') {
    const user = req.dbUser;
    
    // Obuna muddati tugaganini tekshiramiz
    const now = new Date();
    if (user.subscription_tier !== 'premium' || (user.subscription_expires_at && new Date(user.subscription_expires_at) < now)) {
      
      // Logga yozib qo'yamiz (muvaffaqiyatsiz)
      try {
        await prisma.voiceCommandLog.create({
          data: {
            user_id: user.id,
            command,
            tier_required: 'premium',
            success: false
          }
        });
      } catch (logErr) {
        console.error('Log yozishda xatolik:', logErr);
      }

      return res.status(403).json({ 
        error: 'premium_required', 
        message: 'Bu buyruq Premium tarifda mavjud. Obunani faollashtirasizmi?' 
      });
    }
  }

  next();
}

module.exports = { verifyTier, getCommandTier };
