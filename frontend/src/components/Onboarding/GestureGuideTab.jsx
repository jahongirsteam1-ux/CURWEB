import React from 'react';
import { Move, Touchpad, Hand, Sparkles, Eye, Check } from 'lucide-react';

export default function GestureGuideTab() {
  const gestures = [
    {
      name: "Cursor Harakati (Pointer)",
      icon: <Move className="w-5 h-5 text-indigo-400" />,
      desc: "Ko'rsatkich barmoqni cho'zib, boshqalarini buking. Kursor sizning barmoq uchingizga ergashadi.",
      result: "Kursorni boshqarish (titrashlarsiz silliq harakat)"
    },
    {
      name: "Bosish (Tap/Click)",
      icon: <Touchpad className="w-5 h-5 text-emerald-400" />,
      desc: "Ko'rsatkich va bosh barmoqlarni tez birlashtirib ajrating (Pinch).",
      result: "Elementlar ustiga bosish (Click)"
    },
    {
      name: "Sudrab yurish (Drag/Swipe)",
      icon: <Hand className="w-5 h-5 text-amber-400" />,
      desc: "Barmoqlarni birlashtirib (Pinch) ushlab turgan holda qo'lingizni harakatlantiring.",
      result: "Oynani siljitish yoki slayderlarni boshqarish"
    },
    {
      name: "Masshtab (Zoom / Pan)",
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      desc: "Ikki qo'l ko'rsatkich barmog'ini ko'rsatib, masofasini yaqinlashtiring/uzoqlashtiring.",
      result: "Pinch-to-zoom (rasm yoki xaritalarni kattalashtirish)"
    },
    {
      name: "Sahifani aylantirish (Scroll)",
      icon: <Eye className="w-5 h-5 text-sky-400" />,
      desc: "Kaftingizni to'liq ochib, tepadan pastga yoki pastdan tepaga tez harakatlantiring.",
      result: "Sahifani scroll qilish"
    },
    {
      name: "Uzoq bosish (Long Press)",
      icon: <Check className="w-5 h-5 text-rose-400" />,
      desc: "Qo'lingizni musht (fist) qilib 1 soniya davomida ushlab turing.",
      result: "Kontekst menyuni ochish / Uzoq bosish"
    }
  ];

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
        Kamera orqali qo'l harakatlaringizni kuzatib, ekranga tegmasdan quyidagi imo-ishoralar yordamida boshqarishingiz mumkin:
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gestures.map((g, idx) => (
          <div key={idx} className="glass" style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '15px' }}>
              {g.icon}
              {g.name}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4' }}>
              {g.desc}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--accent-primary)', 
              background: 'rgba(99, 102, 241, 0.1)', 
              padding: '4px 8px', 
              borderRadius: '6px',
              alignSelf: 'flex-start',
              marginTop: '4px'
            }}>
              Natija: {g.result}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
