import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Theatre, ShowTime } from '../../data/store';
import { apiGetShows } from '../../services/apiService';

// ── Date helpers ──────────────────────────────────────────────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildDates() {
  const out: { value: string; day: string; date: number; month: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Use local time for YYYY-MM-DD instead of UTC to match `<input type="date">` behavior
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    out.push({
      value: localDateStr,
      day:   DAYS[d.getDay()],
      date:  d.getDate(),
      month: MONTHS[d.getMonth()],
    });
  }
  return out;
}
const DATES = buildDates();

// ── Language gradient colours ─────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  Hindi:     'from-orange-500 to-orange-600',
  English:   'from-blue-500   to-blue-600',
  Telugu:    'from-purple-500 to-purple-600',
  Tamil:     'from-red-500    to-red-600',
  Malayalam: 'from-green-500  to-green-600',
  Kannada:   'from-yellow-500 to-yellow-600',
  Bengali:   'from-pink-500   to-pink-600',
  Marathi:   'from-indigo-500 to-indigo-600',
  Punjabi:   'from-teal-500   to-teal-600',
  Gujarati:  'from-cyan-500   to-cyan-600',
};
const langColor = (lang: string) => LANG_COLORS[lang] ?? 'from-gray-500 to-gray-600';

const FORMAT_COLORS: Record<string, string> = {
  IMAX:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  '4DX': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Dolby: 'bg-green-500/20  text-green-300  border-green-500/30',
  '4K':  'bg-blue-500/20   text-blue-300   border-blue-500/30',
  '3D':  'bg-cyan-500/20   text-cyan-300   border-cyan-500/30',
  '2D':  'bg-gray-500/20   text-gray-300   border-gray-500/30',
};

// ── Price helpers ─────────────────────────────────────────────────────────────
function getMinPrice(show: ShowTime): number {
  try {
    if (show?.priceOverride) {
      const vals = Object.values(show.priceOverride).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      if (vals.length) return Math.min(...vals);
    }
  } catch { /* ignore */ }
  return 120;
}

// ── Seat availability style ───────────────────────────────────────────────────
function seatStyle(avail: number, total: number) {
  const pct = total > 0 ? avail / total : 0;
  if (pct > 0.4) return { dot: '🟢', cls: 'text-green-400', border: 'border-green-600/40 hover:border-green-500' };
  if (pct > 0.1) return { dot: '🟡', cls: 'text-yellow-400', border: 'border-yellow-600/40 hover:border-yellow-500' };
  return           { dot: '🔴', cls: 'text-red-400',    border: 'border-red-600/40    hover:border-red-500'   };
}

// ── Cast Photo ────────────────────────────────────────────────────────────────
const CastPhoto: React.FC<{ name: string; image?: string; size?: string }> = ({
  name = '', image = '', size = 'w-10 h-10',
}) => {
  const [err, setErr] = useState(false);
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div className={`${size} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10`}>
      {image && !err ? (
        <img
          src={image} alt={name}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e53935] to-pink-700 text-white font-bold text-xs select-none">
          {initial}
        </div>
      )}
    </div>
  );
};

