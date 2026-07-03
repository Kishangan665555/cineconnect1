import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie } from '../data/store';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface NavSearchPanelProps {
  movies: Movie[];
  bookings?: { movieId: string; movieTitle: string }[];
  onSelectMovie: (movie: Movie) => void;
  onClose: () => void;
  isOpen: boolean;
}

/* ─── Injected styles (once) ────────────────────────────────────────────── */
const NSP_STYLES = `
  @keyframes nsp-drop   { from{opacity:0;transform:translateY(-14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes nsp-ripple { 0%{transform:scale(0);opacity:.5} 100%{transform:scale(4);opacity:0} }
  @keyframes nsp-pulse  { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
  @keyframes nsp-shimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes nsp-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nsp-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.35)} 50%{box-shadow:0 0 0 6px rgba(124,58,237,0)} }

  .nsp-overlay { animation: nsp-drop .28s cubic-bezier(.34,1.56,.64,1) both; }
  .nsp-item {
    transition: background .15s ease, transform .15s ease;
    position: relative; overflow: hidden;
  }
  .nsp-item:hover { background: rgba(124,58,237,.14) !important; transform: translateX(5px); }
  .nsp-movie-card {
    transition: all .25s cubic-bezier(.23,1,.32,1);
    cursor: pointer; position: relative; overflow: hidden;
  }
  .nsp-movie-card:hover { transform: translateY(-5px) scale(1.04); }
  .nsp-input:focus { outline: none; }
  .nsp-clear-btn:hover { background: rgba(255,255,255,.18) !important; }
`;

/* ─── Fuzzy matcher ─────────────────────────────────────────────────────── */
const fuzzyScore = (query: string, target: string): number => {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t === q) return 1;
  if (t.includes(q)) return 0.9;
  if (t.startsWith(q)) return 0.85;
  return 0;
};

/* ─── Mini Poster Card (Trending) ───────────────────────────────────────── */
const MiniCard: React.FC<{ movie: Movie; rank: number; onClick: () => void }> = ({ movie, rank, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  const [hov, setHov] = useState(false);
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#7B61FF', '#00E5FF'];
  const rc = rankColors[rank] ?? '#7B61FF';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ripple effect
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.cssText = `
      position:absolute; width:${diameter}px; height:${diameter}px;
      border-radius:50%; background:rgba(255,255,255,.15);
      left:${e.clientX - btn.getBoundingClientRect().left - diameter/2}px;
      top:${e.clientY - btn.getBoundingClientRect().top - diameter/2}px;
      animation:nsp-ripple .5s ease forwards; pointer-events:none;
    `;
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 500);
    onClick();
  };

  return (
    <div
      className="nsp-movie-card"
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: 110, flexShrink: 0 }}
    >
      {/* Poster */}
      <div style={{
        borderRadius: 12, overflow: 'hidden', height: 155,
        boxShadow: hov
          ? `0 14px 36px rgba(0,0,0,.75), 0 0 20px ${rc}40`
          : '0 4px 16px rgba(0,0,0,.5)',
        border: `1px solid ${hov ? rc + '55' : 'rgba(255,255,255,.08)'}`,
        transition: 'box-shadow .25s, border-color .25s', position: 'relative',
      }}>
        {imgErr || !movie.poster ? (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg,${rc}25,rgba(0,0,0,.8))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>🎬</div>
        ) : (
          <img
            src={movie.poster} alt={movie.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform .4s ease' }}
          />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,.78) 30%, transparent 100%)',
        }} />

        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          width: 26, height: 26, borderRadius: 8,
          background: `linear-gradient(135deg,${rc},${rc}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 900,
          boxShadow: `0 2px 10px ${rc}70`,
          color: rank < 3 ? '#000' : '#fff',
        }}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
        </div>

        {/* Trending badge */}
        {movie.isTrending && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            padding: '2px 6px', borderRadius: 999,
            background: 'rgba(244,63,94,.9)', fontSize: '0.52rem',
            fontWeight: 800, color: 'white',
          }}>🔥</div>
        )}

        {/* Rating */}
        {movie.rating && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            fontSize: '0.6rem', color: '#fbbf24', fontWeight: 700,
          }}>★ {movie.rating}</div>
        )}

        {/* Play icon on hover */}
        {hov && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(124,58,237,.9)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124,58,237,.6)',
            animation: 'nsp-fadeIn .2s ease',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        )}
      </div>

      {/* Title */}
      <p style={{
        color: hov ? 'white' : 'rgba(255,255,255,.7)',
        fontSize: '0.66rem', fontWeight: 700, marginTop: 6,
        textAlign: 'center', lineHeight: 1.3,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        transition: 'color .2s',
      }}>{movie.title}</p>

      {/* Genre chips */}
      {movie.genre?.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
          {movie.genre.slice(0, 1).map(g => (
            <span key={g} style={{
              fontSize: '0.52rem', padding: '1px 5px', borderRadius: 999,
              background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.3)',
              color: '#a78bfa', fontWeight: 700,
            }}>{g}</span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Suggestion Row (search results) ──────────────────────────────────── */
const SuggestionRow: React.FC<{
  icon: string; title: string; sub?: string; badge?: string;
  badgeColor?: string; onClick: () => void;
}> = ({ icon, title, sub, badge, badgeColor = '#7B61FF', onClick }) => (
  <button
    className="nsp-item"
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 11,
      padding: '10px 16px', background: 'transparent', border: 'none',
      cursor: 'pointer', textAlign: 'left', borderRadius: 10,
    }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: 'white', fontWeight: 600, fontSize: '0.84rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.68rem', margin: 0, marginTop: 1 }}>{sub}</p>}
    </div>
    {badge && (
      <span style={{
        fontSize: '0.56rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999,
        background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40`,
        flexShrink: 0,
      }}>{badge}</span>
    )}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN NAV SEARCH PANEL
