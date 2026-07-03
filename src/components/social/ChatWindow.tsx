/**
 * src/components/social/ChatWindow.tsx
 * Premium "Antigravity" chat window — text, image uploads, movie sharing.
 * Glassmorphism dark theme · floating bubbles · smooth micro-animations.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage, MovieMessageData, ConversationSummary,
  apiGetMessages, apiSendMessage, apiSendImageMessage,
  apiSendMovieMessage, apiUploadChatImage,
} from '../../services/apiService';
import { useApp } from '../../context/AppContext';

interface Props {
  conversation: ConversationSummary;
  currentUserId: string;
  onClose: () => void;
  onBack?: () => void;
}

/* ── Keyframes ─────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@keyframes ag-float    { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes ag-in       { from{opacity:0;transform:translateY(40px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes ag-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes ag-dot      { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
@keyframes ag-glow     { 0%,100%{box-shadow:0 0 20px rgba(139,92,246,.4)} 50%{box-shadow:0 0 40px rgba(139,92,246,.8)} }
@keyframes ag-pop      { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes ag-shake    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
@keyframes ag-imgload  { from{filter:blur(20px) brightness(.5)} to{filter:blur(0) brightness(1)} }
@keyframes ag-expand   { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
@keyframes ag-ripple   { 0%{transform:scale(0);opacity:1} 100%{transform:scale(3);opacity:0} }
.ag-scrollbar::-webkit-scrollbar{width:4px;background:transparent}
.ag-scrollbar::-webkit-scrollbar-thumb{background:rgba(139,92,246,.3);border-radius:4px}
.ag-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(139,92,246,.6)}
`;

function injectStyles() {
  if (!document.getElementById('ag-chat-styles')) {
    const s = document.createElement('style');
    s.id = 'ag-chat-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return ''; }
}
function formatDateLabel(iso: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

/* ── Avatar ────────────────────────────────────────────────────────────────── */
function Avatar({ name, avatar, size = 36 }: { name: string; avatar?: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (avatar && !err) return (
    <img src={avatar} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,.5)' }} />
  );
  const colors = ['#7c3aed,#4f46e5','#e11d48,#be185d','#059669,#10b981','#d97706,#f59e0b','#0284c7,#38bdf8'];
  const pick = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${pick})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

/* ── ImageMessage ──────────────────────────────────────────────────────────── */
function ImageMessage({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <div onClick={() => setExpanded(true)} style={{ cursor: 'zoom-in', position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
        <img src={url} alt="Shared" onLoad={() => setLoaded(true)}
          style={{ maxWidth: 240, maxHeight: 280, display: 'block', borderRadius: 16,
            animation: loaded ? 'ag-imgload .4s ease both' : 'none',
            filter: loaded ? 'none' : 'blur(20px) brightness(.5)',
            transition: 'filter .4s', cursor: 'zoom-in' }} />
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2"
              style={{ animation: 'ag-spin .8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
            </svg>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,.5)', borderRadius: 6, padding: '2px 6px',
          fontSize: '0.6rem', color: 'rgba(255,255,255,.8)', backdropFilter: 'blur(4px)' }}>
          🔍 Tap to expand
        </div>
      </div>

      {/* Lightbox */}
      {expanded && (
        <div onClick={() => setExpanded(false)} style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,.93)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'ag-expand .2s ease both',
        }}>
          <img src={url} alt="Expanded"
            style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 16,
              boxShadow: '0 40px 120px rgba(0,0,0,.9)' }} />
          <button onClick={() => setExpanded(false)} style={{
            position: 'absolute', top: 20, right: 20,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            color: 'white', fontSize: '1.2rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      )}
    </>
  );
}

