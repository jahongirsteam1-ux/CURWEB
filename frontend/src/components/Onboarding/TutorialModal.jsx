import React, { useState } from 'react';
import { X, Sparkles, Hand, Mic } from 'lucide-react';
import GestureGuideTab from './GestureGuideTab';
import VoiceGuideTab from './VoiceGuideTab';

export default function TutorialModal({ isOpen, onClose, onTrySandbox }) {
  const [activeTab, setActiveTab] = useState('sensor'); // 'sensor' | 'voice'
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('curweb_hide_tutorial', 'true');
    }
    onClose();
  };

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
      zIndex: 999999,
      padding: '16px'
    }}>
      <div className="glass animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
              Qo'llanma va Yo'riqnoma
            </h2>
          </div>
          <button 
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <button 
            onClick={() => setActiveTab('sensor')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sensor' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'sensor' ? '#fff' : 'var(--text-secondary)',
              fontFamily: 'var(--font-title)',
              fontWeight: activeTab === 'sensor' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Hand className="w-4 h-4" /> Sensor Boshqaruv
          </button>
          <button 
            onClick={() => setActiveTab('voice')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'voice' ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              color: activeTab === 'voice' ? '#fff' : 'var(--text-secondary)',
              fontFamily: 'var(--font-title)',
              fontWeight: activeTab === 'voice' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Mic className="w-4 h-4" /> Ovozli Boshqaruv
          </button>
        </div>

        {/* Content Area */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {activeTab === 'sensor' ? (
            <GestureGuideTab />
          ) : (
            <VoiceGuideTab />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer'
              }}
            />
            Boshqa ko'rsatma
          </label>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary"
              onClick={() => {
                handleClose();
                if (onTrySandbox) onTrySandbox();
              }}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Sinab ko'rish
            </button>
            <button 
              className="btn-glow"
              onClick={handleClose}
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Tushundim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
