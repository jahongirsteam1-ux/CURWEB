/**
 * Ovozli matnlarni tahlil qilib, 15 ta buyruqdan biriga moslashtirish,
 * parametrlarni (sonlar, ilova nomlari, matnlar) ajratib olish va
 * premium holatini aniqlash.
 */

// Bepul buyruqlar ID ro'yxati: 1-5
// Premium buyruqlar ID ro'yxati: 6-15
export const COMMANDS_MAP = {
  // Free (1-5)
  VOLUME_UP: { id: 1, text: "CurWeb ovozni ko'tar", isPremium: false },
  VOLUME_DOWN: { id: 2, text: "CurWeb ovozni tushir", isPremium: false },
  OPEN_YOUTUBE: { id: 3, text: "CurWeb YouTube'ni och", isPremium: false },
  OPEN_GALLERY: { id: 4, text: "CurWeb galereyani och", isPremium: false },
  OPEN_INSTAGRAM: { id: 5, text: "CurWeb Instagram'ni och", isPremium: false },

  // Premium (6-15)
  SCREENSHOT: { id: 6, text: "CurWeb skrinshot ol", isPremium: true },
  OPEN_APP: { id: 7, text: "CurWeb [ilova]ni och", isPremium: true },
  GO_BACK: { id: 8, text: "CurWeb orqaga qaytar", isPremium: true },
  GO_HOME: { id: 9, text: "CurWeb bosh ekranga qaytar", isPremium: true },
  TYPE_TEXT: { id: 10, text: "CurWeb [matn] deb yoz", isPremium: true },
  MAKE_CALL: { id: 11, text: "CurWeb qo'ng'iroq qil [ism/raqam]ga", isPremium: true },
  SCROLL_DOWN: { id: 12, text: "CurWeb pastga aylantir", isPremium: true },
  SCROLL_UP: { id: 12.5, text: "CurWeb yuqoriga aylantir", isPremium: true }, // 12-buyruqning boshqa ko'rinishi
  BRIGHTNESS_OFF: { id: 13, text: "CurWeb yorug'likni o'chir", isPremium: true },
  BRIGHTNESS_ON: { id: 13.5, text: "CurWeb yorug'likni yoq", isPremium: true }, // 13-buyruqning boshqa ko'rinishi
  WIFI_TOGGLE: { id: 14, text: "CurWeb Wi-Fi'ni yoq/o'chir", isPremium: true },
  SET_TIMER: { id: 15, text: "CurWeb [N] minutga taymer qo'y", isPremium: true }
};

// Wake-word sinonimlari va fuzzy mosliklari
const WAKE_WORDS = [
  'salom curweb', 
  'salom korveb', 
  'salom kurweb', 
  'salom kuryeb', 
  'salom kurveb', 
  'salom korweb',
  'salom qorveb',
  'salom kuryer',
  'salom orweb'
];

/**
 * Wake-word aniqlanganini tekshirish
 */
export function checkWakeWord(text) {
  const cleanText = text.toLowerCase().trim();
  
  for (const word of WAKE_WORDS) {
    if (cleanText.includes(word)) {
      return true;
    }
  }
  
  // Levenshtein yoki sodda fuzzy check: agar "salom" va "web" yoki "cur" so'zlari yaqin kelsa
  if (cleanText.includes('salom') && (cleanText.includes('web') || cleanText.includes('veb') || cleanText.includes('cur') || cleanText.includes('kor'))) {
    return true;
  }

  return false;
}

/**
 * Buyruq matnini tahlil qilish va mos keluvchisini aniqlash
 */
