/**
 * SeatAvatarOverlay.tsx
 * Booked seat avatar displayed on the seat map.
 *
 * Privacy rules:
 *  - isPrivate=true (not your own seat): shows lock icon, name = "Private Account",
 *    no Profile navigation, no Chat button.
 *  - isMe=true: green border, "My Profile" → own dashboard
 *  - Otherwise: purple border, "Profile" → their profile, + "Chat" button
 */
import React, { useState } from 'react';
import { SeatMateUser } from '../../services/apiService';

interface Props {
  seatId: string;
  user: SeatMateUser;
  onViewProfile: (userId: string) => void;
  onMessage: (userId: string, name: string, avatar: string) => void;
}

export const SeatAvatarOverlay: React.FC<Props> = ({ seatId, user, onViewProfile, onMessage }) => {
  const [hover, setHover] = useState(false);

  // Private account (and not my own seat) — restricted view
  const isRestricted = !!user.isPrivate && !user.isMe;

  const borderColor = user.isMe
    ? '#22c55e'
    : isRestricted
      ? 'rgba(245,158,11,0.6)'
      : 'rgba(168,85,247,0.8)';

  const glowColor = user.isMe
    ? 'rgba(34,197,94,0.5)'
    : isRestricted
      ? 'rgba(245,158,11,0.3)'
      : 'rgba(168,85,247,0.45)';

  const handleProfileClick = () => {
    if (isRestricted) return;          // blocked — private user
    onViewProfile(String(user.userId));
  };

  const avatarBg = isRestricted
    ? 'linear-gradient(135deg,#78350f,#d97706)'   // amber for private
    : user.isMe
      ? 'linear-gradient(135deg,#15803d,#22c55e)' // green for self
      : 'linear-gradient(135deg,#4f46e5,#a855f7)';// purple for others

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Seat avatar circle ───────────────────────────────────────────── */}
      <div
        onClick={handleProfileClick}
        title={
          isRestricted
            ? `${seatId} — 🔒 Private Account`
            : user.isMe
              ? `${seatId} — Your seat 🎉 (click to open your profile)`
              : `${user.name} — click to view profile`
        }
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: user.avatar && !isRestricted ? 'transparent' : avatarBg,
          border: `2px solid ${borderColor}`,
          overflow: 'hidden',
          cursor: isRestricted ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: '#fff',
          boxShadow: `0 0 8px ${glowColor}`,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: hover ? 'scale(1.35)' : 'scale(1)',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {isRestricted ? (
          <span style={{ fontSize: 10 }}>🔒</span>
        ) : user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* ── Hover popover ────────────────────────────────────────────────── */}
      {hover && (
        <div style={{
          position: 'absolute', bottom: '130%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(8,4,24,0.97)',
          border: `1px solid ${isRestricted ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.3)'}`,
          borderRadius: 16, padding: '12px 14px',
          minWidth: 170, zIndex: 9999,
          boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
          backdropFilter: 'blur(24px)',
          animation: 'sa-in 0.15s ease',
          whiteSpace: 'nowrap',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -7, left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `7px solid ${isRestricted ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.3)'}`,
          }} />

          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: user.avatar && !isRestricted ? 'transparent' : avatarBg,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff',
              border: `2px solid ${borderColor}`,
            }}>
              {isRestricted ? '🔒' : user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                       onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{
                color: isRestricted ? '#d97706' : 'white',
                fontWeight: 800, fontSize: 12,
                fontFamily: "'Outfit',sans-serif",
                maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user.isMe ? 'You' : user.name}
              </div>
              <div style={{ color: isRestricted ? '#92400e' : '#a78bfa', fontSize: 10 }}>
                {user.username.startsWith('🔒') ? user.username : `@${user.username}`}
              </div>
            </div>
          </div>

          {/* Seat badge */}
          <div style={{
            color: '#475569', fontSize: 9, fontWeight: 700,
            marginBottom: 10, textAlign: 'center',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Seat {seatId}
          </div>

          {/* ── Action buttons ── */}
          {isRestricted ? (
            /* Private account — show lock notice, no actions */
            <div style={{
              textAlign: 'center', padding: '8px 4px',
              color: '#92400e', fontSize: 11, fontWeight: 700,
              background: 'rgba(245,158,11,0.08)',
              borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)',
            }}>
              🔒 Private Account<br />
              <span style={{ color: '#78350f', fontSize: 10, fontWeight: 400 }}>
                Profile & chat restricted
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Profile button */}
              <button
                onClick={handleProfileClick}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a78bfa', fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.32)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)'; }}
              >
                {user.isMe ? '🪞 My Profile' : '👤 Profile'}
              </button>

              {/* Chat button — only for OTHER non-private users */}
              {!user.isMe && (
                <button
                  onClick={() => onMessage(String(user.userId), user.name, user.avatar)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 10,
                    background: 'rgba(16,185,129,0.13)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34d399', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.28)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.13)'; }}
                >
                  💬 Chat
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes sa-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};
