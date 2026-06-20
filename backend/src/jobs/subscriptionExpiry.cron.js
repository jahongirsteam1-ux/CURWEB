const cron = require('node-cron');
const prisma = require('../db/client');

// Har 5 daqiqada muddati tugagan premium obunalarni tekshirish va o'chirish
function startSubscriptionCron() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Obunalar muddatini tekshirish boshlandi...');
    try {
      const now = new Date();
      
      // Premium bo'lgan va muddati tugagan foydalanuvchilarni topamiz
      const expiredUsers = await prisma.user.findMany({
        where: {
          subscription_tier: 'premium',
          subscription_expires_at: {
            lt: now
          }
        }
      });

      if (expiredUsers.length > 0) {
        const userIds = expiredUsers.map(u => u.id);
        
        await prisma.user.updateMany({
          where: {
            id: {
              in: userIds
            }
          },
          data: {
            subscription_tier: 'free',
            subscription_expires_at: null
          }
        });

        console.log(`[CRON] ${expiredUsers.length} ta foydalanuvchi obuna muddati tugagani sababli 'free' tarifga o'tkazildi.`);
      } else {
        console.log('[CRON] Muddati tugagan obunalar mavjud emas.');
      }
    } catch (err) {
      console.error('[CRON] Obunalarni yangilashda xatolik:', err);
    }
  });
}

module.exports = { startSubscriptionCron };