══════════════════════════════════════════════════════════════════════════════ */
export const NavSearchPanel: React.FC<NavSearchPanelProps> = ({
  movies, bookings = [], onSelectMovie, onClose, isOpen,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cc_recent_searches') ?? '[]').slice(0, 5); }
    catch { return []; }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Inject styles once */
  useEffect(() => {
    if (!document.getElementById('nsp-styles')) {
      const s = document.createElement('style');
      s.id = 'nsp-styles'; s.textContent = NSP_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  /* Focus input on open */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSuggestions([]);
    }
  }, [isOpen]);

  /* Close on outside click */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  /* Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Trending movies: by bookings count + rating */
  const trendingMovies = React.useMemo(() => {
    const bookCount: Record<string, number> = {};
    bookings.forEach(b => { bookCount[b.movieId] = (bookCount[b.movieId] ?? 0) + 1; });
    return [...movies]
      .sort((a, b) => {
        const bScore = (bookCount[b.id] ?? 0) * 2 + (b.rating ?? 0) + (b.isTrending ? 5 : 0);
        const aScore = (bookCount[a.id] ?? 0) * 2 + (a.rating ?? 0) + (a.isTrending ? 5 : 0);
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [movies, bookings]);

  /* Build live suggestions from query */
  const buildSuggestions = useCallback((q: string): Movie[] => {
    if (!q.trim()) return [];
    return movies
      .map(m => ({ m, score: fuzzyScore(q, m.title) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(x => x.m);
  }, [movies]);

  /* Handle input change */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSuggestions(buildSuggestions(val));
    }, 120);
  };

  /* Save to recent & navigate */
  const handleSelectMovie = useCallback((movie: Movie, searchTerm?: string) => {
    // Save recent search
    const term = searchTerm ?? movie.title;
    const updated = [term, ...recentSearches.filter(r => r !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));

    onSelectMovie(movie);
    onClose();
  }, [recentSearches, onSelectMovie, onClose]);

  /* Click on recent search — find matching movie */
  const handleRecentClick = (term: string) => {
    const match = movies.find(m => m.title.toLowerCase() === term.toLowerCase())
      || movies.find(m => m.title.toLowerCase().includes(term.toLowerCase()));
    if (match) {
      handleSelectMovie(match, term);
    } else {
      setQuery(term);
      setSuggestions(buildSuggestions(term));
      inputRef.current?.focus();
    }
  };

  /* Clear all recent */
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.setItem('cc_recent_searches', '[]');
  };

  if (!isOpen) return null;

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;
  const showDefault = !query.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1998,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="nsp-overlay"
        style={{
          position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
          width: 'min(640px, calc(100vw - 32px))',
          zIndex: 1999,
          borderRadius: 20,
          background: 'linear-gradient(145deg,rgba(8,4,26,.98) 0%,rgba(4,2,14,.99) 100%)',
          border: '1px solid rgba(124,58,237,.3)',
          boxShadow: '0 28px 80px rgba(0,0,0,.75), 0 0 50px rgba(124,58,237,.12), inset 0 1px 0 rgba(255,255,255,.06)',
          overflow: 'hidden',
        }}
      >
        {/* Top colour bar */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg,#7c3aed,#e11d48,#0891b2,#10b981)',
          backgroundSize: '200%',
          animation: 'nsp-shimmer 4s linear infinite',
        }} />

        {/* ── Search Input ── */}
        <div style={{ padding: '14px 16px 10px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(124,58,237,.4)',
            borderRadius: 14, padding: '0 6px 0 14px',
            boxShadow: '0 0 0 3px rgba(124,58,237,.12)',
          }}>
            {/* Search icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,.8)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>

            <input
              ref={inputRef}
              className="nsp-input"
              value={query}
              onChange={handleChange}
              placeholder="Search movies, actors, genres…"
              style={{
                flex: 1, background: 'none', border: 'none', color: 'white',
                fontSize: '0.92rem', fontWeight: 500, fontFamily: 'inherit',
                caretColor: '#a78bfa', padding: '11px 0',
              }}
            />

            {/* Clear button */}
            {query && (
              <button
                className="nsp-clear-btn"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                  color: 'rgba(255,255,255,.55)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  flexShrink: 0, transition: 'background .2s',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}

            {/* Close panel button */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.45)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,.15)'; (e.currentTarget as HTMLElement).style.color = '#fb7185'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.45)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Live Suggestions ── */}
        {showSuggestions && (
          <div style={{ padding: '4px 10px 8px', animation: 'nsp-fadeIn .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 8px', marginBottom: 2 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,.6)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Results</span>
            </div>
            {suggestions.map((m, i) => (
              <div key={m.id} style={{ animation: `nsp-fadeIn .2s ease ${i * 40}ms both` }}>
                <SuggestionRow
                  icon="🎬"
                  title={m.title}
                  sub={[m.genre?.slice(0, 2).join(' · '), m.rating ? `★ ${m.rating}` : ''].filter(Boolean).join(' · ')}
                  badge={m.isTrending ? '🔥 Trending' : m.isNowShowing ? '▶ Showing' : 'Movie'}
                  badgeColor={m.isTrending ? '#f43f5e' : m.isNowShowing ? '#10b981' : '#7c3aed'}
                  onClick={() => handleSelectMovie(m)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Default Panel (Recent + Trending) ── */}
        {showDefault && (
          <>
            {/* ── Recent Searches ── */}
            {recentSearches.length > 0 && (
              <div style={{ padding: '8px 10px 4px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 8px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,.6)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Searches</span>
                  </div>
                  <button
                    onClick={clearRecent}
                    style={{
                      color: 'rgba(244,63,94,.6)', fontSize: '0.62rem', fontWeight: 700,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px 6px', borderRadius: 6,
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fb7185'; (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,63,94,.6)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                  >
                    Clear all
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentSearches.map((term, i) => (
                    <div key={i} style={{ animation: `nsp-fadeIn .2s ease ${i * 35}ms both` }}>
                      <SuggestionRow
                        icon="🕐"
                        title={term}
                        sub="Recent search"
                        onClick={() => handleRecentClick(term)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {recentSearches.length > 0 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '6px 16px' }} />
            )}

            {/* ── Trending Now ── */}
            <div style={{ padding: '8px 10px 14px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 8px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Live dot */}
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 6px #f43f5e', animation: 'nsp-pulse 1.5s infinite' }} />
                  <span style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '-0.01em' }}>🔥 Trending Now</span>
                  <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.6rem', fontWeight: 600 }}>Based on searches & bookings</span>
                </div>
                <span style={{
                  fontSize: '0.56rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)',
                  color: '#fb7185', letterSpacing: '0.04em',
                }}>LIVE</span>
              </div>

              {/* Horizontal scroll of movie cards */}
              <div style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', paddingBottom: 6 }}>
                <div style={{ display: 'flex', gap: 12, width: 'max-content', padding: '2px 6px 6px' }}>
                  {trendingMovies.map((m, i) => (
                    <div key={m.id} style={{ animation: `nsp-fadeIn .3s ease ${i * 55}ms both` }}>
                      <MiniCard
                        movie={m}
                        rank={i}
                        onClick={() => handleSelectMovie(m)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer hint */}
            <div style={{
              background: 'rgba(124,58,237,.06)', borderTop: '1px solid rgba(124,58,237,.12)',
              padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,.5)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.62rem', fontWeight: 500 }}>
                Type to search movies, genres, or actors • Press <kbd style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, padding: '1px 5px', fontSize: '0.58rem', color: 'rgba(255,255,255,.5)' }}>Esc</kbd> to close
              </span>
            </div>
          </>
        )}

        {/* No results */}
        {query.trim() && suggestions.length === 0 && (
          <div style={{ padding: '32px 24px', textAlign: 'center', animation: 'nsp-fadeIn .2s ease' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10, animation: 'nsp-fadeIn .3s ease' }}>🎬</div>
            <p style={{ color: 'rgba(255,255,255,.5)', fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>
              No movies found for "<span style={{ color: '#a78bfa' }}>{query}</span>"
            </p>
            <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '0.72rem' }}>
              Try a different movie name or genre
            </p>
          </div>
        )}
      </div>
    </>
  );
};
