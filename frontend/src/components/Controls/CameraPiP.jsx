import React, { useState } from 'react';
import { Camera, CameraOff, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

export default function CameraPiP({ videoRef, canvasRef, isActive, fps, error, onStart, onStop }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState('top-right'); // 'top-right' | 'bottom-right'

  const togglePosition = () => {
    setPosition(prev => prev === 'top-right' ? 'bottom-right' : 'top-right');
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 9999,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    };

    const pos = position === 'top-right' 
      ? { top: '16px', right: '16px' } 
      : { bottom: '80px', right: '16px' }; // bottom navigation-dan teparoqda

    const size = isMinimized
      ? { width: '80px', height: '60px' }
      : { width: '160px', height: '120px' };

    return { ...baseStyles, ...pos, ...size };
  };

  return (
    <div className="glass" style={getPositionStyles()}>
      {/* Kichik boshqaruv paneli */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '24px',
        background: 'rgba(10, 10, 15, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isActive && !error ? 'var(--success)' : 'var(--danger)',
            display: 'inline-block'
          }}></span>
          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {isActive && !error ? `${fps} FPS` : 'Off'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={togglePosition}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            title="Joylashuvni o'zgartirish"
          >
            <RefreshCw className="w-3 h-3 text-slate-400 hover:text-white" />
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            title={isMinimized ? "Kattalashtirish" : "Kichiklashtirish"}
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3 text-slate-400 hover:text-white" />
            ) : (
              <Minimize2 className="w-3 h-3 text-slate-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Video va Canvas oqimi */}
      <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror qilish
              }}
            />
            <canvas
              ref={canvasRef}
              width={160}
              height={120}
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
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            padding: '12px'
          }}>
            {!isMinimized && (
              <>
                {error ? (
                  <CameraOff className="w-6 h-6 text-rose-400" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-500" />
                )}
                <button 
                  onClick={onStart}
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Yoqish
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Xatolik xabari */}
      {error && !isMinimized && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          fontSize: '8px',
          padding: '4px',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
