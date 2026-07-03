import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Movie } from '../data/store';
import MovieClickAnimation from '../components/booking/MovieClickAnimation';

/* ═══════════════════════════════════════════════════════════════════════════
   HERO BANNER — Full-screen cinematic spotlight
═══════════════════════════════════════════════════════════════════════════ */
const HeroBanner: React.FC = () => {
  const { movies, selectMovie, openBookTickets, movieLikes, movieDislikes, toggleMovieLike, toggleMovieDislike, currentUser } = useApp();
  const trending = movies.filter(m => m.isTrending);
  const [current, setCurrent]   = useState(0);
  const [prev, setPrev]         = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [animState, setAnimState] = useState<{ active: boolean; posterSrc: string; title: string }>({ active: false, posterSrc: '', title: '' });

  const goTo = useCallback((idx: number) => {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setPrev(current);
    setCurrent(idx);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 900);
  }, [transitioning, current]);

  useEffect(() => {
    if (!trending.length) return;
    const t = setInterval(() => goTo((current + 1) % trending.length), 6000);
    return () => clearInterval(t);
  }, [current, trending.length, goTo]);

  if (!trending.length) return null;
  const movie = trending[current];
  const stars = Math.round(movie.rating / 2);

  const handleBook = () => {
    setAnimState({ active: true, posterSrc: movie.poster, title: movie.title });
  };

  return (
    <>
      <MovieClickAnimation
        active={animState.active}
        posterSrc={animState.posterSrc}
        title={animState.title}
        onComplete={() => { setAnimState(s => ({ ...s, active: false })); openBookTickets(movie); }}
      />

      <div className="cc-hero">
        {/* Slides */}
        {trending.map((m, i) => (
          <div key={m.id} className="cc-hero-slide" style={{
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'scale(1.04)' : prev === i ? 'scale(1.02)' : 'scale(1)',
            zIndex: i === current ? 2 : prev === i ? 1 : 0,
            transition: 'opacity 1s ease, transform 8s ease',
          }}>
            <img src={m.banner} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}

        {/* Overlays */}
        <div className="cc-hero-overlay" />
        <div className="cc-hero-vignette" />

        {/* Gold grid on right side */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 50%)',
        }} />

        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 10 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', width: '100%' }}>
            <div style={{ maxWidth: 600 }}>

              {/* Top badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {movie.isTrending && (
                  <span className="cc-badge cc-badge-gold">
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f5c518', animation: 'pulse 1.5s infinite' }} />
                    Trending
                  </span>
                )}
                {movie.isNowShowing && <span className="cc-badge cc-badge-blue">Now Showing</span>}
                <span className="cc-badge cc-badge-glass">{movie.certificate}</span>
                {(movie.language || []).slice(0, 2).map((l: string) => (
                  <span key={l} className="cc-badge cc-badge-glass" style={{ fontSize: '0.65rem' }}>{l}</span>
                ))}
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: 'white',
                textShadow: '0 4px 40px rgba(0,0,0,0.9)',
                marginBottom: 20,
              }}>
                {movie.title}
              </h1>

              {/* Stars + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="cc-stars">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`cc-star ${s <= stars ? '' : 'dim'}`}>★</span>
                    ))}
                  </div>
                  <span style={{
                    fontWeight: 900, fontSize: '1.1rem', color: '#f5c518',
                    fontFamily: 'Outfit, sans-serif',
                    textShadow: '0 0 16px rgba(245,197,24,0.5)',
                  }}>{movie.rating}</span>
                  <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.8rem' }}>/10</span>
                </div>
                <span className="cc-stat-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
                {movie.genre.slice(0, 2).map(g => (
                  <span key={g} className="cc-stat-pill" style={{ borderColor: 'rgba(245,197,24,0.15)', color: 'rgba(245,197,24,0.8)' }}>{g}</span>
                ))}
              </div>

              {/* Description */}
              <p style={{
                color: 'rgba(255,255,255,0.60)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: 480,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>{movie.description}</p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                {movie.isNowShowing ? (
                  <button className="cc-btn-primary" onClick={handleBook}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    Book Tickets
                  </button>
                ) : (
                  <button className="cc-btn-primary" style={{
                    background: 'linear-gradient(135deg, #0080ff, #00b4ff)',
                    boxShadow: '0 6px 0 #004499, 0 10px 32px rgba(0,128,255,0.40)',
                  }} onClick={() => selectMovie(movie)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Notify Me
                  </button>
                )}
                <button className="cc-btn-ghost" onClick={() => selectMovie(movie)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  Watch Trailer
                </button>

                {/* Like/Dislike in hero */}
                {currentUser && (
                  <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                    <button
                      className={`cc-react-btn ${(movieLikes[movie.id]||[]).includes(currentUser.id) ? 'liked' : ''}`}
                      onClick={() => toggleMovieLike(movie.id)}
                    >
                      ♥ {(movieLikes[movie.id]||[]).length}
                    </button>
                    <button
                      className={`cc-react-btn ${(movieDislikes[movie.id]||[]).includes(currentUser.id) ? 'disliked' : ''}`}
                      onClick={() => toggleMovieDislike(movie.id)}
                    >
                      👎 {(movieDislikes[movie.id]||[]).length}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div style={{ position: 'absolute', bottom: 36, right: 40, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
          {trending.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === current ? 4 : 3,
              height: i === current ? 32 : 12,
              borderRadius: 4,
              border: 'none',
              background: i === current
                ? 'linear-gradient(180deg, #6366f1, #ec4899)'
                : 'rgba(255,255,255,0.20)',
              boxShadow: i === current ? '0 0 12px rgba(168,85,247,0.6)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              padding: 0,
            }} />
          ))}
        </div>

        {/* Movie thumbnail strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', justifyContent: 'center', gap: 12, padding: '0 32px 32px',
        }}>
          {trending.map((m, i) => (
            <button key={m.id} onClick={() => goTo(i)} style={{
              flexShrink: 0, width: 56, height: 80,
              borderRadius: 8, overflow: 'hidden', border: 'none', cursor: 'pointer', padding: 0,
              opacity: i === current ? 1 : 0.4,
              transform: i === current ? 'scale(1.12) translateY(-4px)' : 'scale(1)',
              boxShadow: i === current ? '0 0 0 2px #a855f7, 0 8px 20px rgba(168,85,247,0.35)' : '0 2px 8px rgba(0,0,0,0.5)',
              transition: 'all 0.4s ease',
            }}>
              <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
          background: 'linear-gradient(to bottom, transparent, #030308)',
          pointerEvents: 'none', zIndex: 5,
        }} />
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM MOVIE CARD
═══════════════════════════════════════════════════════════════════════════ */
const MovieCard: React.FC<{ movie: Movie; width?: number; onClick: () => void; onBook?: () => void }> = ({ movie, width = 160, onClick, onBook }) => {
  const { movieLikes, movieDislikes, toggleMovieLike, toggleMovieDislike, currentUser } = useApp();
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isLiked    = currentUser ? (movieLikes[movie.id]    || []).includes(currentUser.id) : false;
  const isDisliked = currentUser ? (movieDislikes[movie.id] || []).includes(currentUser.id) : false;
  const likes    = (movieLikes[movie.id]    || []).length;
  const dislikes = (movieDislikes[movie.id] || []).length;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -14;
    el.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-8px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className="cc-movie-card"
      style={{ width, transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)', transformStyle: 'preserve-3d' }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Poster */}
      <div className="cc-poster-wrap">
        <img src={movie.poster} alt={movie.title} />
        <div className="cc-poster-foil" />

        {/* Badges */}
        <div className="cc-rating-badge">
          <span>★</span>{movie.rating}
        </div>
        {movie.isTrending && <div className="cc-status-badge cc-status-trending">Hot</div>}
        {!movie.isTrending && movie.isNowShowing && <div className="cc-status-badge cc-status-now">Live</div>}
        {!movie.isNowShowing && !movie.isTrending && <div className="cc-status-badge cc-status-soon">Soon</div>}

        {/* Hover gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(3,3,8,0.92) 0%, rgba(3,3,8,0.40) 50%, transparent 100%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }} />

        {/* Book button slides up */}
        <div className="cc-book-hover-btn" onClick={e => { e.stopPropagation(); onBook?.(); }}>
          <button className="cc-book-small">
            🎟 Book Now
          </button>
        </div>

        {/* Like/Dislike overlay */}
        <div style={{
          position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease',
          alignItems: 'flex-end',
        }} onClick={e => e.stopPropagation()}>
          <button
            className={`cc-react-btn ${isLiked ? 'liked' : ''}`}
            style={{ fontSize: '0.68rem', padding: '3px 7px', borderRadius: 6 }}
            onClick={() => toggleMovieLike(movie.id)}
          >♥ {likes}</button>
          <button
            className={`cc-react-btn ${isDisliked ? 'disliked' : ''}`}
            style={{ fontSize: '0.68rem', padding: '3px 7px', borderRadius: 6 }}
            onClick={() => toggleMovieDislike(movie.id)}
          >👎 {dislikes}</button>
        </div>
      </div>

      {/* Card info */}
      <div className="cc-card-title" style={{ fontSize: width > 180 ? '0.95rem' : '0.85rem', marginTop: 12 }}>
        {movie.title}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
        {movie.genre.slice(0, 2).map(g => (
          <span key={g} className="cc-genre-chip">{g}</span>
        ))}
      </div>
      <div className="cc-card-meta" style={{ marginTop: 5 }}>
        {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
        {(movie.language || [])[0] && <> · {(movie.language || [])[0]}</>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TRENDING CARD (Wide Netflix-style)
═══════════════════════════════════════════════════════════════════════════ */
const TrendingCard: React.FC<{ movie: Movie; rank: number; onClick: () => void }> = ({ movie, rank, onClick }) => {
  return (
    <div className="cc-trending-card" onClick={onClick} style={{ width: 300 }}>
      <img src={movie.banner || movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div className="cc-trending-overlay" />
      <div className="cc-trending-content">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              {movie.isNowShowing && <span className="cc-badge cc-status-now" style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.62rem' }}>LIVE</span>}
              {movie.genre.slice(0, 1).map(g => (
                <span key={g} style={{ fontSize: '0.7rem', color: 'rgba(245,197,24,0.8)', fontWeight: 600 }}>{g}</span>
              ))}
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'white', lineHeight: 1.2 }}>
              {movie.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ color: '#f5c518', fontSize: '0.85rem', fontWeight: 700 }}>★ {movie.rating}</span>
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.75rem' }}>
                {Math.floor(movie.duration/60)}h {movie.duration%60}m
              </span>
            </div>
          </div>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '5rem', fontWeight: 900, lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `2px rgba(245,197,24,${rank <= 3 ? '0.65' : '0.30'})`,
            letterSpacing: '-0.04em',
            flexShrink: 0, marginLeft: 8,
          }}>{rank}</div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   OFFER CARD
═══════════════════════════════════════════════════════════════════════════ */
const OfferCard: React.FC<{ offer: { id: string; title: string; description: string; discount: string; code: string; color: string; bgGrad: string } }> = ({ offer }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(offer.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="cc-offer-card" style={{ background: offer.bgGrad }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '2rem', marginBottom: 4 }}>{offer.color}</div>
        <div className="cc-offer-disc">{offer.discount}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'white', marginBottom: 4 }}>{offer.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 14 }}>{offer.description}</div>
        <button className="cc-offer-code" onClick={copy}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copied ? '✓ Copied!' : offer.code}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION WRAPPER
═══════════════════════════════════════════════════════════════════════════ */
const Section: React.FC<{ title: string; sub?: string; onSeeAll?: () => void; children: React.ReactNode }> = ({ title, sub, onSeeAll, children }) => (
  <section className="cc-section">
    <div className="cc-section-header">
      <div>
        <div className="cc-section-title">{title}</div>
        {sub && <div className="cc-section-sub">{sub}</div>}
      </div>
      {onSeeAll && (
        <button className="cc-see-all" onClick={onSeeAll}>
          See all <span>→</span>
        </button>
      )}
    </div>
    {children}
  </section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════════════ */
export const Home: React.FC = () => {
  const { movies, navigate, selectMovie, openBookTickets, currentUser, movieInterests, toggleMovieInterest } = useApp();
  const [animState, setAnimState] = useState<{ active: boolean; posterSrc: string; title: string; targetMovie: import('../data/store').Movie | null }>({
    active: false, posterSrc: '', title: '', targetMovie: null,
  });

  const nowShowing  = movies.filter(m => m.isNowShowing);
  const comingSoon  = movies.filter(m => !m.isNowShowing);
  const trending    = movies.filter(m => m.isTrending);

  const handleMovieClick = (movie: Movie) => {
    setAnimState({ active: true, posterSrc: movie.poster, title: movie.title, targetMovie: movie });
  };

  const handleAnimComplete = () => {
    const m = animState.targetMovie;
    setAnimState(s => ({ ...s, active: false, targetMovie: null }));
    if (m) selectMovie(m);
  };

  const handleBook = (movie: Movie) => {
    setAnimState({ active: true, posterSrc: movie.poster, title: movie.title, targetMovie: null });
    setTimeout(() => {
      setAnimState(s => ({ ...s, active: false }));
      openBookTickets(movie);
    }, 1800);
  };

  const OFFERS = [
    { id: '1', title: 'First Booking Deal', description: 'Get flat discount on your first movie booking', discount: '30% OFF', code: 'FIRST30', color: '🎬', bgGrad: 'linear-gradient(135deg, rgba(245,197,24,0.12) 0%, rgba(6,6,15,0.95) 100%)' },
    { id: '2', title: 'Weekend Special', description: 'Extra savings on Friday & Saturday shows', discount: '₹100 OFF', code: 'WEEKEND', color: '🌟', bgGrad: 'linear-gradient(135deg, rgba(0,180,255,0.12) 0%, rgba(6,6,15,0.95) 100%)' },
    { id: '3', title: 'IMAX Experience', description: 'Premium IMAX show discount for members', discount: '20% OFF', code: 'IMAX20', color: '🎭', bgGrad: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,6,15,0.95) 100%)' },
    { id: '4', title: 'Couple Goals', description: 'Book 2 tickets and save big on every show', discount: '₹200 OFF', code: 'COUPLE200', color: '💑', bgGrad: 'linear-gradient(135deg, rgba(233,30,140,0.10) 0%, rgba(6,6,15,0.95) 100%)' },
  ];

  return (
    <div style={{ paddingTop: 0, background: '#030308' }}>
      <MovieClickAnimation
        active={animState.active}
        posterSrc={animState.posterSrc}
        title={animState.title}
        onComplete={handleAnimComplete}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroBanner />

      {/* ── Now Showing ──────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 48 }}>
        <Section
          title="Now Showing"
          sub={`${nowShowing.length} movies in ${useAppCity()}`}
          onSeeAll={() => navigate('movies')}
        >
          <div className="cc-carousel">
            {nowShowing.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                width={165}
                onClick={() => handleMovieClick(m)}
                onBook={() => handleBook(m)}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* ── Trending Now (Netflix-style wide cards) ───────────────────────── */}
      <Section title="Trending Now" sub="What everyone's watching">
        <div className="cc-carousel">
          {trending.map((m, i) => (
            <TrendingCard key={m.id} movie={m} rank={i + 1} onClick={() => handleMovieClick(m)} />
          ))}
        </div>
      </Section>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <div className="cc-stats-banner" style={{ margin: '0 24px 64px' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,197,24,0.6)', marginBottom: 8 }}>
              Trusted By Millions
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'white', letterSpacing: '-0.03em' }}>
              India's Premium <span className="grad-gold-blue">Movie Booking</span> Platform
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {[
              { num: '10K+', label: 'Movies Listed' },
              { num: '500+', label: 'Partner Theatres' },
              { num: '2M+',  label: 'Happy Viewers' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px 16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="cc-stat-num">{s.num}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coming Soon ───────────────────────────────────────────────────── */}
      <Section title="Coming Soon" sub="Reserve your seat in advance" onSeeAll={() => navigate('movies')}>
        <div className="cc-carousel">
          {comingSoon.map(m => {
            const isInterested = currentUser ? (movieInterests[m.id] || []).includes(currentUser.id) : false;
            const interests = (movieInterests[m.id] || []).length;
            return (
              <div key={m.id} style={{ flexShrink: 0, width: 260, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: 'rgba(13,13,26,0.80)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.35s ease',
              }}
                onClick={() => handleMovieClick(m)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,197,24,0.20)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,197,24,0.10)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {/* Banner */}
                <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                  <img src={m.banner || m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,26,0.9), transparent)' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span className="cc-badge cc-badge-blue">Coming Soon</span>
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 800, color: 'white', marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>{m.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {m.genre.slice(0, 2).map(g => <span key={g} className="cc-genre-chip">{g}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(245,197,24,0.7)' }}>
                      {interests} interested
                    </span>
                    <button
                      className={`cc-react-btn ${isInterested ? 'liked' : ''}`}
                      style={{ fontSize: '0.72rem' }}
                      onClick={e => { e.stopPropagation(); if (currentUser) toggleMovieInterest(m.id); else navigate('auth'); }}
                    >
                      {isInterested ? '🔔 Interested' : '+ Notify Me'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Offers ────────────────────────────────────────────────────────── */}
      <Section title="Offers & Deals" sub="Exclusive discounts just for you" onSeeAll={() => navigate('offers')}>
        <div className="cc-carousel">
          {OFFERS.map(o => <OfferCard key={o.id} offer={o} />)}
        </div>
      </Section>

      {/* ── Premium CTA Strip ─────────────────────────────────────────────── */}
      <div style={{
        margin: '0 24px 64px',
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(0,128,255,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
      }}>
        {/* Decorative orb */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.10), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.08), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,197,24,0.65)', marginBottom: 8 }}>
            Theatre Owners
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 8 }}>
            List Your Theatre on<br />
            <span className="grad-gold-blue">CineConnect</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.50)' }}>
            Reach millions of movie fans · Manage shows easily
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
          {currentUser?.role === 'theatre_owner' ? (
            <button className="cc-btn-primary" onClick={() => navigate('theatre-owner')}>
              Open Dashboard →
            </button>
          ) : currentUser ? (
            <button className="cc-btn-ghost">
              Apply to List →
            </button>
          ) : (
            <button className="cc-btn-primary" onClick={() => navigate('auth')}>
              Get Started →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* Helper to get city from context without hook nesting */
const useAppCity = () => {
  const { currentCity } = useApp();
  return currentCity;
};
