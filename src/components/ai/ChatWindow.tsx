/**
 * src/components/ai/ChatWindow.tsx
 * AI chat with movie recommendation cards, personalized suggestions,
 * voice input, multilingual support, and streaming-style render.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  apiSendChatMessage,
  apiGetMovieRecommendations,
  parseRecommendationsFromReply,
  MovieRecommendation,
  ChatResponse,
} from '../../services/aiService';
import VoiceInput from './VoiceInput';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sentiment?: string;
  escalated?: boolean;
  recommendations?: MovieRecommendation[];
}

interface Props {
  currentUser: any;
  userContext: any;
  triggerMessage: string | null;
  onTriggerConsumed: () => void;
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j} style={{ color: '#d4b8ff' }}>{part.slice(2, -2)}</strong>;
      return part.split(/(\*[^*]+\*)/).map((p, k) => {
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2)
          return <em key={k}>{p.slice(1, -1)}</em>;
        return p;
      });
    });
    const isListItem = /^(-|•|\d+\.)\s/.test(line);
    return (
      <span key={i} style={{ display: isListItem ? 'flex' : 'block', alignItems: 'flex-start', gap: 6, marginTop: isListItem ? 3 : 0 }}>
        {isListItem && <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>}
        <span>{parts}</span>
        {i < lines.length - 1 && !isListItem && <br />}
      </span>
    );
  });
}

// ─── Movie Recommendation Card ────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const CERT_COLORS: Record<string, string> = {
  U: '#22c55e', UA: '#f59e0b', A: '#ef4444', S: '#8b5cf6',
};

const MovieCard: React.FC<{ movie: MovieRecommendation }> = ({ movie }) => {
  const posterSrc = movie.poster
    ? (movie.poster.startsWith('data:') || movie.poster.startsWith('http') ? movie.poster : `${API_BASE}${movie.poster}`)
    : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
      border: '1px solid rgba(168,85,247,0.25)',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      gap: 0,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(168,85,247,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Poster */}
      <div style={{ width: 68, flexShrink: 0, background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
        {posterSrc ? (
          <img src={posterSrc} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, minHeight: 100 }}>🎬</div>
        )}
        {/* Certificate badge */}
        {movie.certificate && (
          <div style={{
            position: 'absolute', top: 5, left: 5, padding: '1px 6px', borderRadius: 6,
            background: CERT_COLORS[movie.certificate] || '#64748b',
            fontSize: 9, fontWeight: 800, color: 'white', letterSpacing: '0.05em',
          }}>{movie.certificate}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '10px 12px 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Title + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>{movie.title}</span>
          {movie.isTrending && <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '1px 6px', fontWeight: 800 }}>🔥 HOT</span>}
          {movie.isNowShowing && <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '1px 6px', fontWeight: 800 }}>NOW SHOWING</span>}
          {movie.isComingSoon && <span style={{ fontSize: 9, background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '1px 6px', fontWeight: 800 }}>COMING SOON</span>}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: '#fbbf24', fontSize: 11 }}>★</span>
          <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>{movie.rating?.toFixed(1)}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>/10</span>
          {movie.duration && <><span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>•</span><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{movie.duration}m</span></>}
        </div>

        {/* Genres */}
        {movie.genre?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {movie.genre.slice(0, 3).map(g => (
              <span key={g} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)', fontWeight: 700 }}>{g}</span>
            ))}
          </div>
        )}

        {/* Reason */}
        {movie.reason && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.4 }}>✨ {movie.reason}</div>
        )}

        {/* Book button */}
        <a
          href="/movies"
          style={{
            marginTop: 4,
            display: 'inline-block',
            padding: '5px 12px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: 'white',
            fontSize: 10,
            fontWeight: 800,
            textDecoration: 'none',
            letterSpacing: '0.05em',
            alignSelf: 'flex-start',
            transition: 'opacity 0.2s',
            fontFamily: "'Outfit', sans-serif",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          🎟️ Book Now
        </a>
      </div>
    </div>
  );
};

// ─── Recommendation strip ─────────────────────────────────────────────────────

const RecommendationStrip: React.FC<{ movies: MovieRecommendation[]; label?: string }> = ({ movies, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'aiMessageIn 0.4s ease' }}>
    {label && (
      <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🎬</span> {label}
      </div>
    )}
    {movies.map((m, i) => <MovieCard key={m._id || i} movie={m} />)}
  </div>
);