/* ── MovieCard ─────────────────────────────────────────────────────────────── */
function MovieCard({ data, onView }: { data: MovieMessageData; onView?: (d: MovieMessageData) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: 220, borderRadius: 16, overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
        border: `1px solid ${hover ? 'rgba(139,92,246,.5)' : 'rgba(255,255,255,.1)'}`,
        transition: 'all .25s', transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 16px 40px rgba(139,92,246,.25)' : '0 4px 16px rgba(0,0,0,.4)' }}>
      {data.poster && (
        <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
          <img src={data.poster} alt={data.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform .4s', transform: hover ? 'scale(1.08)' : 'none' }} />
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.8))' }} />
          <div style={{ position: 'absolute', top: 8, left: 8,
            background: 'rgba(139,92,246,.85)', borderRadius: 6, padding: '2px 8px',
            fontSize: '0.62rem', color: 'white', fontWeight: 700 }}>🎬 MOVIE</div>
        </div>
      )}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem',
          marginBottom: 4, lineHeight: 1.3 }}>{data.title}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {data.year && <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>📅 {data.year}</span>}
          {data.genre && <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>🎭 {data.genre}</span>}
          {data.rating && <span style={{ color: '#fbbf24', fontSize: '0.68rem' }}>⭐ {data.rating}</span>}
        </div>
        <button onClick={() => onView?.(data)}
          style={{ width: '100%', padding: '6px 0', borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', color: 'white', fontWeight: 700, fontSize: '0.72rem',
            cursor: 'pointer', transition: 'opacity .2s',
            boxShadow: '0 4px 12px rgba(124,58,237,.4)' }}>
          View Movie →
        </button>
      </div>
    </div>
  );
}

