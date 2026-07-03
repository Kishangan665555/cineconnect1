import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie } from '../data/store';


interface SmartSearchProps {
  movies: Movie[];
  bookings?: { movieId: string; movieTitle: string }[];
  onSelect: (movie: Movie) => void;
  onBrowseAll: () => void;
}

/* ─── Keyframes (injected once) ─────────────────────────────────────────── */
const SS_STYLES = `
@keyframes ss-slide-down { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
@keyframes ss-fade-in    { from{opacity:0} to{opacity:1} }
@keyframes ss-pop        { 0%{transform:scale(.92);opacity:0} 70%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
@keyframes ss-pulse-dot  { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
@keyframes ss-shimmer    { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
@keyframes ss-scroll     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes ss-glow-ring  { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.4)} 50%{box-shadow:0 0 0 8px rgba(124,58,237,0)} }
@keyframes ss-float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes ss-rank       { from{transform:scale(0) rotate(-15deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
@keyframes ss-bar-grow   { from{width:0} to{width:var(--w)} }
.ss-scroll-track { animation: ss-scroll 30s linear infinite; }
.ss-scroll-track:hover { animation-play-state: paused; }
.ss-input:focus { outline: none; }
.ss-card-hover { transition: all .3s cubic-bezier(.23,1,.32,1); }
.ss-card-hover:hover { transform: translateY(-6px) scale(1.025); }
.ss-suggest-item { transition: background .15s, transform .15s; }
.ss-suggest-item:hover { background: rgba(124,58,237,.18) !important; transform: translateX(4px); }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const levenshtein = (a: string, b: string): number => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : 1 + Math.min(m[i-1][j], m[i][j-1], m[i-1][j-1]);
  return m[a.length][b.length];
};

const fuzzyMatch = (query: string, target: string): number => {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 1;
  if (t.startsWith(q)) return 0.95;
  const words = t.split(/\s+/);
  if (words.some(w => w.startsWith(q))) return 0.85;
  const dist = levenshtein(q, t.slice(0, q.length + 2));
  if (dist <= 2) return 0.7 - dist * 0.1;
  return 0;
};

const RANK_COLORS = ['#FFD700','#C0C0C0','#CD7F32','#7B61FF','#00E5FF','#00e5a0'];
const RANK_LABELS = ['🥇','🥈','🥉','#4','#5','#6'];

const ACTOR_POOL = [
  'Shah Rukh Khan','Aamir Khan','Salman Khan','Deepika Padukone','Priyanka Chopra',
  'Ranveer Singh','Ranbir Kapoor','Katrina Kaif','Alia Bhatt','Disha Patani',
];
const ALL_GENRES = ['Action','Comedy','Drama','Horror','Thriller','Romance','Sci-Fi','Animation','Adventure','Mystery'];

const INSIGHTS = [
  { icon: '🔍', label: 'Most searched today', value: 'Pathaan' },
  { icon: '🎭', label: 'Top genre this week', value: 'Action' },
  { icon: '📈', label: 'Rising movie', value: 'Animal' },
  { icon: '⚡', label: 'Selling fast', value: 'KGF 3' },
];

/* ─── Loading Skeleton ───────────────────────────────────────────────────── */
const Skeleton: React.FC<{ w?: string; h?: string; radius?: number }> = ({ w = '100%', h = '16px', radius = 8 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: 'linear-gradient(90deg,rgba(255,255,255,.06) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.06) 75%)',
    backgroundSize: '300% 100%',
    animation: 'ss-shimmer 1.8s ease-in-out infinite',
  }} />
);

/* ─── Movie Poster Card ──────────────────────────────────────────────────── */
const PosterCard: React.FC<{
  movie: Movie; rank?: number; showRank?: boolean;
  label?: string; onClick: () => void;
}> = ({ movie, rank, showRank = false, label, onClick }) => {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const rankColor = rank !== undefined ? RANK_COLORS[rank] ?? '#7B61FF' : '#7B61FF';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 140, cursor: 'pointer',
        transform: hov ? 'translateY(-10px) scale(1.04)' : 'translateY(0) scale(1)',
        transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
        animation: 'ss-pop .5s cubic-bezier(.34,1.56,.64,1) both',
      }}
    >
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        height: 200,
        boxShadow: hov
          ? `0 20px 50px rgba(0,0,0,.8), 0 0 30px ${rankColor}40`
          : '0 6px 24px rgba(0,0,0,.5)',
        border: `1px solid ${hov ? rankColor + '60' : 'rgba(255,255,255,.08)'}`,
        transition: 'box-shadow .35s, border-color .35s',
      }}>
        {imgErr || !movie.poster ? (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg,${rankColor}30, rgba(0,0,0,.8))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem',
          }}>🎬</div>
        ) : (
          <img
            src={movie.poster} alt={movie.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hov
            ? 'linear-gradient(to top, rgba(0,0,0,.9) 40%, rgba(0,0,0,.2) 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,.7) 30%, transparent 100%)',
          transition: 'background .3s',
        }} />

        {/* Rank badge */}
        {showRank && rank !== undefined && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg,${rankColor},${rankColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 900,
            boxShadow: `0 4px 16px ${rankColor}80`,
            animation: `ss-rank .4s cubic-bezier(.34,1.56,.64,1) ${rank * 80}ms both`,
          }}>
            {rank < 3 ? RANK_LABELS[rank] : `#${rank + 1}`}
          </div>
        )}

        {/* Trending fire */}
        {movie.isTrending && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(244,63,94,.85)', backdropFilter: 'blur(8px)',
            fontSize: '0.6rem', fontWeight: 800, color: 'white',
          }}>🔥 HOT</div>
        )}

        {/* Rating + title */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 8px' }}>
          {movie.rating && (
            <div style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: 700, marginBottom: 3 }}>
              ★ {movie.rating}
            </div>
          )}
          <p style={{
            color: 'white', fontSize: '0.72rem', fontWeight: 700,
            lineHeight: 1.3, margin: 0,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>{movie.title}</p>
        </div>

        {/* Play button on hover */}
        {hov && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(124,58,237,.9)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124,58,237,.6)',
            animation: 'ss-pop .2s ease',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}
      </div>

      {/* Label below poster */}
      <p style={{
        color: hov ? 'white' : 'rgba(255,255,255,.65)',
        fontSize: '0.72rem', fontWeight: 600,
        marginTop: 8, textAlign: 'center', lineHeight: 1.3,
        transition: 'color .2s',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{label ?? movie.title}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
        {movie.genre.slice(0, 2).map(g => (
          <span key={g} style={{
            fontSize: '0.58rem', fontWeight: 700,
            padding: '2px 6px', borderRadius: 999,
            background: 'rgba(124,58,237,.15)',
            border: '1px solid rgba(124,58,237,.3)',
            color: '#a78bfa',
          }}>{g}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Suggestion Dropdown ────────────────────────────────────────────────── */
interface Suggestion {
  type: 'movie' | 'actor' | 'genre';
  label: string;
  sub?: string;
  movie?: Movie;
  score: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SMART SEARCH COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export const SmartSearch: React.FC<SmartSearchProps> = ({ movies, bookings = [], onSelect, onBrowseAll }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cc_recent_searches') ?? '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Inject styles once */
  useEffect(() => {
    if (!document.getElementById('ss-styles')) {
      const s = document.createElement('style');
      s.id = 'ss-styles'; s.textContent = SS_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Trending movies: most booked + rating */
  const trendingMovies = React.useMemo(() => {
    const bookCount: Record<string, number> = {};
    bookings.forEach(b => { bookCount[b.movieId] = (bookCount[b.movieId] ?? 0) + 1; });
    return [...movies]
      .sort((a, b) => {
        const bScore = (bookCount[b.id] ?? 0) * 2 + (b.rating ?? 0);
        const aScore = (bookCount[a.id] ?? 0) * 2 + (a.rating ?? 0);
        return bScore - aScore;
      })
      .slice(0, 10);
  }, [movies, bookings]);

  /* Genre prefs from bookings */
  const preferredGenres = React.useMemo(() => {
    const gc: Record<string, number> = {};
    bookings.forEach(b => {
      const m = movies.find(x => x.id === b.movieId);
      m?.genre.forEach(g => { gc[g] = (gc[g] ?? 0) + 1; });
    });
    return Object.entries(gc).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [movies, bookings]);

  /* Recommended movies */
  const recommendedMovies = React.useMemo(() => {
    if (preferredGenres.length === 0) {
      return movies.filter(m => m.isNowShowing).slice(0, 8);
    }
    const scored = movies.map(m => {
      const genreScore = m.genre.reduce((s, g) => {
        const idx = preferredGenres.indexOf(g);
        return s + (idx >= 0 ? 10 - idx : 0);
      }, 0);
      return { m, score: genreScore + (m.rating ?? 0) + (m.isTrending ? 5 : 0) };
    });
    return scored.sort((a, b) => b.score - a.score).map(x => x.m).slice(0, 8);
  }, [movies, preferredGenres]);

  /* Build suggestions from query */
  const buildSuggestions = useCallback((q: string): Suggestion[] => {
    if (!q.trim()) return [];
    const results: Suggestion[] = [];
    const seen = new Set<string>();

    // Movie title matches
    movies.forEach(m => {
      const score = fuzzyMatch(q, m.title);
      if (score > 0.3 && !seen.has(m.id)) {
        seen.add(m.id);
        results.push({ type: 'movie', label: m.title, sub: m.genre.slice(0,2).join(' · '), movie: m, score });
      }
    });

    // Genre matches
    ALL_GENRES.forEach(g => {
      const score = fuzzyMatch(q, g);
      if (score > 0.4) {
        results.push({ type: 'genre', label: g, sub: 'Genre', score: score * 0.7 });
      }
    });

    // Actor matches
    ACTOR_POOL.forEach(actor => {
      const score = fuzzyMatch(q, actor);
      if (score > 0.45) {
        results.push({ type: 'actor', label: actor, sub: 'Actor', score: score * 0.6 });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [movies]);

  /* Typo correction: find closest title */
  const findCorrection = useCallback((q: string): string | null => {
    if (q.length < 4) return null;
    const ql = q.toLowerCase();
    let best = { dist: Infinity, title: '' };
    movies.forEach(m => {
      const t = m.title.toLowerCase();
      if (t.includes(ql)) return;
      const dist = levenshtein(ql, t.slice(0, ql.length + 3));
      if (dist < best.dist && dist <= 3) best = { dist, title: m.title };
    });
    return best.dist <= 3 ? best.title : null;
  }, [movies]);

  /* Handle search input */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setFocusedIdx(-1);

    clearTimeout(timerRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchResults([]);
      setCorrectedQuery(null);
      return;
    }

    timerRef.current = setTimeout(() => {
      const suggs = buildSuggestions(val);
      setSuggestions(suggs);
      setShowSuggestions(true);
      if (suggs.length === 0) {
        setCorrectedQuery(findCorrection(val));
      } else {
        setCorrectedQuery(null);
      }
    }, 150);
  };

  /* Execute search */
  const executeSearch = (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setShowSuggestions(false);
    const ql = q.toLowerCase();

    setTimeout(() => {
      const results = movies
        .map(m => {
          const titleScore = fuzzyMatch(q, m.title) * 3;
          const genreScore = m.genre.some(g => g.toLowerCase().includes(ql)) ? 1 : 0;
          const actorScore = (m.cast ?? []).some(a => a.toLowerCase().includes(ql)) ? 0.8 : 0;
          return { m, score: titleScore + genreScore + actorScore };
        })
        .filter(x => x.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .map(x => x.m);

      setSearchResults(results);
      setIsSearching(false);

      // Save to recent
      const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
    }, 400);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    if (s.type === 'movie' && s.movie) {
      onSelect(s.movie);
      setQuery('');
      setShowSuggestions(false);
    } else {
      setQuery(s.label);
      executeSearch(s.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter') {
      if (focusedIdx >= 0 && suggestions[focusedIdx]) handleSuggestionClick(suggestions[focusedIdx]);
      else executeSearch(query);
    }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const typeIcon = (type: string) => {
    if (type === 'movie') return '🎬';
    if (type === 'genre') return '🎭';
    if (type === 'actor') return '⭐';
    return '🔍';
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setCorrectedQuery(null);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  /* Top genre for insights */
  const topGenre = preferredGenres[0] ?? 'Action';

  return (
    <div style={{ position: 'relative', marginBottom: 32 }}>

      {/* ═══ SEARCH HERO ═══════════════════════════════════════════════════════ */}
      <div style={{
        borderRadius: 28, overflow: 'hidden',
        background: 'linear-gradient(145deg,rgba(12,6,46,.97) 0%,rgba(6,3,22,.99) 50%,rgba(10,4,36,.97) 100%)',
        border: '1px solid rgba(124,58,237,.25)',
        boxShadow: '0 24px 80px rgba(0,0,0,.7), 0 0 60px rgba(124,58,237,.08)',
        marginBottom: 24, position: 'relative',
      }}>
        {/* Colour bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#7c3aed,#e11d48,#0891b2,#10b981)', backgroundSize: '200%', animation: 'ss-shimmer 4s linear infinite' }} />

        {/* BG orbs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)', pointerEvents: 'none', animation: 'ss-float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(8,145,178,.1),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '32px 32px 28px' }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 16px', borderRadius: 999, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.3)', fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'ss-pulse-dot 1.5s infinite' }} />
              AI-POWERED DISCOVERY
            </div>
            <h2 style={{
              fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px',
              background: 'linear-gradient(135deg,#f1f5f9 0%,#a78bfa 50%,#67e8f9 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
            }}>
              Find Your Next Favourite Film
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.85rem', margin: 0 }}>
              Smart search · Typo correction · Personalised picks
            </p>
          </div>

          {/* ── Search Bar ── */}
          <div ref={dropRef} style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,.07)',
              border: `1px solid ${showSuggestions ? 'rgba(124,58,237,.6)' : 'rgba(255,255,255,.14)'}`,
              borderRadius: showSuggestions && suggestions.length > 0 ? '18px 18px 0 0' : 18,
              padding: '4px 6px 4px 18px',
              boxShadow: showSuggestions
                ? '0 0 0 4px rgba(124,58,237,.15), 0 12px 40px rgba(0,0,0,.5)'
                : '0 4px 20px rgba(0,0,0,.3)',
              transition: 'all .25s',
              backdropFilter: 'blur(20px)',
            }}>
              {/* Search icon */}
              <div style={{ color: query ? '#a78bfa' : 'rgba(255,255,255,.35)', flexShrink: 0, transition: 'color .2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>

              <input
                ref={inputRef}
                className="ss-input"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (query) setShowSuggestions(true); }}
                placeholder="Search movies, actors, genres..."
                style={{
                  flex: 1, background: 'none', border: 'none', color: 'white',
                  fontSize: '1rem', fontWeight: 500, fontFamily: 'inherit',
                  caretColor: '#a78bfa',
                }}
              />

              {/* Clear button */}
              {query && (
                <button onClick={clearSearch} style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  flexShrink: 0, transition: 'all .2s',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}

              {/* Search button */}
              <button
                onClick={() => executeSearch(query)}
                style={{
                  padding: '11px 22px', borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  border: '1px solid rgba(124,58,237,.5)',
                  color: 'white', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,58,237,.45), inset 0 1px 0 rgba(255,255,255,.15)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(124,58,237,.6)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(124,58,237,.45)';
                }}
              >
                Search
              </button>
            </div>

            {/* ── Suggestions Dropdown ── */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                background: 'rgba(8,4,28,.97)',
                border: '1px solid rgba(124,58,237,.4)',
                borderTop: 'none',
                borderRadius: '0 0 18px 18px',
                backdropFilter: 'blur(40px)',
                boxShadow: '0 24px 60px rgba(0,0,0,.8)',
                animation: 'ss-slide-down .2s ease',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="ss-suggest-item"
                      onClick={() => handleSuggestionClick(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 18px', cursor: 'pointer',
                        background: i === focusedIdx ? 'rgba(124,58,237,.18)' : 'transparent',
                        transform: i === focusedIdx ? 'translateX(4px)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: s.type === 'movie' ? 'rgba(124,58,237,.2)' : s.type === 'genre' ? 'rgba(225,29,72,.2)' : 'rgba(245,158,11,.2)',
                        border: `1px solid ${s.type === 'movie' ? 'rgba(124,58,237,.4)' : s.type === 'genre' ? 'rgba(225,29,72,.4)' : 'rgba(245,158,11,.4)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                      }}>{typeIcon(s.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</p>
                        {s.sub && <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.7rem', margin: 0 }}>{s.sub}</p>}
                      </div>
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        background: s.type === 'movie' ? 'rgba(124,58,237,.2)' : s.type === 'genre' ? 'rgba(225,29,72,.2)' : 'rgba(245,158,11,.2)',
                        color: s.type === 'movie' ? '#a78bfa' : s.type === 'genre' ? '#fb7185' : '#fbbf24',
                      }}>{s.type.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && !query && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.72rem', fontWeight: 600 }}>Recent:</span>
              {recentSearches.map((r, i) => (
                <button key={i} onClick={() => { setQuery(r); executeSearch(r); }} style={{
                  padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
                  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                  color: 'rgba(255,255,255,.6)', fontSize: '0.75rem', fontWeight: 600,
                  transition: 'all .2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,.4)'; (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.6)'; }}
                >
                  🕐 {r}
                </button>
              ))}
            </div>
          )}

          {/* Typo correction */}
          {correctedQuery && (
            <div style={{ textAlign: 'center', marginTop: 14, animation: 'ss-fade-in .3s ease' }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.82rem' }}>No results for "{query}". Did you mean </span>
              <button onClick={() => { setQuery(correctedQuery); executeSearch(correctedQuery); }} style={{
                color: '#67e8f9', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: 'none', border: 'none', textDecoration: 'underline',
              }}>"{correctedQuery}"</button>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.82rem' }}>?</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SEARCH RESULTS ════════════════════════════════════════════════════ */}
      {(searchResults.length > 0 || isSearching) && (
        <div style={{ marginBottom: 32, animation: 'ss-slide-down .3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 4, height: 24, borderRadius: 4, background: 'linear-gradient(180deg,#7c3aed,#4f46e5)' }} />
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                🔍 Search Results
              </h3>
              {!isSearching && (
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.4)', padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                  {searchResults.length} found
                </span>
              )}
            </div>
            <button onClick={clearSearch} style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>← Clear</button>
          </div>

          {isSearching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton w="100%" h="200px" radius={16} />
                  <div style={{ marginTop: 8 }}><Skeleton w="80%" h="12px" /></div>
                  <div style={{ marginTop: 6 }}><Skeleton w="60%" h="10px" /></div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 16 }}>
              {searchResults.map((m, i) => (
                <div key={m.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <PosterCard movie={m} onClick={() => onSelect(m)} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,.4)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12, animation: 'ss-float 2s ease-in-out infinite' }}>🎬</div>
              <p style={{ fontWeight: 600 }}>No movies found. Try a different search.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── INSIGHTS TICKER ──────────────────────────────────────────────────── */}
      {!query && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 14, overflow: 'hidden', marginBottom: 32,
        }}>
          <div style={{
            padding: '10px 18px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white',
            letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'ss-pulse-dot 1s infinite' }} />
            LIVE INSIGHTS
          </div>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div className="ss-scroll-track" style={{ display: 'flex', gap: 0, width: 'max-content' }}>
              {[...INSIGHTS, ...INSIGHTS].map((ins, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderLeft: '1px solid rgba(255,255,255,.05)',
                  flexShrink: 0,
                }}>
                  <span>{ins.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '0.78rem' }}>{ins.label}:</span>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>{ins.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!query && (
        <>
          {/* ═══ TRENDING NOW ══════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 28, borderRadius: 4, background: 'linear-gradient(180deg,#f43f5e,#e11d48)', boxShadow: '0 0 12px rgba(244,63,94,.5)' }} />
                <div>
                  <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', margin: 0, letterSpacing: '-0.02em' }}>🔥 Trending Now</h3>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.72rem', margin: '3px 0 0', fontWeight: 500 }}>Based on bookings & search activity</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e', animation: 'ss-pulse-dot 1.5s infinite' }} />
                <span style={{ color: '#fb7185', fontSize: '0.72rem', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>

            {/* Horizontal scroll strip */}
            <div style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', paddingBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16, width: 'max-content', padding: '4px 2px 8px' }}>
                {trendingMovies.map((m, i) => (
                  <div key={m.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <PosterCard movie={m} rank={i} showRank onClick={() => onSelect(m)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RECOMMENDED FOR YOU ═══════════════════════════════════════════════ */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 28, borderRadius: 4, background: 'linear-gradient(180deg,#7c3aed,#4f46e5)', boxShadow: '0 0 12px rgba(124,58,237,.5)' }} />
                <div>
                  <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', margin: 0, letterSpacing: '-0.02em' }}>🧠 Recommended for You</h3>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.72rem', margin: '3px 0 0', fontWeight: 500 }}>
                    {preferredGenres.length > 0
                      ? `Based on your love for ${preferredGenres.slice(0, 2).join(' & ')}`
                      : 'Handpicked top-rated films'}
                  </p>
                </div>
              </div>
              <button onClick={onBrowseAll} style={{
                padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.22)',
                color: '#a78bfa', fontWeight: 700, fontSize: '0.78rem', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,.08)'; }}
              >
                See all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'visible', scrollbarWidth: 'none', paddingBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16, width: 'max-content', padding: '4px 2px 8px' }}>
                {recommendedMovies.map((m, i) => (
                  <div key={m.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <PosterCard movie={m} onClick={() => onSelect(m)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ TRENDING INSIGHTS CARDS ═══════════════════════════════════════════ */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 22, borderRadius: 4, background: 'linear-gradient(180deg,#06b6d4,#0891b2)' }} />
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>📊 Trending Insights</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {[
                { icon: '🔍', label: 'Most Searched', value: trendingMovies[0]?.title ?? '—', color: '#7c3aed', glow: 'rgba(124,58,237,.3)', sub: 'Today' },
                { icon: '🎭', label: 'Top Genre', value: topGenre, color: '#e11d48', glow: 'rgba(225,29,72,.3)', sub: 'This week' },
                { icon: '📈', label: 'Rising Fast', value: trendingMovies[2]?.title ?? '—', color: '#0891b2', glow: 'rgba(8,145,178,.3)', sub: '↑ 340% searches' },
                { icon: '⚡', label: 'Selling Fast', value: trendingMovies[1]?.title ?? '—', color: '#d97706', glow: 'rgba(217,119,6,.3)', sub: 'Limited seats' },
              ].map((ins, i) => (
                <div key={i} style={{
                  padding: '18px 20px', borderRadius: 18, cursor: 'pointer',
                  background: `linear-gradient(145deg,rgba(8,4,28,.9),rgba(4,2,14,.95))`,
                  border: `1px solid ${ins.color}25`,
                  boxShadow: `0 4px 24px rgba(0,0,0,.5), 0 0 0 1px ${ins.color}08`,
                  position: 'relative', overflow: 'hidden',
                  animation: `ss-pop .4s ease ${i * 80}ms both`,
                  transition: 'all .3s cubic-bezier(.23,1,.32,1)',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                    (e.currentTarget as HTMLElement).style.borderColor = `${ins.color}55`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px rgba(0,0,0,.7), 0 0 30px ${ins.glow}`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.borderColor = `${ins.color}25`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px rgba(0,0,0,.5)`;
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${ins.color},transparent)` }} />
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle,${ins.glow},transparent 70%)` }} />
                  <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{ins.icon}</div>
                  <div style={{ fontSize: '0.65rem', color: `${ins.color}cc`, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 6 }}>{ins.label}</div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.value}</div>
                  <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.68rem', fontWeight: 500 }}>{ins.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
