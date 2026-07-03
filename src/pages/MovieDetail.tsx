import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CastMember } from '../data/store';

/* ── YouTube embed ── */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let vid = '';
    if (u.hostname.includes('youtube.com')) {
      vid = u.searchParams.get('v') ?? '';
      if (!vid) { const p = u.pathname.split('/').filter(Boolean); if (p[0]==='embed'||p[0]==='shorts') vid=p[1]??''; }
    } else if (u.hostname === 'youtu.be') {
      vid = u.pathname.split('/').filter(Boolean)[0] ?? '';
    }
    if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`;
  } catch { /* ignore */ }
  return null;
}

/* ── Premium Cast Card ── */
const CastCard: React.FC<{ cm: CastMember; index: number }> = ({ cm, index }) => {
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex-shrink-0 text-center cursor-pointer"
      style={{ width: 140, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative mx-auto mb-4" style={{ width: 110, height: 110 }}>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full transition-all duration-300" style={{
          background: hovered ? 'linear-gradient(135deg,#8b5cf6,#f5c518,#8b5cf6)' : 'linear-gradient(135deg,rgba(139,92,246,0.4),rgba(245,197,24,0.3))',
          padding: 3, borderRadius: '50%',
          boxShadow: hovered ? '0 0 28px rgba(139,92,246,0.6), 0 0 48px rgba(245,197,24,0.3)' : '0 0 14px rgba(139,92,246,0.2)',
        }}>
          <div className="w-full h-full rounded-full overflow-hidden" style={{ background: '#0d0d1a' }}>
            {cm.image && !failed ? (
              <img src={cm.image} alt={cm.name} className="w-full h-full object-cover"
                style={{ transition: 'transform 0.4s', transform: hovered ? 'scale(1.12)' : 'scale(1)' }}
                onError={() => setFailed(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl"
                style={{ background: 'linear-gradient(135deg,#8b5cf622,#f5c51822)', color: '#8b5cf6' }}>
                {(cm.name ?? '?')[0]}
              </div>
            )}
          </div>
        </div>
        {/* Index badge */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: 'linear-gradient(135deg,#f5c518,#ff8f00)', color: '#000', boxShadow: '0 2px 8px rgba(245,197,24,0.5)' }}>
          {index + 1}
        </div>
      </div>
      <p style={{ color: hovered ? '#c084fc' : 'white', transition: 'color 0.3s', fontWeight:800, fontSize:13, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, padding:'0 4px' }}>{cm.name}</p>
      {cm.role && <p style={{ color: '#f5c518', opacity: 0.8, fontSize:12, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, padding:'0 4px' }}>{cm.role}</p>}
    </div>
  );
};

/* ── Trailer types ── */
interface TrailerItem {
  id: string;
  title: string;
  url: string;
  duration: string;
  thumbnailUrl?: string;
}

function ytVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] ?? '';
    if (u.hostname.includes('youtube.com')) {
      const vid = u.searchParams.get('v');
      if (vid) return vid;
      const p = u.pathname.split('/').filter(Boolean);
      if (p[0] === 'embed' || p[0] === 'shorts') return p[1] ?? '';
    }
  } catch { /* ignore */ }
  return '';
}
function ytThumb(url: string, quality = 'maxresdefault'): string {
  const vid = ytVideoId(url);
  return vid ? `https://img.youtube.com/vi/${vid}/${quality}.jpg` : '';
}

