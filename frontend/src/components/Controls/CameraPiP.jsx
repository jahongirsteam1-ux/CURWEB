import React from 'react';
import { Camera, CameraOff } from 'lucide-react';

export default function CameraPiP({ videoRef, canvasRef, isActive, error, onStart }) {
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 9999,
      width: '120px',
      height: '160px',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Video Container */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        {isActive ? (
          <>
            {/* Safari requires video to be visible and have playsInline/autoPlay */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Oyna (mirror) effekti
              }}
            />
            {/* MediaPipe qol harakatlarini chizish uchun canvas */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {error ? <CameraOff className="w-8 h-8 text-rose-400" /> : <Camera className="w-8 h-8 opacity-50" />}
          </div>
        )}
      </div>

      {/* Boshqaruv paneli */}
      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {isActive && !error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#fff' }}>Faol</span>
          </div>
        ) : error ? (
          <span style={{ fontSize: '10px', color: '#f87171', padding: '0 4px', textAlign: 'center' }}>Xatolik</span>
        ) : (
          <button 
            onClick={onStart}
            style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            Yoqish
          </button>
        )}
      </div>
    </div>
  );
}