// ─── Welcome message ──────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hey there! I'm **CineConnect AI** 🎬\n\nI'm your personal cinema companion. Here's what I can do:\n- 🎟️ **Book tickets** and help with seat selection\n- 🎬 **Recommend movies** based on your taste\n- 💰 **Cancellations & refunds** — I'll walk you through it\n- 💳 **Payment issues** — Razorpay, UPI, cards\n- 🎁 **Offers & coupons** you might have missed\n- 🔐 **Account & login** help\n\nJust chat naturally — I'll figure out what you need! 😊`,
  timestamp: new Date(),
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChatWindow: React.FC<Props> = ({ currentUser, userContext, triggerMessage, onTriggerConsumed }) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [autoRecos, setAutoRecos] = useState<MovieRecommendation[]>([]);
  const [showAutoRecos, setShowAutoRecos] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPersonalized = useRef(false);
  const hasFetchedRecos = useRef(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showAutoRecos]);

  // Personalize welcome + auto-fetch recommendations
  useEffect(() => {
    if (!currentUser || !userContext || hasPersonalized.current) return;
    hasPersonalized.current = true;

    const personalMsg: Message = {
      id: 'personal-' + Date.now(),
      role: 'assistant',
      content: userContext.lastBooking
        ? `Welcome back, **${userContext.name}**! 👋\n\nYour last booking was *${userContext.lastBooking.movieTitle}* at *${userContext.lastBooking.theatreName}* on ${userContext.lastBooking.showDate}.\n\nNeed help with that booking, or shall I suggest what to watch next? 🍿`
        : `Welcome, **${userContext.name}**! 👋\n\nLooks like you haven't booked yet — let me find something great for you to watch! 🎬`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, personalMsg]);

    // Auto-fetch recommendations for logged-in users
    if (!hasFetchedRecos.current) {
      hasFetchedRecos.current = true;
      const genres = userContext.favouriteGenres
        ? userContext.favouriteGenres.split(',').map((g: string) => g.trim()).filter(Boolean)
        : [];
      apiGetMovieRecommendations(genres, 4).then(({ movies }) => {
        if (movies.length > 0) {
          setAutoRecos(movies);
          setShowAutoRecos(true);
          setMessages(prev => [...prev, {
            id: 'recos-auto-' + Date.now(),
            role: 'assistant',
            content: genres.length
              ? `Based on your love for **${genres.slice(0, 2).join(' & ')}** movies, here are some picks you'll enjoy 🎉`
              : `Here are some top picks from CineConnect right now 🔥`,
            timestamp: new Date(),
            recommendations: movies,
          }]);
        }
      });
    }
  }, [currentUser, userContext]);

  // Handle trigger messages from QuickActions
  useEffect(() => {
    if (triggerMessage) {
      onTriggerConsumed();
      handleSend(triggerMessage);
    }
  }, [triggerMessage]); // eslint-disable-line

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: ChatResponse = await apiSendChatMessage(msg, sessionId, language);
      if (res.sessionId) setSessionId(res.sessionId);

      // Parse embedded movie recommendations from AI reply
      const { cleanText, recommendations } = parseRecommendationsFromReply(res.reply);

      // If user asked for recommendations but AI gave none, fetch from DB
      const isRecoRequest = /recommend|suggest|what.*watch|movie for|good movie|best movie/i.test(msg);
      let dbRecos: MovieRecommendation[] = [];
      if (isRecoRequest && recommendations.length === 0) {
        const genres = userContext?.favouriteGenres
          ? userContext.favouriteGenres.split(',').map((g: string) => g.trim()).filter(Boolean)
          : [];
        const { movies } = await apiGetMovieRecommendations(genres, 4);
        dbRecos = movies;
      }

      const finalRecos = recommendations.length > 0 ? recommendations : dbRecos;

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: cleanText,
        timestamp: new Date(),
        sentiment: res.sentiment,
        escalated: res.escalated,
        recommendations: finalRecos.length > 0 ? finalRecos : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: "I hit a small snag 😅 Please try again or contact **support@cineconnect.com**",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, sessionId, language, userContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoiceInput = useCallback((transcript: string) => {
    setInput(transcript);
    setTimeout(() => handleSend(transcript), 300);
  }, [handleSend]);

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    hasPersonalized.current = false;
    hasFetchedRecos.current = false;
    setAutoRecos([]);
    setShowAutoRecos(false);
  };

  const handleRecommendClick = () => {
    handleSend('Recommend me some movies based on my interests');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top Controls ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: '1px solid rgba(99,102,241,0.08)', flexShrink: 0,
      }}>
        {/* Language selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['en', 'hi', 'kn'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${language === lang ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: language === lang ? 'rgba(168,85,247,0.15)' : 'transparent',
                color: language === lang ? '#c084fc' : 'rgba(255,255,255,0.45)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
              }}
            >{lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ಕ'}</button>
          ))}
        </div>

        {/* Recommend quick button */}
        <button
          onClick={handleRecommendClick}
          style={{
            padding: '4px 12px', borderRadius: 20,
            border: '1px solid rgba(251,146,60,0.4)',
            background: 'rgba(251,146,60,0.1)',
            color: '#fb923c', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.1)')}
        >🎬 Suggest Movies</button>

        {/* Clear */}
        <button
          onClick={clearChat}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 11, fontFamily: "'Outfit', sans-serif",
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 8, transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(236,72,153,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >🗑️ Clear</button>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px', display: 'flex',
        flexDirection: 'column', gap: 12,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(168,85,247,0.3) transparent',
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end', gap: 8,
              animation: 'aiMessageIn 0.3s ease',
            }}
          >
            {/* AI Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>🎬</div>
            )}

            {/* Bubble + optional recommendation cards */}
            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                  : msg.escalated ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                border: msg.role === 'user'
                  ? 'none'
                  : msg.escalated ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(245,245,255,0.92)',
                fontSize: 13.5, lineHeight: 1.6,
                fontFamily: "'Outfit', sans-serif",
                boxShadow: msg.role === 'user' ? '0 4px 16px rgba(99,102,241,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                {renderMarkdown(msg.content)}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Inline recommendation cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <RecommendationStrip movies={msg.recommendations} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, animation: 'aiMessageIn 0.3s ease' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎬</div>
            <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: `aiTypingDot 1.2s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid rgba(99,102,241,0.12)',
        background: 'rgba(0,0,0,0.2)', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.22)',
          borderRadius: 16, padding: '6px 6px 6px 14px', transition: 'border-color 0.2s',
        }}>
          <input
            ref={inputRef}
            id="ai-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or say 'suggest a movie'..."
            disabled={loading}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'rgba(245,245,255,0.92)', fontSize: 13.5,
              fontFamily: "'Outfit', sans-serif",
            }}
          />
          <VoiceInput onTranscript={handleVoiceInput} disabled={loading} language={language} />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            id="ai-chat-send"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.08)',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
              boxShadow: input.trim() && !loading ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.2)', marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>
          CineConnect AI · For urgent help call +91 8660596113
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