/* ── Trailer Video Modal ── */
const TrailerVideoModal: React.FC<{ trailer: TrailerItem | null; onClose: () => void }> = ({ trailer, onClose }) => {
  useEffect(() => {
    if (!trailer) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', fn);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', fn); };
  }, [trailer, onClose]);
  if (!trailer) return null;
  const embedUrl = getYouTubeEmbedUrl(trailer.url);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(24px)', cursor:'pointer' }} />
      <div style={{ position:'relative', width:'92vw', maxWidth:1100, aspectRatio:'16/9', borderRadius:20, overflow:'hidden', boxShadow:'0 0 0 2px rgba(229,9,20,0.4), 0 40px 100px rgba(0,0,0,0.9)', animation:'trlMdlIn .35s ease both' }}>
        <style>{`@keyframes trlMdlIn{from{opacity:0;transform:scale(.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        <button onClick={onClose} aria-label="Close trailer" style={{
          position:'absolute', top:14, right:14, zIndex:10, width:42, height:42, borderRadius:'50%',
          background:'rgba(0,0,0,0.7)', border:'1.5px solid rgba(255,255,255,0.15)', color:'white',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)', transition:'all .2s',
        }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(229,9,20,0.7)';}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.7)';}}
        ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10, padding:'14px 20px', background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)', pointerEvents:'none' }}>
          <p style={{ color:'white', fontWeight:800, fontSize:14 }}>{trailer.title}</p>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:3 }}>🕐 {trailer.duration}</p>
        </div>
        {embedUrl ? (
          <iframe src={embedUrl} title={trailer.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} />
        ) : (
          <video src={trailer.url} controls autoPlay style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', background:'#000' }} />
        )}
      </div>
    </div>
  );
};

/* ── TrailersSection: Premium Compact Layout ── */
const TrailersSection: React.FC<{ movie: any; openBookTickets: (m: any) => void; toggleMovieLike: (id: string) => void; isLiked: boolean }> = ({ movie, openBookTickets, toggleMovieLike, isLiked }) => {
  const [playing, setPlaying] = useState<TrailerItem | null>(null);
  const [hovered, setHovered] = useState(false);

  // Build cards from props trailers array OR fallback to single trailerUrl
  const allTrailers: TrailerItem[] = (() => {
    if (movie.trailers && movie.trailers.length > 0) {
      return movie.trailers.map((t: any) => ({ ...t, thumbnailUrl: t.image || ytThumb(t.url) }));
    }
    if (movie.trailerUrl) {
      return [{ id: 'legacy', title: 'Official Trailer', url: movie.trailerUrl, duration: '2:45', thumbnailUrl: ytThumb(movie.trailerUrl) }];
    }
    if (movie.trailerFile) {
      return [{ id: 'local', title: 'Uploaded Trailer', url: movie.trailerFile, duration: '3:00' }];
    }
    return [];
  })();

  if (allTrailers.length === 0) return null;
  const featured = allTrailers[0];
  const thumb = featured.thumbnailUrl || ytThumb(featured.url);
  const genreColors: Record<string, string> = {
    Action: '#ff1450', Adventure: '#f97316', Comedy: '#f5c518', Drama: '#a78bfa',
    Horror: '#6366f1', 'Sci-Fi': '#00b4ff', Thriller: '#34d399', Romance: '#f472b6',
  };

  return (
    <div className="mb-12" id="trailer-section" style={{ animation: 'trlFadeIn 0.5s ease both' }}>
      <style>{`
        @keyframes trlFadeIn { from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} }
        @keyframes playPulse { 0%{box-shadow:0 0 0 0 rgba(229,9,20,0.6)} 70%{box-shadow:0 0 0 16px rgba(229,9,20,0)} 100%{box-shadow:0 0 0 0 rgba(229,9,20,0)} }
        .trailer-card {
           display: flex; flex-direction: column; gap: 20px; padding: 20px;
           background: rgba(15,15,25,0.65);
           backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
           border-radius: 24px;
           border: 1px solid rgba(255,255,255,0.06);
           box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
           transition: all 0.4s ease;
        }
        .trailer-card:hover { border-color: rgba(0,180,255,0.3); box-shadow: 0 16px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,180,255,0.1); }
        .trailer-player {
           position: relative; flex-shrink: 0; border-radius: 16px; overflow: hidden; cursor: pointer;
           width: 100%; height: 200px;
        }
        @media (min-width: 768px) { .trailer-player { height: 220px; } }
        @media (min-width: 1024px) { 
           .trailer-player { width: 460px; height: 260px; } 
           .trailer-card { flex-direction: row; align-items: center; gap: 32px; padding: 24px; }
        }
        .trailer-thumb { transition: transform 0.6s ease; object-fit: cover; width: 100%; height: 100%; filter: brightness(0.7); }
        .trailer-player:hover .trailer-thumb { transform: scale(1.05); filter: brightness(0.5); }
        .trailer-btn { padding: 12px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; cursor: pointer; }
      `}</style>
      
      <div className="trailer-card">
        {/* Left Side: Compact Trailer Player */}
        <div className="trailer-player" onClick={() => setPlaying(featured)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          {thumb ? (
            <img src={thumb} className="trailer-thumb" alt={featured.title} onError={e=>{ (e.currentTarget as HTMLImageElement).src = ytThumb(featured.url, 'hqdefault'); }} />
          ) : (
            <div style={{ width:'100%', height:'100%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🎬</div>
          )}
          {/* Overlays */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent 50%)' }} />
          
          <div style={{
            position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #E50914, #B20710)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(229,9,20,0.5)',
            animation: hovered ? 'playPulse 1.5s infinite' : 'none',
          }}>
             <div style={{ width:0, height:0, borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderLeft:'16px solid white', marginLeft:4 }} />
          </div>

          <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:800, color:'#f5c518', border:'1px solid rgba(245,197,24,0.3)' }}>
            4K / HD
          </div>
          <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.7)', padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:700, color:'white' }}>
            {featured.duration}
          </div>
        </div>

        {/* Right Side: Movie Quick Info */}
        <div style={{ flex: 1 }}>
           <h3 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{movie.title}</h3>
           
           <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
             <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>⏱ {Math.floor((movie.duration??0)/60)}h {(movie.duration??0)%60}m</span>
             <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>📅 {movie.releaseDate}</span>
             <span style={{ fontSize:13, color:'#f5c518', fontWeight:800, display:'flex', alignItems:'center', gap:4 }}>★ {movie.rating}/10</span>
           </div>

           <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
             {(movie.genre ?? []).map((g: string) => (
                <span key={g} style={{ padding: '4px 12px', borderRadius: 20, background: `${genreColors[g] ?? '#00b4ff'}15`, color: genreColors[g] ?? '#00b4ff', fontSize: 11, fontWeight: 700, border: `1px solid ${genreColors[g] ?? '#00b4ff'}30` }}>{g}</span>
             ))}
           </div>

           <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
             <button className="trailer-btn" onClick={() => setPlaying(featured)} style={{ background: 'linear-gradient(135deg,rgba(0,180,255,0.15),rgba(0,180,255,0.05))', color: '#00b4ff', border: '1px solid rgba(0,180,255,0.3)', boxShadow: '0 4px 14px rgba(0,180,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
               ▶ Watch Trailer
             </button>
             {movie.isNowShowing && (
               <button className="trailer-btn" onClick={() => openBookTickets(movie)} style={{ background: 'linear-gradient(135deg,#f5c518,#ff8f00)', color: '#000', border: 'none', boxShadow: '0 4px 16px rgba(245,197,24,0.4)' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                 🎟️ Book Tickets
               </button>
             )}
             <button className="trailer-btn" onClick={() => toggleMovieLike(movie.id)} style={{ background: isLiked ? 'rgba(245,197,24,0.1)' : 'rgba(255,255,255,0.05)', color: isLiked ? '#f5c518' : 'white', border: `1px solid ${isLiked ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.1)'}` }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
               {isLiked ? '❤️ Wishlisted' : '🤍 Add Wishlist'}
             </button>
           </div>
        </div>
      </div>
      
      {/* Expanded trailer cards grid for other trailers */}
      {allTrailers.length > 1 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16, marginTop:20 }}>
          {allTrailers.slice(1).map((t, i) => {
            const listThumb = t.thumbnailUrl || ytThumb(t.url);
            return (
              <div key={t.id} onClick={() => setPlaying(t)}
                style={{
                  borderRadius:14, overflow:'hidden', cursor:'pointer',
                  background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.08)',
                  transition:'all .3s ease',
                  animation:`trlFadeIn .4s ease ${i * 60}ms both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(229,9,20,0.5)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.5), 0 0 24px rgba(229,9,20,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ position:'relative', aspectRatio:'16/9', background:'#111' }}>
                  {listThumb ? (
                    <img src={listThumb} alt={t.title} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75)' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  ) : (
                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a2e', color:'rgba(255,255,255,0.2)', fontSize:36 }}>🎬</div>
                  )}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(229,9,20,0.85)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(229,9,20,0.4)', }}>
                    <div style={{ width:0, height:0, borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderLeft:'14px solid white', marginLeft:3 }} />
                  </div>
                  <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.8)', padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>
                    {t.duration}
                  </div>
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <p style={{ color:'white', fontWeight:700, fontSize:13, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{t.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal */}
      <TrailerVideoModal trailer={playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN MovieDetail
══════════════════════════════════════════════════════════════════════════════ */
export const MovieDetail: React.FC = () => {
  const {
    selectedMovie, movies, currentUser,
    toggleMovieLike, toggleMovieDislike, toggleMovieInterest,
    movieLikes, movieDislikes, movieInterests,
    openBookTickets,
  } = useApp();

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  if (!selectedMovie) return null;
  const movie = movies.find(m => m.id === selectedMovie.id) ?? selectedMovie;

  const likedBy      = movieLikes[movie.id]     ?? [];
  const dislikedBy   = movieDislikes[movie.id]  ?? [];
  const wantedBy     = movieInterests[movie.id] ?? [];
  const isLiked      = !!currentUser && likedBy.includes(currentUser.id);
  const isDisliked   = !!currentUser && dislikedBy.includes(currentUser.id);
  const isInterested = !!currentUser && wantedBy.includes(currentUser.id);

  const reviews   = movie.userRatings ?? [];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const totalReactions = likedBy.length + dislikedBy.length;
  const approvalPct    = totalReactions > 0 ? Math.round((likedBy.length / totalReactions) * 100) : null;
  const castMembers    = movie.castMembers ?? [];

  const genreColors: Record<string, string> = {
    Action: '#ff1450', Adventure: '#f97316', Comedy: '#f5c518', Drama: '#a78bfa',
    Horror: '#6366f1', 'Sci-Fi': '#00b4ff', Thriller: '#34d399', Romance: '#f472b6',
    Fantasy: '#c084fc', Animation: '#fbbf24', Crime: '#94a3b8', Biography: '#6ee7b7',
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent', fontFamily: "'Inter','Outfit',sans-serif" }}>

      {/* ── Cinematic Hero Banner ── */}
      <div ref={heroRef} className="relative overflow-hidden" style={{ height: 'min(70vh, 520px)' }}>
        {/* Backdrop */}
        <img src={movie.banner || movie.poster} alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.45) saturate(1.4) blur(0.5px)', transform: 'scale(1.04)', transition: 'opacity 0.8s', opacity: heroLoaded ? 1 : 0 }}
          onLoad={() => setHeroLoaded(true)}
          onError={e => { (e.currentTarget as HTMLImageElement).src = movie.poster; }} />
        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #030308 0%, rgba(3,3,8,0.6) 50%, rgba(3,3,8,0.2) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(3,3,8,0.85) 0%, transparent 55%)' }} />
        {/* Neon grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,180,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.03) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Scan line sweep */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,180,255,0.015) 3px,rgba(0,180,255,0.015) 4px)',
        }} />

        {/* Status badges */}
        <div className="absolute top-6 left-6 flex gap-2 flex-wrap z-10">
          {movie.isTrending && (
            <span className="flex items-center gap-1.5 text-black text-xs font-black px-3 py-1.5 rounded-full animate-pulse"
              style={{ background: 'linear-gradient(135deg,#f5c518,#ff8f00)', boxShadow: '0 4px 16px rgba(245,197,24,0.5)' }}>
              🔥 TRENDING
            </span>
          )}
          {movie.isNowShowing && (
            <span className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.4)', color: '#00e5a0' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> NOW SHOWING
            </span>
          )}
          {movie.isComingSoon && (
            <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}>
              📅 COMING SOON
            </span>
          )}
        </div>

        {/* Certificate badge */}
        <div className="absolute top-6 right-6 z-10">
          <div className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: 'linear-gradient(135deg,#f5c518,#ff8f00)', color: '#000', boxShadow: '0 4px 14px rgba(245,197,24,0.5)' }}>
            {movie.certificate}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 sm:-mt-44 relative pb-24">

        {/* ── Main Info Card ── */}
        <div className="flex flex-col sm:flex-row gap-8 mb-12">

          {/* 3D Poster */}
          <div className="flex-shrink-0 relative z-10">
            <div style={{
              width: 160, borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(0,180,255,0.2), 0 8px 24px rgba(0,0,0,0.6), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,180,255,0.1)',
              transform: 'perspective(800px) rotateY(-4deg) rotateX(1deg)',
              transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
            }}>
              <img src={movie.poster} alt={movie.title} className="w-full block" />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%,rgba(0,180,255,0.05) 100%)',
              }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 sm:pt-10 relative z-10">
            {/* Genre chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(movie.genre ?? []).map(g => (
                <span key={g} className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: `${genreColors[g] ?? '#00b4ff'}18`, color: genreColors[g] ?? '#00b4ff', border: `1px solid ${genreColors[g] ?? '#00b4ff'}35` }}>
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5" style={{
              background: 'linear-gradient(135deg,#ffffff 0%,#e0f0ff 50%,#00b4ff 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(0,180,255,0.3))',
            }}>
              {movie.title}
            </h1>

            {/* Rating row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* IMDb style rating */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{
                background: 'linear-gradient(135deg,rgba(245,197,24,0.12),rgba(245,197,24,0.06))',
                border: '1px solid rgba(245,197,24,0.25)',
                boxShadow: '0 4px 20px rgba(245,197,24,0.1)',
              }}>
                <span style={{ color: '#f5c518', fontSize: 18 }}>★</span>
                <div>
                  <div className="font-black text-lg leading-none" style={{ color: '#f5c518' }}>
                    {movie.rating}<span className="text-xs font-normal text-gray-400">/10</span>
                  </div>
                  <div className="text-gray-400 text-xs">{((movie.votes ?? 0)/1000).toFixed(0)}K votes</div>
                </div>
              </div>

              {avgRating && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{
                  background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)',
                }}>
                  <span style={{ color: '#00e5a0' }}>👥</span>
                  <div>
                    <div className="font-black text-lg leading-none" style={{ color: '#00e5a0' }}>
                      {avgRating}<span className="text-xs font-normal text-gray-400">/10</span>
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(0,229,160,0.7)' }}>{reviews.length} reviews</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ color: '#00b4ff' }}>⏱</span>
                <span className="text-white font-semibold text-sm">
                  {Math.floor((movie.duration ?? 0)/60)}h {(movie.duration ?? 0)%60}m
                </span>
              </div>
            </div>

            {/* Like / Dislike / Interest / Trailer row */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button onClick={() => toggleMovieLike(movie.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: isLiked ? 'linear-gradient(135deg,#f5c518,#ff8f00)' : 'rgba(245,197,24,0.08)',
                  border: `1px solid ${isLiked ? '#f5c518' : 'rgba(245,197,24,0.2)'}`,
                  color: isLiked ? '#000' : '#f5c518',
                  boxShadow: isLiked ? '0 4px 20px rgba(245,197,24,0.4)' : 'none',
                  transform: isLiked ? 'scale(1.05)' : 'scale(1)',
                }}>
                ❤️ {isLiked ? 'Liked' : 'Like'}
                {likedBy.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: isLiked ? 'rgba(0,0,0,0.2)' : 'rgba(245,197,24,0.15)' }}>{likedBy.length}</span>}
              </button>

              <button onClick={() => toggleMovieDislike(movie.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: isDisliked ? 'rgba(100,116,139,0.3)' : 'rgba(100,116,139,0.08)',
                  border: `1px solid ${isDisliked ? '#64748b' : 'rgba(100,116,139,0.2)'}`,
                  color: isDisliked ? '#e2e8f0' : '#64748b',
                  boxShadow: isDisliked ? '0 4px 16px rgba(100,116,139,0.3)' : 'none',
                }}>
                👎 {isDisliked ? 'Disliked' : 'Dislike'}
                {dislikedBy.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>{dislikedBy.length}</span>}
              </button>

              {movie.isComingSoon && (
                <button onClick={() => toggleMovieInterest(movie.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: isInterested ? 'linear-gradient(135deg,#00b4ff,#0070ff)' : 'rgba(0,180,255,0.08)',
                    border: `1px solid ${isInterested ? '#00b4ff' : 'rgba(0,180,255,0.2)'}`,
                    color: isInterested ? '#fff' : '#00b4ff',
                    boxShadow: isInterested ? '0 4px 20px rgba(0,180,255,0.4)' : 'none',
                  }}>
                  {isInterested ? '🔔 Interested!' : '🔔 Notify Me'}
                  {wantedBy.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>{wantedBy.length}</span>}
                </button>
              )}

              {(movie.trailerUrl || movie.trailerFile) && (
                <a href="#trailer-section"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.25)', color: '#00b4ff' }}>
                  ▶ Trailer
                </a>
              )}
            </div>

            {/* Description */}
            <p style={{ color:'rgba(255,255,255,0.65)', lineHeight:2, fontSize:15, letterSpacing:0.3, marginBottom:32, maxWidth:'60rem' }}>
              {movie.description}
            </p>

            {/* Meta grid */}
            <div className="grid sm:grid-cols-2 gap-4" style={{ marginBottom:40 }}>
              {[
                { label: 'Director', value: movie.director, icon: '🎬' },
                { label: 'Release', value: movie.releaseDate, icon: '📅' },
                { label: 'Languages', value: (movie.language ?? []).join(', '), icon: '🌐' },
                { label: 'Certificate', value: movie.certificate, icon: '🔖' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{row.icon}</span>
                  <span style={{ color:'rgba(255,255,255,0.45)', fontSize:14, flexShrink:0 }}>{row.label}:</span>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Community Reaction Bar ── */}
        {totalReactions > 0 && (
          <div className="mb-10 rounded-3xl p-6" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                Community Reaction
                <span className="text-xs text-gray-500 font-normal">({totalReactions} reactions)</span>
              </h3>
              <span className="text-sm font-black px-3 py-1 rounded-full"
                style={{
                  background: (approvalPct ?? 0) >= 70 ? 'rgba(0,229,160,0.15)' : (approvalPct ?? 0) >= 40 ? 'rgba(245,197,24,0.15)' : 'rgba(255,20,80,0.15)',
                  color: (approvalPct ?? 0) >= 70 ? '#00e5a0' : (approvalPct ?? 0) >= 40 ? '#f5c518' : '#ff1450',
                }}>
                {approvalPct}% positive
              </span>
            </div>
            <div className="h-8 flex rounded-xl overflow-hidden gap-1">
              {(approvalPct ?? 0) > 0 && (
                <div className="flex items-center justify-center rounded-l-xl transition-all duration-700 font-bold text-sm"
                  style={{ width: `${approvalPct}%`, background: 'linear-gradient(90deg,#f5c518,#ff8f00)', color: '#000', boxShadow: '0 0 20px rgba(245,197,24,0.3)' }}>
                  {(approvalPct ?? 0) > 15 && <>❤️ {likedBy.length}</>}
                </div>
              )}
              {100 - (approvalPct ?? 0) > 0 && (
                <div className="flex items-center justify-center rounded-r-xl transition-all duration-700 font-bold text-sm"
                  style={{ width: `${100-(approvalPct ?? 0)}%`, background: 'linear-gradient(90deg,#374151,#1f2937)', color: '#9ca3af' }}>
                  {100-(approvalPct ?? 0) > 15 && <>👎 {dislikedBy.length}</>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Premium Cast Section ── */}
        {castMembers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg,#f5c518,#00b4ff)', boxShadow: '0 0 12px rgba(245,197,24,0.6)' }} />
              <h2 className="text-2xl font-black text-white">Cast & Crew</h2>
              <div className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.25)', color: '#f5c518' }}>
                {castMembers.length} members
              </div>
            </div>

            {/* Horizontal scroll strip */}
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide" style={{ paddingTop:8 }}>
              {castMembers.map((cm, i) => <CastCard key={i} cm={cm} index={i} />)}
            </div>

            {/* Grid view on larger screens */}
            <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-8">
              {castMembers.map((cm, i) => (
                <CastGridCard key={i} cm={cm} />
              ))}
            </div>
          </div>
        )}

        {/* ── Trailer ── */}
        <TrailersSection movie={movie} openBookTickets={openBookTickets} toggleMovieLike={toggleMovieLike} isLiked={isLiked} />

        {/* ── User Reviews ── */}
        {reviews.length > 0 && (
          <div className="rounded-3xl p-6 sm:p-8 mb-12" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div style={{ width: 4, height: 28, borderRadius: 4, background: 'linear-gradient(180deg,#a78bfa,#00b4ff)', boxShadow: '0 0 12px rgba(167,139,250,0.5)' }} />
                <h2 className="text-xl font-black text-white">User Reviews</h2>
              </div>
              {avgRating && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.25)' }}>
                  <span style={{ color: '#f5c518' }}>★</span>
                  <span className="text-white font-black">{avgRating}</span>
                  <span className="text-gray-400 text-sm">/ 10</span>
                  <span className="text-gray-500 text-xs">({reviews.length})</span>
                </div>
              )}
            </div>

            {/* Rating bars */}
            <div className="mb-6 space-y-2">
              {[10, 8, 6, 4, 2].map(score => {
                const count = reviews.filter(r => Math.round(r.rating / 2) === Math.round(score / 2)).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={score} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-6 text-right" style={{ color: '#f5c518' }}>{score}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f5c518,#00b4ff)', boxShadow: '0 0 8px rgba(245,197,24,0.3)' }} />
                    </div>
                    <span className="text-gray-500 text-xs w-4">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Review cards */}
            <div className="space-y-3">
              {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl transition-all hover:border-white/10"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#00b4ff,#f5c518)', color: '#000' }}>
                    {(r.userName ?? 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-white font-bold text-sm">{r.userName ?? 'User'}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, si) => (
                          <div key={si} className="w-2 h-2 rounded-full"
                            style={{ background: si < r.rating ? '#f5c518' : 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <span className="font-black text-sm" style={{ color: '#f5c518' }}>{r.rating}/10</span>
                      <span className="text-gray-500 text-xs ml-auto">{r.date}</span>
                    </div>
                    {r.review && <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.review}</p>}
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <button onClick={() => setShowAllReviews(v => !v)}
                className="mt-5 text-sm font-bold transition-all hover:opacity-80"
                style={{ color: '#00b4ff' }}>
                {showAllReviews ? '↑ Show less' : `↓ Show all ${reviews.length} reviews`}
              </button>
            )}
          </div>
        )}

        {/* ══ THE ONE BOOK TICKET BUTTON ══ */}
        {movie.isNowShowing && (
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center" style={{
            background: 'linear-gradient(135deg,rgba(0,180,255,0.06) 0%,rgba(245,197,24,0.04) 50%,rgba(3,3,8,0.95) 100%)',
            border: '1px solid rgba(0,180,255,0.15)',
            boxShadow: '0 0 80px rgba(0,180,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Grid BG */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(0,180,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.03) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            {/* Gold glow orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{
              width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(245,197,24,0.08) 0%,rgba(0,180,255,0.06) 40%,transparent 70%)',
              filter: 'blur(40px)',
            }} />

            <div className="relative z-10">
              {/* Ticket emoji with glow */}
              <div className="text-6xl mb-5" style={{ filter: 'drop-shadow(0 0 24px rgba(245,197,24,0.8)) drop-shadow(0 0 48px rgba(0,180,255,0.4))' }}>🎟️</div>
              <h3 className="text-3xl sm:text-4xl font-black mb-3" style={{
                background: 'linear-gradient(135deg,#ffffff,#e0f0ff,#00b4ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Ready to Watch?
              </h3>
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Select language · Choose your theatre · Pick seats
              </p>

              {/* Language chips */}
              {(movie.language ?? []).length > 0 && (
                <div className="flex justify-center gap-2 mb-10 flex-wrap">
                  {movie.language.map(l => (
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', color: '#00b4ff' }}>
                      {l}
                    </span>
                  ))}
                </div>
              )}

              {/* THE SOLO PREMIUM BOOK TICKET BUTTON */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                    style={{ background: 'linear-gradient(135deg,rgba(245,197,24,0.4),rgba(0,180,255,0.4))', animationDuration: '2.5s' }} />
                  <div className="absolute -inset-2 rounded-3xl opacity-30 blur-xl"
                    style={{ background: 'linear-gradient(135deg,#f5c518,#00b4ff)', animationDuration: '3s' }} />
                  <button
                    onClick={() => openBookTickets(movie)}
                    className="relative flex items-center gap-5 font-black text-xl rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      padding: '20px 56px',
                      background: 'linear-gradient(135deg,#f5c518 0%,#ff8f00 50%,#f5c518 100%)',
                      color: '#030308',
                      boxShadow: '0 6px 0 rgba(120,70,0,0.8), 0 12px 40px rgba(245,197,24,0.5), 0 0 80px rgba(245,197,24,0.2)',
                      backgroundSize: '200% 100%',
                    }}
                  >
                    {/* Shine sweep */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)',
                      animation: 'btnShine 2.5s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: 28 }}>🎬</span>
                    <div style={{ textAlign: 'left', position: 'relative', zIndex: 1 }}>
                      <div style={{ fontWeight: 900, letterSpacing: '-0.5px', fontSize: '1.2rem' }}>Book Tickets Now</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(30,15,0,0.75)', marginTop: 3 }}>
                        Instant confirmation · No wait
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon CTA */}
        {movie.isComingSoon && (
          <div className="text-center py-16 rounded-3xl" style={{
            background: 'linear-gradient(135deg,rgba(0,180,255,0.06),rgba(245,197,24,0.04))',
            border: '1px solid rgba(0,180,255,0.15)',
          }}>
            <div className="text-6xl mb-5">📅</div>
            <h3 className="text-3xl font-black mb-3" style={{ color: '#00b4ff' }}>Coming Soon!</h3>
            <p className="mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Releasing on {movie.releaseDate}</p>
            <p className="text-sm mb-8" style={{ color: 'rgba(0,180,255,0.6)' }}>{wantedBy.length} people interested</p>
            <button onClick={() => toggleMovieInterest(movie.id)}
              className="px-10 py-4 rounded-2xl font-black text-white transition-all hover:scale-105"
              style={{
                background: isInterested ? 'linear-gradient(135deg,#00b4ff,#0070ff)' : 'linear-gradient(135deg,#f5c518,#ff8f00)',
                color: isInterested ? '#fff' : '#000',
                boxShadow: isInterested ? '0 8px 32px rgba(0,180,255,0.4)' : '0 8px 32px rgba(245,197,24,0.4)',
              }}>
              {isInterested ? "🔔 You're Interested!" : '🔔 Notify Me'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Cast Grid Card ── */
const CastGridCard: React.FC<{ cm: CastMember }> = ({ cm }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      <div className="w-full aspect-square overflow-hidden">
        {cm.image && !failed ? (
          <img src={cm.image} alt={cm.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setFailed(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-black text-4xl"
            style={{ background: 'linear-gradient(135deg,rgba(0,180,255,0.15),rgba(245,197,24,0.1))', color: '#00b4ff' }}>
            {(cm.name ?? '?')[0]}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-white text-xs font-bold truncate">{cm.name}</p>
        {cm.role && <p className="text-xs truncate mt-0.5" style={{ color: '#f5c518', opacity: 0.8 }}>{cm.role}</p>}
      </div>
    </div>
  );
};
