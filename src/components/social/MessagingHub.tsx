/**
 * src/components/social/MessagingHub.tsx
 * Premium "Antigravity" messaging hub — conversation list with glow effects.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ConversationSummary, apiGetConversations } from '../../services/apiService';
import { ChatWindow } from './ChatWindow';

interface Props {
  currentUserId: string;
  onClose: () => void;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@keyframes mh-slide  { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
@keyframes mh-row    { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes mh-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes mh-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
@keyframes mh-glow   { 0%,100%{box-shadow:0 0 12px rgba(139,92,246,.4)} 50%{box-shadow:0 0 32px rgba(139,92,246,.9)} }
@keyframes mh-orb    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,15px) scale(1.1)} }
.mh-scroll::-webkit-scrollbar{width:4px;background:transparent}
.mh-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,.25);border-radius:4px}
.mh-scroll::-webkit-scrollbar-thumb:hover{background:rgba(139,92,246,.5)}
`;

function injectStyles() {
  if (!document.getElementById('mh-ag-styles')) {
    const s = document.createElement('style');
    s.id = 'mh-ag-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }
}

function Avatar({ name, avatar, size = 48 }: { name: string; avatar?: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (avatar && !err) return (
    <img src={avatar} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
        boxShadow: '0 4px 16px rgba(0,0,0,.5)' }} />
  );
  const colors = ['#7c3aed,#4f46e5','#e11d48,#be185d','#059669,#10b981','#d97706,#f59e0b','#0284c7,#38bdf8'];
  const pick = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${pick})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: 'white',
      boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch { return ''; }
}

export const MessagingHub: React.FC<Props> = ({ currentUserId, onClose }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading]            = useState(true);
  const [activeConvo, setActiveConvo]    = useState<ConversationSummary | null>(null);
  const [search, setSearch]              = useState('');

  const load = useCallback(async () => {
    const res = await apiGetConversations();
    if (res.ok && res.data?.conversations) setConversations(res.data.conversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    injectStyles();
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  if (activeConvo) {
    return (
      <ChatWindow
        conversation={activeConvo}
        currentUserId={currentUserId}
        onClose={onClose}
        onBack={() => { setActiveConvo(null); load(); }}
      />
    );
  }

  const filtered = conversations.filter(c =>
    !search || c.otherUser?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9200,
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'flex-end',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, height: '100%',
        background: 'linear-gradient(160deg,rgba(12,8,28,.99) 0%,rgba(7,4,18,.99) 100%)',
        borderLeft: '1px solid rgba(139,92,246,.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'mh-slide .35s cubic-bezier(.22,1,.36,1) both',
        boxShadow: '-30px 0 120px rgba(0,0,0,.8), -10px 0 60px rgba(124,58,237,.08)',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Background orbs */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 250, height: 250,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 70%)',
          animation: 'mh-orb 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 100, left: -80, width: 200, height: 200,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,.1) 0%,transparent 70%)',
          animation: 'mh-orb 11s 3s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* ── Header ── */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14,
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                boxShadow: '0 6px 24px rgba(124,58,237,.5)',
                animation: 'mh-glow 3s ease-in-out infinite' }}>
                💬
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.1 }}>Messages</h2>
                <p style={{ color: '#475569', fontSize: '0.68rem', fontWeight: 600, marginTop: 1 }}>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              color: '#64748b', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.2)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
              ✕
            </button>
          </div>

          {/* Gradient bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#818cf8,transparent)',
            borderRadius: 999, marginBottom: 14 }} />

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 2 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 14,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)',
                color: 'white', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.09)'} />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.9rem', pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
          </div>
        </div>

        {/* ── Conversation list ── */}
        <div className="mh-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 0 12px', marginTop: 10 }}>
          {loading ? (
            <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"
                style={{ animation: 'mh-spin .8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ fontSize: '3.5rem', animation: 'mh-pulse 2s ease-in-out infinite' }}>💬</div>
              <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                {search ? 'No results found' : 'No conversations yet'}
              </p>
              <p style={{ color: '#1e293b', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.6 }}>
                Browse your bookings → click on a fellow movie-goer<br />to start chatting!
              </p>
            </div>
          ) : (
            filtered.map((c, idx) => {
              const other = c.otherUser;
              const isMovieMsg = c.lastMessage.startsWith('🎬');
              const isPhotoMsg = c.lastMessage.startsWith('📷');
              return (
                <div key={c.id}
                  onClick={() => setActiveConvo(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 20px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                    transition: 'all .2s',
                    animation: `mh-row .35s ${Math.min(idx, 8) * 50}ms ease both`,
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(139,92,246,.07)';
                    el.style.borderLeft = '3px solid rgba(139,92,246,.5)';
                    el.style.paddingLeft = '17px';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'transparent';
                    el.style.borderLeft = 'none';
                    el.style.paddingLeft = '20px';
                  }}>
                  {/* Avatar with online dot */}
                  <div style={{ position: 'relative' }}>
                    <Avatar name={other?.name ?? '?'} avatar={other?.avatar} size={48} />
                    <div style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 13, height: 13, borderRadius: '50%',
                      background: '#22c55e', border: '2.5px solid rgba(7,4,18,.99)',
                      boxShadow: '0 0 8px rgba(34,197,94,.8)',
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                        {other?.name ?? 'User'}
                      </p>
                      <span style={{ color: '#334155', fontSize: '0.62rem', flexShrink: 0, fontWeight: 600 }}>
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <p style={{
                      color: isMovieMsg ? '#a78bfa' : isPhotoMsg ? '#60a5fa' : (c.lastMessage ? '#64748b' : '#334155'),
                      fontSize: '0.76rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontStyle: c.lastMessage ? 'normal' : 'italic',
                    }}>
                      {c.lastMessage || 'Start a conversation…'}
                    </p>
                  </div>

                  <div style={{ color: '#7c3aed', fontSize: '1rem', flexShrink: 0 }}>›</div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,.06)',
          background: 'rgba(255,255,255,.02)',
          flexShrink: 0,
        }}>
          <p style={{ color: '#1e293b', fontSize: '0.64rem', textAlign: 'center', lineHeight: 1.6 }}>
            💬 Text · 📷 Images · 🎬 Movies — all backed by MongoDB
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessagingHub;