// ── Show Time Button ──────────────────────────────────────────────────────────
const ShowBtn: React.FC<{ show: ShowTime; onBook: () => void }> = ({ show, onBook }) => {
  const avail = show?.availableSeats ?? 0;
  const total = show?.totalSeats ?? 100;
  const style = seatStyle(avail, total);
  const price = getMinPrice(show);
  const isEnded = show?.isEnded ?? false;
  const isFull  = avail === 0;

  if (isEnded) {
    return (
      <div style={{
        border:'1.5px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'14px 18px',
        opacity:0.35, cursor:'not-allowed', background:'rgba(255,255,255,0.02)', minWidth:120,
      }}>
        <div style={{ color:'#666', fontWeight:800, fontSize:15, textDecoration:'line-through', letterSpacing:0.5 }}>{show?.time ?? ''}</div>
        <div style={{ fontSize:11, color:'#555', marginTop:4, fontWeight:600 }}>Show Ended</div>
      </div>
    );
  }

  return (
    <button
      onClick={onBook}
      disabled={isFull}
      style={{
        border: isFull ? '1.5px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(139,92,246,0.25)',
        borderRadius:16, padding:'14px 18px', textAlign:'left' as const,
        transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', minWidth:130,
        cursor: isFull ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        opacity: isFull ? 0.45 : 1,
        background: isFull ? 'rgba(255,255,255,0.02)' : 'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(255,255,255,0.03))',
      }}
      onMouseEnter={e => { if(!isFull) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.5)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(139,92,246,0.2)'; }}}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ fontWeight:900, fontSize:16, color: isFull ? '#666' : '#fff', letterSpacing:0.3, marginBottom:6 }}>
        {show?.time ?? ''}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' as const }}>
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold text-white bg-gradient-to-r ${langColor(show?.language ?? '')}`} style={{ fontSize:11, padding:'3px 8px' }}>
          {show?.language ?? ''}
        </span>
        <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, fontWeight:700, border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.04)' }}>
          {show?.format ?? '2D'}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color: isFull ? '#666' : style.cls === 'text-green-400' ? '#4ade80' : style.cls === 'text-yellow-400' ? '#facc15' : '#f87171' }}>
          {style.dot} {isFull ? 'Housefull' : avail < 20 ? `${avail} left` : `${avail} seats`}
        </span>
        {!isFull && (
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
            ₹{price}
          </span>
        )}
      </div>
    </button>
  );
};

// ── Theatre Card ──────────────────────────────────────────────────────────────
const TheatreCard: React.FC<{
  theatre: Theatre;
  shows: ShowTime[];
  selLang: string;
  onBook: (t: Theatre, s: ShowTime) => void;
}> = ({ theatre, shows, selLang, onBook }) => {
  const name     = theatre?.name     ?? 'Unknown Theatre';
  const location = theatre?.location ?? '';
  const type     = theatre?.type     ?? 'Standard';
  const amenities = theatre?.amenities ?? [];
  const image    = theatre?.image    ?? '';

  const typeColor =
    type === 'IMAX'    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    type === 'PVR'     ? 'bg-blue-500/20   text-blue-400   border-blue-500/30'   :
    type === '4DX'     ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                         'bg-green-500/20  text-green-400  border-green-500/30';

  return (
    <div style={{
      background:'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      border:'1.5px solid rgba(139,92,246,0.12)',
      borderRadius:20, overflow:'hidden',
      transition:'all 0.3s ease',
      boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(139,92,246,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
    >
      {/* Theatre Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'18px 20px' }}>
        {image ? (
          <div style={{ width:56, height:48, flexShrink:0, borderRadius:14, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
            <img
              src={image} alt={name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div style={{ width:56, height:48, flexShrink:0, borderRadius:14, background:'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(255,255,255,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg style={{ width:22, height:22, color:'rgba(139,92,246,0.5)' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
            <h3 style={{ color:'#fff', fontWeight:800, fontSize:15, margin:0, letterSpacing:0.2 }}>{name}</h3>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:800, border:`1px solid ${typeColor.includes('yellow') ? 'rgba(234,179,8,0.3)' : typeColor.includes('blue') ? 'rgba(59,130,246,0.3)' : typeColor.includes('purple') ? 'rgba(168,85,247,0.3)' : 'rgba(74,222,128,0.3)'}`, color: typeColor.includes('yellow') ? '#eab308' : typeColor.includes('blue') ? '#60a5fa' : typeColor.includes('purple') ? '#c084fc' : '#4ade80', background: typeColor.includes('yellow') ? 'rgba(234,179,8,0.1)' : typeColor.includes('blue') ? 'rgba(59,130,246,0.1)' : typeColor.includes('purple') ? 'rgba(168,85,247,0.1)' : 'rgba(74,222,128,0.1)' }}>
              {type}
            </span>
            {selLang && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${langColor(selLang)}`} style={{ fontSize:10, padding:'3px 10px' }}>
                {selLang}
              </span>
            )}
          </div>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, display:'flex', alignItems:'center', gap:5, margin:0, letterSpacing:0.3 }}>
            📍 {location}
          </p>
          {amenities.length > 0 && (
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              {amenities.slice(0, 4).map(a => (
                <span key={a} style={{ fontSize:10, background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.12)', color:'rgba(255,255,255,0.4)', padding:'3px 8px', borderRadius:6, fontWeight:600 }}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        <span style={{ flexShrink:0, fontSize:11, background:'rgba(139,92,246,0.12)', color:'#c084fc', border:'1.5px solid rgba(139,92,246,0.25)', padding:'5px 12px', borderRadius:20, fontWeight:800, letterSpacing:0.3 }}>
          {shows.length} show{shows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Show time buttons — spacious grid */}
      <div style={{ padding:'4px 20px 20px', borderTop:'1px solid rgba(139,92,246,0.08)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12, marginTop:12 }}>
          {shows.map(show => (
            <ShowBtn
              key={show?.id ?? Math.random()}
              show={show}
              onBook={() => onBook(theatre, show)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Price Range Filters ───────────────────────────────────────────────────────
const PRICE_RANGES = [
  { label: 'All Prices',  min: 0,   max: 99999 },
  { label: '< ₹150',     min: 0,   max: 149   },
  { label: '₹150–₹250',  min: 150, max: 250   },
  { label: '₹250–₹400',  min: 251, max: 400   },
  { label: '₹400+',      min: 401, max: 99999 },
];

const THEATRE_TYPES = ['All', 'IMAX', 'PVR', 'Standard', '4DX'] as const;

// ── Main BookTicketsModal ─────────────────────────────────────────────────────
type Step = 'language' | 'theatres';

export const BookTicketsModal: React.FC = () => {
  const ctx = useApp();

  // Safe-destructure everything
  const bookTickets   = ctx?.bookTickets   ?? { open: false, movie: null };
  const closeBookTickets = ctx?.closeBookTickets ?? (() => {});
  const theatres      = ctx?.theatres      ?? [];
  const movies        = ctx?.movies        ?? [];
  const currentCity   = ctx?.currentCity   ?? 'Mumbai';
  const currentUser   = ctx?.currentUser   ?? null;
  const ctxNavigate   = ctx?.navigate;
  const selectTheatre = ctx?.selectTheatre ?? (() => {});
  const selectShowTime = ctx?.selectShowTime ?? (() => {});

  const open  = bookTickets?.open  ?? false;
  const movie = bookTickets?.movie ?? null;

  const [step,       setStep]       = useState<Step>('language');
  const [selDate,    setSelDate]    = useState(() => DATES[0]?.value ?? '');
  const [selLang,    setSelLang]    = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priceIdx,   setPriceIdx]   = useState(0);
  const [search,     setSearch]     = useState('');
  const [showCast,   setShowCast]   = useState(false);

  // ── Real shows from backend (keyed by theatreId) ─────────────────────────────
  const [backendShows, setBackendShows] = useState<any[]>([]);
  const [showsLoading, setShowsLoading] = useState(false);

  // Fetch shows from /api/shows whenever the movie or date changes
  useEffect(() => {
    if (!open || !movie?.id) return;
    let cancelled = false;
    const loadShows = async () => {
      setShowsLoading(true);
      try {
        const res = await apiGetShows({ movieId: movie.id, date: selDate });
        if (!cancelled) {
          const shows = (res.data as any)?.data || (res.data as any)?.shows || [];
          setBackendShows(shows);
        }
      } catch {
        // silent fail — keep existing shows
      } finally {
        if (!cancelled) setShowsLoading(false);
      }
    };
    loadShows();
    return () => { cancelled = true; };
  }, [open, movie?.id, selDate]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('language');
      setSelDate(DATES[0]?.value ?? '');
      setSelLang('');
      setTypeFilter('All');
      setPriceIdx(0);
      setSearch('');
      setShowCast(false);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeBookTickets(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, closeBookTickets]);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Live movie (picks up admin cast/trailer edits instantly)
  const liveMovie = useMemo(() => {
    if (!movie?.id) return movie;
    try {
      return (movies ?? []).find(m => m?.id === movie.id) ?? movie;
    } catch { return movie; }
  }, [movie, movies]);

  // All approved, active theatres
  const allActive = useMemo(() => {
    try {
      return (theatres ?? []).filter(t =>
        t && t.approvalStatus === 'approved' && t.isActive
      );
    } catch { return []; }
  }, [theatres]);

  // City-filtered theatres
  const cityTheatres = useMemo(() => {
    try {
      return allActive.filter(t =>
        (t?.city ?? '').toLowerCase() === (currentCity ?? '').toLowerCase()
      );
    } catch { return []; }
  }, [allActive, currentCity]);

  const baseTheatres = cityTheatres.length > 0 ? cityTheatres : allActive;

  // Get valid shows for a theatre — checks BOTH backend Show collection AND embedded showTimes
  const getShows = useCallback((theatre: Theatre): ShowTime[] => {
    try {
      // 1. Shows from backend /api/shows (created by theatre owners)
      const fromBackend = backendShows
        .filter(s =>
          s &&
          (String(s.theatreId?._id || s.theatreId) === String(theatre._id || theatre.id)) &&
          s.date === selDate
        )
        .map((s: any) => ({
          id:             String(s._id || s.id),
          time:           s.time || '',
          date:           s.date || selDate,
          language:       s.language || '',
          format:         s.format || '2D',
          movieId:        String(s.movieId?._id || s.movieId || ''),
          totalSeats:     s.totalSeats || 100,
          availableSeats: s.availableSeats ?? s.totalSeats ?? 100,
          isEnded:        s.isEnded ?? false,
          isCancelled:    s.isCancelled ?? false,
          priceOverride:  s.prices || s.priceOverride || {},
          screenName:     s.screenName || 'Screen 1',
          status:         s.status || 'scheduled',
        } as ShowTime))
        .filter(s => !s.isEnded && !s.isCancelled);

      // 2. Fallback: embedded showTimes (legacy / seed data)
      const fromEmbedded = (theatre.showTimes ?? []).filter(s => {
        if (!s || !s.date || !s.time || !s.language) return false;
        if (s.date !== selDate) return false;
        if (s.movieId && s.movieId !== liveMovie?.id) return false;
        if (s.isEnded) return false;
        // Skip if already covered by backend shows (same time + language)
        return !fromBackend.some(b => b.time === s.time && b.language === s.language);
      });

      return [...fromBackend, ...fromEmbedded];
    } catch { return []; }
  }, [backendShows, liveMovie, selDate]);

  // Available languages across all base theatres for selected date
  const availLangs = useMemo(() => {
    try {
      const langSet = new Set<string>();
      baseTheatres.forEach(t => {
        getShows(t).forEach(s => {
          if (s?.language) langSet.add(s.language);
        });
      });
      return Array.from(langSet).sort();
    } catch { return []; }
  }, [baseTheatres, getShows]);

  // Language → theatre + show count stats
  const langStats = useMemo(() => {
    const stats: Record<string, { theatreCount: number; showCount: number }> = {};
    try {
      availLangs.forEach(lang => {
        let theatreCount = 0;
        let showCount = 0;
        baseTheatres.forEach(t => {
          const shows = getShows(t).filter(s => s?.language === lang);
          if (shows.length > 0) { theatreCount++; showCount += shows.length; }
        });
        stats[lang] = { theatreCount, showCount };
      });
    } catch { /* ignore */ }
    return stats;
  }, [availLangs, baseTheatres, getShows]);

  // Filtered theatres for step 2
  const filteredTheatres = useMemo(() => {
    try {
      const pr = PRICE_RANGES[priceIdx] ?? PRICE_RANGES[0];
      return baseTheatres
        .filter(t => typeFilter === 'All' || t?.type === typeFilter)
        .filter(t =>
          !search ||
          (t?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t?.location ?? '').toLowerCase().includes(search.toLowerCase())
        )
        .map(t => {
          let shows = getShows(t);
          if (selLang) shows = shows.filter(s => s?.language === selLang);
          if (pr.min > 0 || pr.max < 99999) {
            shows = shows.filter(s => {
              const p = getMinPrice(s);
              return p >= pr.min && p <= pr.max;
            });
          }
          return { theatre: t, shows };
        })
        .filter(x => x.shows.length > 0);
    } catch { return []; }
  }, [baseTheatres, typeFilter, search, selLang, priceIdx, getShows]);

  // Handlers
  const pickLang = (lang: string) => { setSelLang(lang); setStep('theatres'); };
  const showAll  = ()             => { setSelLang('');   setStep('theatres'); };

  const handleDateChange = (val: string) => {
    setSelDate(val);
    setStep('language');
    setSelLang('');
  };

  const handleBook = (theatre: Theatre, show: ShowTime) => {
    if (!currentUser) { closeBookTickets(); ctxNavigate?.('auth'); return; }
    if (movie) (useApp.getState ? useApp.getState().selectMovie : (window as any).selectMovie || (()=>{}))(movie);
    closeBookTickets();
    selectTheatre(theatre);
    selectShowTime(String(show.id || (show as any)._id), selDate);
  };

  const clearFilters = () => { setTypeFilter('All'); setPriceIdx(0); setSearch(''); };
  const hasFilters = typeFilter !== 'All' || priceIdx !== 0 || search !== '';

  // Don't render when closed or no movie
  if (!open) return null;
  if (!liveMovie) return null;

  const cast = liveMovie?.castMembers ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998] backdrop-blur-xl"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(99,50,180,0.18), rgba(0,0,0,0.92))' }}
        onClick={closeBookTickets}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-[999] flex flex-col overflow-hidden"
        style={{
          top: '1.5rem',
          borderRadius: '1.75rem 1.75rem 0 0',
          background: 'linear-gradient(165deg, #0c0618 0%, #0a0a1a 40%, #08061a 100%)',
          boxShadow: '0 -12px 60px rgba(99,50,180,0.3), 0 -2px 0 rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Animated top glow bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, zIndex:10, background:'linear-gradient(90deg, transparent, #8b5cf6, #ec4899, #f59e0b, #8b5cf6, transparent)', backgroundSize:'200% 100%', animation:'glowSlide 3s linear infinite' }} />
        <style>{`@keyframes glowSlide { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

        {/* Background orbs */}
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:100, left:-60, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(236,72,153,0.06), transparent 70%)', pointerEvents:'none' }} />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 sm:px-6 pt-5 pb-3" style={{ position:'relative', borderBottom:'1px solid rgba(139,92,246,0.15)', background:'linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%)' }}>
          {/* Drag handle */}
          <div className="mx-auto mb-4" style={{ width:48, height:4, borderRadius:4, background:'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(236,72,153,0.5))' }} />

          {/* Movie info */}
          <div className="flex items-start gap-3 mb-3">
            {/* Poster */}
            <div className="relative flex-shrink-0">
              <div className="rounded-xl overflow-hidden" style={{ width:52, height:72, boxShadow:'0 4px 20px rgba(139,92,246,0.3), 0 0 0 1.5px rgba(139,92,246,0.3)', border:'1.5px solid rgba(255,255,255,0.12)' }}>
                <img
                  src={liveMovie?.poster ?? ''}
                  alt={liveMovie?.title ?? ''}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />
              </div>
              <div style={{ position:'absolute', bottom:-4, right:-4, background:'linear-gradient(135deg, #f59e0b, #f97316)', color:'#000', fontSize:8, fontWeight:900, padding:'2px 6px', borderRadius:6, boxShadow:'0 2px 8px rgba(245,158,11,0.4)' }}>
                {liveMovie?.certificate ?? 'UA'}
              </div>
            </div>

            {/* Title & meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', background:'linear-gradient(90deg, #c084fc, #f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  🎟 Book Tickets
                </span>
                {step === 'theatres' && selLang && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${langColor(selLang)}`}>
                    {selLang}
                  </span>
                )}
              </div>
              <h2 className="text-white font-black text-base sm:text-lg leading-tight truncate">
                {liveMovie?.title ?? ''}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-yellow-400 text-xs font-bold">★ {liveMovie?.rating ?? 0}</span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400 text-xs">
                  {Math.floor(((liveMovie?.duration ?? 0)) / 60)}h {(liveMovie?.duration ?? 0) % 60}m
                </span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-400 text-xs">
                  {(liveMovie?.genre ?? []).slice(0, 2).join(', ')}
                </span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-500 text-xs">{currentCity}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {cast.length > 0 && (
                <button
                  onClick={() => setShowCast(v => !v)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                    showCast
                      ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
                      : 'bg-white/8 border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  🎭 Cast
                </button>
              )}
              <button
                onClick={closeBookTickets}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cast strip (collapsible) */}
          {showCast && cast.length > 0 && (
            <div className="mb-2.5 pb-2.5 border-b border-white/8">
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {cast.map((cm, i) => (
                  <div key={i} className="flex-shrink-0 text-center w-12">
                    <div className="mx-auto mb-1 flex justify-center">
                      <CastPhoto name={cm?.name ?? ''} image={cm?.image ?? ''} size="w-10 h-10" />
                    </div>
                    <p className="text-white text-[9px] font-semibold truncate">{cm?.name ?? ''}</p>
                    <p className="text-gray-500 text-[8px] truncate">{cm?.role ?? ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-day date strip */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {DATES.map((d, i) => (
              <button
                key={d.value}
                onClick={() => handleDateChange(d.value)}
                style={{
                  flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                  padding:'8px 14px', borderRadius:14, minWidth:56, textAlign:'center',
                  transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor:'pointer', fontFamily:'inherit', position:'relative', overflow:'hidden',
                  background: selDate === d.value
                    ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                    : 'rgba(255,255,255,0.04)',
                  border: selDate === d.value
                    ? '1.5px solid rgba(139,92,246,0.6)'
                    : '1.5px solid rgba(255,255,255,0.08)',
                  boxShadow: selDate === d.value
                    ? '0 4px 20px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : 'none',
                  transform: selDate === d.value ? 'translateY(-2px)' : 'none',
                  color: selDate === d.value ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              >
                {selDate === d.value && <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%)', pointerEvents:'none' }} />}
                <span style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>{d.day}</span>
                <span style={{ fontSize:15, fontWeight:900, lineHeight:1.1 }}>{d.date}</span>
                <span style={{ fontSize:9, fontWeight:500 }}>{d.month}</span>
                {i === 0 && <span style={{ fontSize:7, fontWeight:800, color: selDate === d.value ? '#fde68a' : '#a78bfa', marginTop:2, letterSpacing:0.5 }}>TODAY</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── STEP 1: LANGUAGE SELECTION ───────────────────────────────────── */}
        {step === 'language' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg, #8b5cf6, #a855f7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(139,92,246,0.35)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Choose Language</p>
                    <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>
                      {cityTheatres.length > 0
                        ? `${cityTheatres.length} theatres in ${currentCity}`
                        : `Showing all cities`}
                    </p>
                  </div>
                </div>
                {availLangs.length > 1 && (
                  <button
                    onClick={showAll}
                    style={{ fontSize:12, color:'#c084fc', border:'1.5px solid rgba(139,92,246,0.3)', padding:'6px 14px', borderRadius:10, background:'rgba(139,92,246,0.08)', cursor:'pointer', fontFamily:'inherit', fontWeight:700, transition:'all 0.2s' }}
                  >
                    All Languages →
                  </button>
                )}
              </div>

              {availLangs.length === 0 ? (
                /* No shows state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">No Shows Available</h3>
                  <p className="text-gray-400 text-sm max-w-xs mb-1">
                    No theatres have shows for <span className="text-white font-semibold">{liveMovie?.title}</span> on this date.
                  </p>
                  <p className="text-gray-500 text-xs mb-5">Try a different date or another city.</p>

                  {/* Date navigation quick links */}
                  <div className="flex gap-2 flex-wrap justify-center mb-6">
                    {DATES.slice(1, 4).map(d => (
                      <button
                        key={d.value}
                        onClick={() => handleDateChange(d.value)}
                        className="text-xs bg-white/8 hover:bg-white/12 border border-white/12 text-gray-300 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Try {d.day} {d.date}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white/4 border border-white/10 rounded-xl p-4 max-w-xs text-left">
                    <p className="text-[#e53935] text-xs font-bold mb-1">💡 Add Shows</p>
                    <p className="text-gray-500 text-xs">
                      Theatre owners can add showtimes from the Theatre Owner dashboard.<br />
                      Login: <span className="text-white font-mono text-[10px]">owner1@theatre.com / owner123</span>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Language Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                    {availLangs.map(lang => {
                      const stats = langStats[lang] ?? { theatreCount: 0, showCount: 0 };
                      return (
                        <button
                          key={lang}
                          onClick={() => pickLang(lang)}
                          className="relative group overflow-hidden text-left"
                          style={{
                            minHeight:100, borderRadius:18, cursor:'pointer', fontFamily:'inherit',
                            background:'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                            border:'1.5px solid rgba(139,92,246,0.15)',
                            transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                            boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.03)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(139,92,246,0.25)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = '';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.15)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                          }}
                        >
                          {/* Gradient bg */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${langColor(lang)} opacity-8 group-hover:opacity-20 transition-opacity`} />
                          {/* Glow orb */}
                          <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${langColor(lang)} opacity-15 blur-xl group-hover:opacity-40 transition-opacity`} />
                          {/* Glassmorphism shine */}
                          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents:'none' }} />

                          <div className="relative p-4">
                            <p className={`font-black text-lg bg-gradient-to-r ${langColor(lang)} bg-clip-text text-transparent mb-2`}>
                              {lang}
                            </p>
                            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
                                🎭 {stats.theatreCount} theatre{stats.theatreCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>
                              🎬 {stats.showCount} show{stats.showCount !== 1 ? 's' : ''}
                            </span>
                            {/* Arrow */}
                            <div className={`absolute bottom-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br ${langColor(lang)} flex items-center justify-center opacity-60 group-hover:opacity-100 transition-all group-hover:scale-110`} style={{ boxShadow:'0 3px 12px rgba(0,0,0,0.3)' }}>
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Or show all */}
                  <button
                    onClick={showAll}
                    style={{
                      width:'100%', padding:'12px', borderRadius:14, cursor:'pointer', fontFamily:'inherit',
                      background:'rgba(139,92,246,0.06)', border:'1.5px solid rgba(139,92,246,0.15)',
                      color:'#c084fc', fontSize:13, fontWeight:700, transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.15)'; }}
                  >
                    Show all languages →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: THEATRE LIST ─────────────────────────────────────────── */}
        {step === 'theatres' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-white/8 space-y-2">
              {/* Breadcrumb + search row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setStep('language'); setSelLang(''); }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Languages
                </button>
                {selLang && (
                  <>
                    <span className="text-gray-600">›</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${langColor(selLang)}`}>
                      {selLang}
                    </span>
                  </>
                )}
                <div className="flex-1" />
                {/* Search */}
                <div className="relative max-w-[180px] w-full">
                  <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search theatres…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Theatre type + price filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {/* Theatre type */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {THEATRE_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap ${
                        typeFilter === t
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                          : 'border-white/12 text-gray-400 hover:text-white bg-white/4'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                {/* Price range */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {PRICE_RANGES.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setPriceIdx(i)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all whitespace-nowrap ${
                        priceIdx === i
                          ? 'bg-green-600/80 border-green-500 text-white'
                          : 'border-white/12 text-gray-400 hover:text-white bg-white/4'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex-shrink-0 text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-lg transition-all"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Theatre list */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {filteredTheatres.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">No Theatres Found</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {hasFilters ? 'Try removing some filters.' : 'No theatres available for selected criteria.'}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#e53935] hover:text-red-400 border border-[#e53935]/30 px-4 py-2 rounded-xl transition-all"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                filteredTheatres.map(({ theatre, shows }) => (
                  <TheatreCard
                    key={theatre?.id ?? Math.random()}
                    theatre={theatre}
                    shows={shows}
                    selLang={selLang}
                    onBook={handleBook}
                  />
                ))
              )}
              {/* Bottom padding */}
              <div className="h-6" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