/* ── MoviePicker ───────────────────────────────────────────────────────────── */
function MoviePicker({ movies, onSelect, onClose }: {
  movies: any[];
  onSelect: (m: MovieMessageData) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(q.toLowerCase()) ||
    (m.genre || '').toLowerCase().includes(q.toLowerCase())
  ).slice(0, 24);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 0 0',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, maxHeight: '75vh',
        background: 'linear-gradient(180deg,rgba(15,10,35,.99) 0%,rgba(8,5,20,.99) 100%)',
        border: '1px solid rgba(255,255,255,.1)', borderRadius: '24px 24px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -20px 80px rgba(0,0,0,.7), 0 0 60px rgba(124,58,237,.1)',
        animation: 'ag-in .3s cubic-bezier(.22,1,.36,1) both',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.2)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>🎬</span>
              <div>
                <p style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>Share a Movie</p>
                <p style={{ color: '#475569', fontSize: '0.68rem' }}>Pick from the CineConnect library</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.08)', border: 'none',
              width: 32, height: 32, borderRadius: '50%', color: '#64748b',
              cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search movies…"
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 12,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: 'white', fontSize: '0.86rem', outline: 'none',
                boxSizing: 'border-box' }} />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
          </div>
        </div>

        {/* Movie Grid */}
        <div className="ag-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: '0.85rem' }}>
              No movies found
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.map(m => (
                <div key={m.id || m._id}
                  onClick={() => onSelect({ movieId: m.id || m._id, title: m.title, poster: m.poster || '', year: m.year || '', genre: m.genre || '', rating: m.rating?.toString() || '' })}
                  style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,.08)',
                    transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)'; }}>
                  <div style={{ height: 80, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
                    {m.poster && <img src={m.poster} alt={m.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '6px 8px 8px' }}>
                    <p style={{ color: 'white', fontSize: '0.68rem', fontWeight: 700,
                      lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Status ticks ──────────────────────────────────────────────────────────── */
function StatusTick({ status }: { status: string }) {
  const col = status === 'seen' ? '#818cf8' : status === 'delivered' ? '#94a3b8' : '#475569';
  if (status === 'sent') return <span style={{ color: col, fontSize: '0.6rem' }}>✓</span>;
  return <span style={{ color: col, fontSize: '0.6rem' }}>✓✓</span>;
}

/* ── Main ChatWindow ───────────────────────────────────────────────────────── */
export const ChatWindow: React.FC<Props> = ({ conversation, currentUserId, onClose, onBack }) => {
  const { movies: appMovies } = useApp();
  const movies = appMovies || [];

  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [text, setText]               = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [typing, setTyping]           = useState(false);
  const [showMoviePicker, setMoviePicker] = useState(false);
  const [imgPreview, setImgPreview]   = useState<string | null>(null);
  const [imgFile, setImgFile]         = useState<File | null>(null);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const other = conversation.otherUser;

  const fetchMessages = useCallback(async () => {
    const res = await apiGetMessages(conversation.id);
    if (res.ok && res.data?.messages) setMessages(res.data.messages);
    setLoading(false);
  }, [conversation.id]);

  useEffect(() => {
    injectStyles();
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* ── Send text ── */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    const opt: ChatMessage = { id: `opt_${Date.now()}`, senderId: currentUserId, messageType: 'text', text: trimmed, imageUrl: '', movieData: null, status: 'sent', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, opt]);
    const res = await apiSendMessage(conversation.id, trimmed);
    if (res.ok && res.data?.message) setMessages(prev => prev.map(m => m.id === opt.id ? res.data!.message : m));
    setSending(false);
    inputRef.current?.focus();
  };

  /* ── Send image ── */
  const handleImageSend = async () => {
    if (!imgFile) return;
    setUploading(true);
    setImgPreview(null);
    const up = await apiUploadChatImage(imgFile);
    if (!up.ok) { setUploading(false); setImgFile(null); return; }
    const opt: ChatMessage = { id: `opt_${Date.now()}`, senderId: currentUserId, messageType: 'image', text: '', imageUrl: up.url, movieData: null, status: 'sent', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, opt]);
    const res = await apiSendImageMessage(conversation.id, up.url);
    if (res.ok && res.data?.message) setMessages(prev => prev.map(m => m.id === opt.id ? res.data!.message : m));
    setUploading(false);
    setImgFile(null);
  };

  /* ── Send movie ── */
  const handleMovieSend = async (movieData: MovieMessageData) => {
    setMoviePicker(false);
    const opt: ChatMessage = { id: `opt_${Date.now()}`, senderId: currentUserId, messageType: 'movie', text: '', imageUrl: '', movieData, status: 'sent', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, opt]);
    const res = await apiSendMovieMessage(conversation.id, movieData);
    if (res.ok && res.data?.message) setMessages(prev => prev.map(m => m.id === opt.id ? res.data!.message : m));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    // Typing indicator
    setTyping(true);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => setTyping(false), 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  /* ── Group messages by date ── */
  const grouped: { label: string; msgs: ChatMessage[] }[] = [];
  let lastLabel = '';
  messages.forEach(m => {
    const label = formatDateLabel(m.createdAt);
    if (label !== lastLabel) { grouped.push({ label, msgs: [m] }); lastLabel = label; }
    else grouped[grouped.length - 1].msgs.push(m);
  });

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        padding: 16,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: 540, height: '90vh', maxHeight: 760,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(160deg,rgba(15,10,35,.98) 0%,rgba(8,5,20,.98) 100%)',
          border: '1px solid rgba(139,92,246,.2)',
          borderRadius: 28,
          boxShadow: '0 60px 160px rgba(0,0,0,.95), 0 0 80px rgba(124,58,237,.12), inset 0 1px 0 rgba(255,255,255,.06)',
          overflow: 'hidden',
          animation: 'ag-in .4s cubic-bezier(.22,1,.36,1) both',
        }}>
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            background: 'rgba(255,255,255,.03)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            flexShrink: 0,
          }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.3)',
                color: '#a78bfa', cursor: 'pointer', padding: '6px 10px',
                borderRadius: 10, fontSize: '0.9rem', fontWeight: 700,
                transition: 'all .2s', flexShrink: 0,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,.15)'; }}>
                ← Back
              </button>
            )}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={other?.name ?? '?'} avatar={other?.avatar} size={44} />
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 12, height: 12, borderRadius: '50%',
                background: '#22c55e', border: '2.5px solid rgba(8,5,20,.98)',
                boxShadow: '0 0 8px rgba(34,197,94,.9)',
                animation: 'ag-glow 2s ease-in-out infinite',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.97rem', marginBottom: 1 }}>
                {other?.name ?? 'User'}
              </p>
              <p style={{ color: '#4ade80', fontSize: '0.67rem', fontWeight: 600 }}>
                {loading ? 'Loading chat…' : '● Active now'}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              color: '#64748b', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.2)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
              ✕
            </button>
          </div>

          {/* ── Gradient accent bar ── */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#818cf8,transparent)', flexShrink: 0 }} />

          {/* ── Messages area ── */}
          <div ref={scrollRef} className="ag-scrollbar" style={{
            flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
            display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#lg)" strokeWidth="2.5"
                  style={{ animation: 'ag-spin .8s linear infinite' }}>
                  <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <div style={{ fontSize: '3.5rem', animation: 'ag-pop .5s ease both' }}>💬</div>
                <p style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                  No messages yet.<br />Say hello to {other?.name}!
                </p>
                <p style={{ color: '#1e293b', fontSize: '0.72rem', textAlign: 'center' }}>
                  You can also share movies 🎬 or photos 📷
                </p>
              </div>
            ) : (
              grouped.map((group, gi) => (
                <div key={gi}>
                  {/* Date separator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
                    <span style={{
                      color: '#475569', fontSize: '0.62rem', fontWeight: 700,
                      background: 'rgba(255,255,255,.04)', padding: '2px 10px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,.06)',
                    }}>{group.label}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {group.msgs.map((msg, mi) => {
                      const isMe   = msg.senderId.toString() === currentUserId;
                      const isLast = mi === group.msgs.length - 1 || group.msgs[mi + 1].senderId.toString() !== msg.senderId.toString();
                      const isFst  = mi === 0 || group.msgs[mi - 1].senderId.toString() !== msg.senderId.toString();

                      return (
                        <div key={msg.id} style={{
                          display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                          alignItems: 'flex-end', gap: 8,
                          animation: `ag-float .25s ${Math.min(mi, 8) * 30}ms ease both`,
                        }}>
                          {/* Avatar */}
                          {!isMe && (
                            <div style={{ width: 32, flexShrink: 0 }}>
                              {isLast && <Avatar name={other?.name ?? '?'} avatar={other?.avatar} size={30} />}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                            {/* Bubble */}
                            <div style={{
                              padding: msg.messageType !== 'text' ? 0 : '10px 14px',
                              borderRadius: isMe
                                ? (isFst ? '20px 20px 5px 20px' : isLast ? '20px 5px 20px 20px' : '20px 5px 5px 20px')
                                : (isFst ? '20px 20px 20px 5px' : isLast ? '5px 20px 20px 20px' : '5px 20px 20px 5px'),
                              background: msg.messageType !== 'text' ? 'none' : (isMe
                                ? 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#6366f1 100%)'
                                : 'rgba(255,255,255,0.08)'),
                              backdropFilter: !isMe && msg.messageType === 'text' ? 'blur(12px)' : 'none',
                              color: isMe ? 'white' : '#e2e8f0',
                              fontSize: '0.87rem', lineHeight: 1.5, wordBreak: 'break-word',
                              boxShadow: msg.messageType !== 'text' ? 'none' : (isMe
                                ? '0 6px 20px rgba(124,58,237,.4), 0 2px 8px rgba(0,0,0,.3)'
                                : '0 2px 10px rgba(0,0,0,.35)'),
                              border: !isMe && msg.messageType === 'text' ? '1px solid rgba(255,255,255,.08)' : 'none',
                              overflow: 'hidden',
                            }}>
                              {msg.messageType === 'text' && msg.text}
                              {msg.messageType === 'image' && msg.imageUrl && <ImageMessage url={msg.imageUrl} />}
                              {msg.messageType === 'movie' && msg.movieData && (
                                <MovieCard data={msg.movieData} />
                              )}
                            </div>

                            {/* Timestamp + status */}
                            {isLast && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3,
                                padding: '0 4px' }}>
                                <span style={{ color: '#334155', fontSize: '0.58rem' }}>{formatTime(msg.createdAt)}</span>
                                {isMe && <StatusTick status={msg.status || 'sent'} />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 2, animation: 'ag-float .2s ease both' }}>
                <Avatar name={other?.name ?? '?'} avatar={other?.avatar} size={28} />
                <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                  background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)',
                  display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed',
                      animation: `ag-dot 1.1s ${i * 0.18}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Image preview strip ── */}
          {imgPreview && (
            <div style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,.03)',
              borderTop: '1px solid rgba(255,255,255,.06)',
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <img src={imgPreview} alt="Preview"
                style={{ height: 60, width: 60, objectFit: 'cover', borderRadius: 10,
                  border: '2px solid rgba(139,92,246,.5)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#a78bfa', fontSize: '0.78rem', fontWeight: 700 }}>📷 Ready to send</p>
                <p style={{ color: '#475569', fontSize: '0.68rem' }}>{imgFile?.name}</p>
              </div>
              <button onClick={handleImageSend} disabled={uploading}
                style={{ padding: '6px 14px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  border: 'none', color: 'white', fontWeight: 700, fontSize: '0.78rem',
                  cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'Uploading…' : 'Send 📤'}
              </button>
              <button onClick={() => { setImgPreview(null); setImgFile(null); }}
                style={{ width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(239,68,68,.2)', border: 'none', color: '#f87171',
                  cursor: 'pointer', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          )}

          {/* ── Input bar ── */}
          <div style={{
            padding: '12px 14px 14px',
            background: 'rgba(255,255,255,.02)',
            borderTop: '1px solid rgba(255,255,255,.06)',
            flexShrink: 0,
          }}>
            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={handleFileSelect} />

            <div id="ag-input-bar" style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.10)',
              borderRadius: 22, padding: '8px 8px 8px 14px',
              transition: 'border-color .25s, box-shadow .25s',
            }}>
              {/* Attach image */}
              <button onClick={() => fileRef.current?.click()}
                title="Send a photo" style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)',
                  color: '#a78bfa', cursor: 'pointer', fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,.12)'; }}>
                📎
              </button>

              {/* Share movie */}
              <button onClick={() => setMoviePicker(true)}
                title="Share a movie" style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(79,70,229,.12)', border: '1px solid rgba(79,70,229,.25)',
                  color: '#818cf8', cursor: 'pointer', fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,70,229,.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,70,229,.12)'; }}>
                🎬
              </button>

              {/* Text area */}
              <textarea ref={inputRef} value={text}
                onChange={e => {
                  setText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKey}
                onFocus={e => { const b = document.getElementById('ag-input-bar'); if (b) { b.style.borderColor = 'rgba(139,92,246,.5)'; b.style.boxShadow = '0 0 0 3px rgba(139,92,246,.1)'; } }}
                onBlur={e => { const b = document.getElementById('ag-input-bar'); if (b) { b.style.borderColor = 'rgba(255,255,255,.10)'; b.style.boxShadow = 'none'; } }}
                placeholder={`Message ${other?.name ?? 'user'}…`}
                rows={1}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'white', fontSize: '0.88rem', resize: 'none', lineHeight: 1.5,
                  maxHeight: 120, fontFamily: 'inherit', paddingTop: 4, paddingBottom: 4,
                }} />

              {/* Send button */}
              <button onClick={handleSend} disabled={!text.trim() || sending}
                style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: text.trim()
                    ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                    : 'rgba(255,255,255,.06)',
                  border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: text.trim() ? '0 6px 20px rgba(124,58,237,.5)' : 'none',
                  transition: 'all .2s',
                  transform: text.trim() ? 'scale(1)' : 'scale(0.88)',
                  animation: text.trim() ? 'ag-glow 2.5s ease-in-out infinite' : 'none',
                }}>
                {sending ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                    style={{ animation: 'ag-spin .7s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
                    style={{ color: text.trim() ? 'white' : '#334155', marginLeft: 2 }}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p style={{ color: '#1e293b', fontSize: '0.58rem', textAlign: 'center', marginTop: 5 }}>
              Enter to send · Shift+Enter for new line · 📎 image · 🎬 movie
            </p>
          </div>
        </div>
      </div>

      {/* Movie Picker modal */}
      {showMoviePicker && (
        <MoviePicker
          movies={movies}
          onSelect={handleMovieSend}
          onClose={() => setMoviePicker(false)}
        />
      )}
    </>
  );
};

export default ChatWindow;
