import React from 'react';
import { Sparkles } from 'lucide-react';

export default function VoiceGuideTab() {
  const voiceCommands = {
    free: [
      { cmd: "CurWeb ovozni ko'tar", desc: "Tizim / Media ovozini balandroq qiladi" },
      { cmd: "CurWeb ovozni tushir", desc: "Ovozni pasaytiradi" },
      { cmd: "CurWeb YouTube'ni och", desc: "YouTube veb-saytini yangi tabda ochadi" },
      { cmd: "CurWeb galereyani och", desc: "Telefon yoki brauzer galereyasini ochadi" },
      { cmd: "CurWeb Instagram'ni och", desc: "Instagram sahifasini ochadi" }
    ],
    premium: [
      { cmd: "CurWeb skrinshot ol", desc: "Ekran rasmini oladi va saqlaydi" },
      { cmd: "CurWeb [ilova nomi]ni och", desc: "Masalan: 'CurWeb Telegramni och' - istalgan ilovani ochish" },
      { cmd: "CurWeb orqaga qaytar", desc: "Brauzerda orqaga qaytish funksiyasi" },
      { cmd: "CurWeb bosh ekranga qaytar", desc: "Asosiy oynaga qaytish simulyatsiyasi" },
      { cmd: "CurWeb [matn] deb yoz", desc: "Fokuslangan maydonga aytilgan gapni avtomatik yozadi" },
      { cmd: "CurWeb qo'ng'iroq qil [ism/raqam]ga", desc: "Kontaktga yoki raqamga telefon qiladi" },
      { cmd: "CurWeb pastga aylantir", desc: "Sahifani pastga o'tkazadi (Scroll Down)" },
      { cmd: "CurWeb yuqoriga aylantir", desc: "Sahifani tepaga o'tkazadi (Scroll Up)" },
      { cmd: "CurWeb yorug'likni o'chir / yoq", desc: "Ekran yorug'ligini boshqarish" },
      { cmd: "CurWeb Wi-Fi'ni yoq / o'chir", desc: "Tezkor Wi-Fi sozlamalarini boshqarish" },
      { cmd: "CurWeb [N] minutga taymer qo'y", desc: "Belgilangan daqiqaga taymer/budilnik o'rnatish" }
    ]
  };

  return (
    <div>
      <div style={{
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles className="w-4 h-4 text-purple-400" />
          Wake-Word Uyg'otish Mexanizmi
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          Tizim doimiy fonda eshitadi. Uni faollashtirish uchun <strong>"Salom CurWeb"</strong> deb ayting.
          Faol holatga o'tgach (vibratsiya va mikrofon yonishi bilan), 4-5 soniya ichida quyidagi buyruqlardan birini ayting:
        </p>
      </div>

      {/* Bepul buyruqlar */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: '600' }}>
          Bepul buyruqlar (5 ta)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {voiceCommands.free.map((c, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '13px', color: '#fff' }}>"{c.cmd}"</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium buyruqlar */}
      <div>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-secondary)', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Premium buyruqlar (10 ta) 🔒
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {voiceCommands.premium.map((c, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              background: 'rgba(168, 85, 247, 0.03)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '13px', color: '#f3e8ff' }}>"{c.cmd}"</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.desc}</div>
              </div>
              <span style={{ fontSize: '12px' }}>🔒</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
