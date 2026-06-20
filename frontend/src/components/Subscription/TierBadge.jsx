import React from 'react';
import { Crown, Star } from 'lucide-react';

export default function TierBadge({ tier, onClick }) {
  const isPremium = tier === 'premium';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: isPremium 
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(168, 85, 247, 0.15))' 
          : 'rgba(255, 255, 255, 0.05)',
        border: isPremium 
          ? '1px solid rgba(245, 158, 11, 0.3)' 
          : '1px solid rgba(255, 255, 255, 0.08)',
        color: isPremium ? '#fbbf24' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'var(--font-title)',
        boxShadow: isPremium ? '0 0 10px rgba(245, 158, 11, 0.15)' : 'none',
        transition: 'all 0.3s ease',
        outline: 'none'
      }}
      title={isPremium ? "Premium foydalanuvchi" : "Bepul tarif (Premiumga o'tish)"}
    >
      {isPremium ? (
        <>
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Premium 👑</span>
        </>
      ) : (
        <>
          <Star className="w-3.5 h-3.5 text-slate-400" />
          <span>Free Plan</span>
        </>
      )}
    </button>
  );
}