export function parseVoiceCommand(text) {
  let cleanText = text.toLowerCase().trim();
  
  // Agar boshida "salom curweb" (yoki boshqa wake-word) bo'lsa, uni olib tashlaymiz
  for (const word of WAKE_WORDS) {
    if (cleanText.startsWith(word)) {
      cleanText = cleanText.substring(word.length).trim();
      break;
    }
  }

  // Agar boshida "curweb" yoki "korveb" so'zi bo'lsa, uni ham olib tashlaymiz
  const prefixes = ['curweb', 'korveb', 'kurweb', 'kuryeb', 'cur web'];
  for (const prefix of prefixes) {
    if (cleanText.startsWith(prefix)) {
      cleanText = cleanText.substring(prefix.length).trim();
      break;
    }
  }

  if (!cleanText) return null;

  // 1. Ovozni oshirish (VOLUME_UP)
  if (
    cleanText.includes('ovozni ko\'tar') || 
    cleanText.includes('ovozni oshir') || 
    cleanText.includes('ovozini ko\'tar') ||
    cleanText.includes('tovushni ko\'tar') || 
    cleanText.includes('tovushini ko\'tar') ||
    cleanText.includes('ovoz balandroq')
  ) {
    return { type: 'VOLUME_UP', command: COMMANDS_MAP.VOLUME_UP, raw: text };
  }

  // 2. Ovozni kamaytirish (VOLUME_DOWN)
  if (
    cleanText.includes('ovozni tushir') || 
    cleanText.includes('ovozni pasaytir') || 
    cleanText.includes('ovozini tushir') ||
    cleanText.includes('ovozni kamaytir') || 
    cleanText.includes('tovushni pasaytir') ||
    cleanText.includes('tovushni tushir') ||
    cleanText.includes('ovozni pastroq')
  ) {
    return { type: 'VOLUME_DOWN', command: COMMANDS_MAP.VOLUME_DOWN, raw: text };
  }

  // 3. YouTube (OPEN_YOUTUBE)
  if (
    cleanText.includes('youtube\'ni och') || 
    cleanText.includes('youtubeni och') || 
    cleanText.includes('youtube och') || 
    cleanText.includes('yutubni och') ||
    cleanText.includes('yutub och')
  ) {
    return { type: 'OPEN_YOUTUBE', command: COMMANDS_MAP.OPEN_YOUTUBE, raw: text };
  }

  // 4. Galereya (OPEN_GALLERY)
  if (
    cleanText.includes('galereyani och') || 
    cleanText.includes('galareyani och') || 
    cleanText.includes('galereya och') || 
    cleanText.includes('rasmlarni och')
  ) {
    return { type: 'OPEN_GALLERY', command: COMMANDS_MAP.OPEN_GALLERY, raw: text };
  }

  // 5. Instagram (OPEN_INSTAGRAM)
  if (
    cleanText.includes('instagram\'ni och') || 
    cleanText.includes('instagramni och') || 
    cleanText.includes('instagram och') || 
    cleanText.includes('instani och')
  ) {
    return { type: 'OPEN_INSTAGRAM', command: COMMANDS_MAP.OPEN_INSTAGRAM, raw: text };
  }

  // 6. Screenshot (SCREENSHOT)
  if (
    cleanText.includes('skrinshot ol') || 
    cleanText.includes('skrinshot qil') || 
    cleanText.includes('screenshot ol') ||
    cleanText.includes('ekranni suratga ol') ||
    cleanText.includes('ekranni rasmga ol')
  ) {
    return { type: 'SCREENSHOT', command: COMMANDS_MAP.SCREENSHOT, raw: text };
  }

  // 8. Orqaga qaytar (GO_BACK)
  if (
    cleanText.includes('orqaga qaytar') || 
    cleanText.includes('orqaga qayt') || 
    cleanText.includes('orqaga') ||
    cleanText.includes('back qil')
  ) {
    return { type: 'GO_BACK', command: COMMANDS_MAP.GO_BACK, raw: text };
  }

  // 9. Bosh ekranga qaytar (GO_HOME)
  if (
    cleanText.includes('bosh ekranga') || 
    cleanText.includes('bosh sahifa') || 
    cleanText.includes('home ekranga') ||
    cleanText.includes('uyga qaytar')
  ) {
    return { type: 'GO_HOME', command: COMMANDS_MAP.GO_HOME, raw: text };
  }

  // 12. Pastga / Yuqoriga scroll (SCROLL_DOWN / SCROLL_UP)
  if (cleanText.includes('pastga aylantir') || cleanText.includes('pastga skrol') || cleanText.includes('pastga scroll')) {
    return { type: 'SCROLL_DOWN', command: COMMANDS_MAP.SCROLL_DOWN, raw: text };
  }
  if (cleanText.includes('yuqoriga aylantir') || cleanText.includes('tepaga aylantir') || cleanText.includes('tepaga scroll') || cleanText.includes('tepaga skrol')) {
    return { type: 'SCROLL_UP', command: COMMANDS_MAP.SCROLL_UP, raw: text };
  }

  // 13. Yorug'lik (BRIGHTNESS_OFF / BRIGHTNESS_ON)
  if (cleanText.includes('yorug\'likni o\'chir') || cleanText.includes('yorug\'likni pasaytir') || cleanText.includes('yorqinlikni o\'chir') || cleanText.includes('yorqinlikni pasaytir')) {
    return { type: 'BRIGHTNESS_OFF', command: COMMANDS_MAP.BRIGHTNESS_OFF, raw: text };
  }
  if (cleanText.includes('yorug\'likni yoq') || cleanText.includes('yorug\'likni oshir') || cleanText.includes('yorqinlikni yoq') || cleanText.includes('yorqinlikni oshir')) {
    return { type: 'BRIGHTNESS_ON', command: COMMANDS_MAP.BRIGHTNESS_ON, raw: text };
  }

  // 14. Wi-Fi (WIFI_TOGGLE)
  if (
    cleanText.includes('wi-fi') || 
    cleanText.includes('wifi') || 
    cleanText.includes('vayfay')
  ) {
    return { type: 'WIFI_TOGGLE', command: COMMANDS_MAP.WIFI_TOGGLE, raw: text };
  }

  // Dinamik parametrli buyruqlar:

  // 10. [Matn] deb yoz (TYPE_TEXT)
  // Masalan: "Salom dunyo deb yoz" -> param: "Salom dunyo"
  const typeMatch = cleanText.match(/(.+) deb yoz$/) || cleanText.match(/^yoz (.+)$/);
  if (typeMatch) {
    const textParam = typeMatch[1].trim();
    return {
      type: 'TYPE_TEXT',
      command: COMMANDS_MAP.TYPE_TEXT,
      param: textParam,
      raw: text
    };
  }

  // 11. Qo'ng'iroq qil [ism/raqam]ga (MAKE_CALL)
  // Masalan: "Qo'ng'iroq qil Akmalga" -> param: "Akmal", "tel qil 998901234567ga" -> param: "998901234567"
  const callMatch = cleanText.match(/qo'ng'iroq qil (.+)(ga|qa)?$/) || cleanText.match(/tel qil (.+)(ga|qa)?$/) || cleanText.match(/^call (.+)$/);
  if (callMatch) {
    let target = callMatch[1].trim();
    // Agar "akmalga" deb aytgan bo'lsa, "ga" qismini olib tashlaymiz
    if (target.endsWith('ga') || target.endsWith('qa')) {
      target = target.substring(0, target.length - 2).trim();
    }
    return {
      type: 'MAKE_CALL',
      command: COMMANDS_MAP.MAKE_CALL,
      param: target,
      raw: text
    };
  }

  // 15. [N] minutga taymer qo'y (SET_TIMER)
  // Masalan: "5 minutga taymer qo'y" -> param: 5, "10 daqiqaga taymer qo'y" -> param: 10
  const timerMatch = cleanText.match(/(\d+)\s*(minut|daqiqa|sekund|soniya|soat)ga\s*taymer\s*qo'y/i) || cleanText.match(/taymer\s*qo'y\s*(\d+)\s*(minut|daqiqa)/i);
  if (timerMatch) {
    const value = parseInt(timerMatch[1]);
    const unit = timerMatch[2] || 'minut';
    return {
      type: 'SET_TIMER',
      command: COMMANDS_MAP.SET_TIMER,
      param: { value, unit },
      raw: text
    };
  }

  // 7. [Ilova]ni och (OPEN_APP) - boshqa har qanday ilova nomi ochilishi so'ralsa
  // Masalan: "Telegramni och", "Tiktokni och" (YouTube, Galereya, Instagram bepul, yuqorida tutilgan)
  const openMatch = cleanText.match(/^(.+)(ni|ni\s+|i)\s*och$/) || cleanText.match(/^och (.+)$/);
  if (openMatch) {
    let appName = openMatch[1].trim();
    if (appName.endsWith('ni')) {
      appName = appName.substring(0, appName.length - 2).trim();
    }
    return {
      type: 'OPEN_APP',
      command: COMMANDS_MAP.OPEN_APP,
      param: appName,
      raw: text
    };
  }

  // Agar umuman tushunilmagan bo'lsa
  return null;
}
