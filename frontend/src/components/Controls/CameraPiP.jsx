import React from 'react';
import { Camera, CameraOff } from 'lucide-react';

export default function CameraPiP({ videoRef, canvasRef, isActive, error, onStart }) {
  return (
    <>
      {/* MediaPipe uchun video va canvas - Safari o'chirib qo'ymasligi uchun ekranda, lekin orqada yashiringan */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '10px', height: '10px', zIndex: -9999, opacity: 0.01, overflow: 'hidden', pointerEvents: 'none' }}>
        {isActive && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '320px', height: '240px' }}
            />
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
            />
          </>
        )}
      </div>

      {/* Foydalanuvchiga ko'rinadigan indikator */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        background: isActive && !error ? 'rgba(16, 185, 129, 0.9)' : 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
      }}>
        {isActive && !error ? (
          <>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Kameraga ulandi</span>
          </>
        ) : error ? (
          <>
            <CameraOff className="w-4 h-4 text-rose-400" />
            <span style={{ fontSize: '12px', color: '#f87171' }}>Xatolik</span>
          </>
        ) : (
          <button 
            onClick={onStart}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Camera className="w-4 h-4 text-slate-300" />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Kamerani yoqish</span>
          </button>
        )}
      </div>
    </>
  );
}
