import { useEffect, useState } from 'react';

/**
 * Telegram WebApp SDK bilan ishlash uchun React Hook
 */
export function useTelegramWebApp() {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Ilovani to'liq ekranga yoyish
      webApp.expand();
      
      // Tayyor ekanligini bildirish
      webApp.ready();

      setTg(webApp);
      setInitData(webApp.initData || '');
      
      if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
        setUser(webApp.initDataUnsafe.user);
      }

      setTheme(webApp.colorScheme || 'dark');
      
      // Ranglar mavzusini o'rnatish
      document.documentElement.style.setProperty('--tg-theme-bg', webApp.backgroundColor || '#0a0a0f');
      document.documentElement.style.setProperty('--tg-theme-text', webApp.textColor || '#f8fafc');
    } else {
      // Telegram tashqarisida (brauzerda) test rejimi uchun mock ma'lumotlar
      setUser({
        id: 12345678,
        first_name: 'Test',
        last_name: 'Foydalanuvchi',
        username: 'mock_user',
        language_code: 'uz'
      });
      setInitData('');
      setTheme('dark');
    }
  }, []);

  /**
   * Vibratsiya (Haptic feedback) signalini berish
   */
  const triggerHaptic = (type = 'light') => {
    if (tg && tg.HapticFeedback) {
      try {
        switch (type) {
          case 'light':
            tg.HapticFeedback.impactOccurred('light');
            break;
          case 'medium':
            tg.HapticFeedback.impactOccurred('medium');
            break;
          case 'heavy':
            tg.HapticFeedback.impactOccurred('heavy');
            break;
          case 'success':
            tg.HapticFeedback.notificationOccurred('success');
            break;
          case 'warning':
            tg.HapticFeedback.notificationOccurred('warning');
            break;
          case 'error':
            tg.HapticFeedback.notificationOccurred('error');
            break;
          default:
            tg.HapticFeedback.impactOccurred('light');
        }
      } catch (e) {
        console.warn('Haptic feedback chaqirishda xatolik:', e);
      }
    } else {
      console.log(`[Haptic Mock] Vibratsiya berildi: ${type}`);
    }
  };

  /**
   * Asosiy oynani yopish
   */
  const closeApp = () => {
    if (tg) tg.close();
  };

  return {
    tg,
    user,
    initData,
    theme,
    triggerHaptic,
    closeApp,
    isAvailable: !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)
  };
}
