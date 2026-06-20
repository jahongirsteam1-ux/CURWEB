import React from 'react';

export default function CursorOverlay({ cursor, gesture, multitouchPoints }) {
  if (!cursor || !cursor.visible) return null;

  // Imo-ishoralarga qarab kursor klassini aniqlaymiz
  let gestureClass = '';
  let gestureLabel = 'Kursor';

  if (gesture === 'pinch') {
    gestureClass = 'clicking';
    gestureLabel = 'Bosish (Pinch)';
  } else if (gesture === 'drag') {
    gestureClass = 'dragging';
    gestureLabel = 'Drag / Swipe';
  } else if (gesture === 'fist') {
    gestureClass = 'long-pressing';
    gestureLabel = 'Long Press (Musht)';
  } else if (gesture === 'scroll') {
    gestureLabel = 'Aylantirish (Scroll)';
  } else if (gesture === 'pointer_move') {
    gestureLabel = 'Harakat (Pointer)';
  }

  return (
    <>
      {/* Asosiy virtual kursor */}
      <div 
        className={`virtual-cursor ${gestureClass}`}
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`
        }}
      >
        {/* Kursor yordamchi matni */}
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 10, 15, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#fff',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        }}>
          {gestureLabel}
        </div>
      </div>

      {/* Multitouch virtual barmoqlari (Agar zoom/pan rejimida bo'lsa) */}
      {multitouchPoints && multitouchPoints.map((point, idx) => (
        <div
          key={idx}
          className="virtual-cursor"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            background: 'var(--accent-secondary)',
            boxShadow: '0 0 12px var(--accent-secondary)',
            width: '15px',
            height: '15px',
            opacity: 0.8
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--accent-secondary)',
            fontSize: '9px',
            fontWeight: '600'
          }}>
            Barmoq {idx + 1}
          </div>
        </div>
      ))}
    </>
  );
}
