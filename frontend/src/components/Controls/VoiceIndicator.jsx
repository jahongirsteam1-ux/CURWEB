import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export default function VoiceIndicator({ isSupported, isListening, activeState, lastCommand, error, onToggle }) {
  if (!isSupported) {
    return (
      <div className="glass" style={{
        padding: '12px 16px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        background: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#f87171',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <MicOff className="w-5 h-5" />
        <div>
          <strong>Ovozli tizim ishlamaydi:</strong> Web Speech API brauzeringizda yo'q.
        </div>
      </div>
    );
  }

  return (
    <div className="glass" style={{
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: activeState === 'listening' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-color)',
      boxShadow: activeState === 'listening' ? '0 0 20px rgba(168, 85, 247, 0.2)' : 'var(--glass-shadow)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Glowing Mic button */}
          <button
            onClick={onToggle}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: isListening 
                ? (activeState === 'listening' ? 'var(--accent-glow)' : 'var(--accent-primary)') 
                : 'var(--bg-tertiary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening 
                ? `0 0 15px ${activeState === 'listening' ? 'var(--accent-secondary)' : 'var(--accent-primary)'}` 
                : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title={isListening ? "Ovozli tizimni o'chirish" : "Ovozli tizimni yoqish"}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <MicOff className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600' }}>
              {!isListening ? "Ovozli boshqaruv o'chirilgan" : (
                activeState === 'listening' ? "Eshitaman..." : "Salom CurWeb deb ayting"
              )}
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {!isListening ? "Faollashtirish uchun tugmani bosing" : (
                activeState === 'listening' ? "Buyruq berishingiz mumkin (4s)" : "Fonda eshitilmoqda..."
              )}
            </p>
          </div>
        </div>

        {/* Eshitish to'lqinlari (wave animation) */}
        {isListening && activeState === 'listening' && (
          <div className="wave-container">
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
          </div>
        )}
      </div>

      {/* Oxirgi aniqlangan buyruq */}
      {lastCommand && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '10px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Volume2 className="w-4 h-4 text-purple-400" />
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Buyruq:</span>{' '}
            <span style={{ color: '#fff', fontWeight: '500' }}>"{lastCommand.raw}"</span>
            {lastCommand.success !== undefined && (
              <span style={{
                marginLeft: '8px',
                fontSize: '10px',
                color: lastCommand.success ? 'var(--success)' : 'var(--danger)',
                background: lastCommand.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {lastCommand.success ? 'Bajarildi' : (lastCommand.error === 'premium_required' ? 'Premium kerak' : 'Xato')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Xatoliklar */}
      {error && (
        <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
