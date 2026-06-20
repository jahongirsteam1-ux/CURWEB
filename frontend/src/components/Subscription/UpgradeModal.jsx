import React, { useState } from 'react';
import { X, Sparkles, Check, Crown, CreditCard } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API orqali obunani yangilash
      const headers = { 'Content-Type': 'application/json' };
      
      // Agar Telegramda bo'lsa, headerga initData qo'shamiz
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      }

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Obunani faollashtirishda xatolik yuz berdi.');
      }

      if (data.success) {
        if (onUpgradeSuccess) {
          onUpgradeSuccess(data.subscription_tier, data.subscription_expires_at);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    "Jami 15 ta ovozli buyruqlar (10 ta yangi)",
    "Dinamik ilovalarni ochish (CurWeb Telegramni och)",
    "Matn yozish (CurWeb [matn] deb yoz)",
    "Kontaktlarga qo'ng'iroq qilish (CurWeb qo'ng'iroq qil)",
    "Pinch-to-click va sudrab yurish (Drag)",
    "Ikki qo'l orqali multitouch (Zoom/Pan)",
    "Wi-Fi va Ekran yorug'ligini boshqarish",
    "Cheksiz ovozli so'rovlar oqimi"
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999999,
      padding: '16px'
    }}>
      <div className="glass animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 0 30px rgba(168, 85, 247, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Crown className="w-6 h-6 text-purple-400" />
            <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
              Premium Plan
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
            border: '1px solid rgba(168, 85, 247, 0.15)',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: '700', letterSpacing: '1px' }}>
              Qulay Imkoniyatlar
            </span>
            <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0', fontFamily: 'var(--font-title)' }}>
              $2.99 <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-secondary)' }}>/ oy</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              (Hozircha test rejimida - obuna tekin va bir zumda yoqiladi!)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {premiumFeatures.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span style={{ color: 'var(--text-primary)' }}>{feature}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            className="btn-glow"
            onClick={handleUpgrade}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              height: '48px',
              fontSize: '16px'
            }}
          >
            {isLoading ? (
              <span>Yuklanmoqda...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Premiumga o'tish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
