import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Movie } from '../data/store';
import MovieClickAnimation from '../components/booking/MovieClickAnimation';

const GENRES = ['Action','Drama','Comedy','Horror','Sci-Fi','Thriller','Animation','Crime'];
const LANGUAGES = ['Hindi','English','Telugu','Tamil','Kannada','Malayalam'];
const FORMATS = ['IMAX','4DX','Dolby','3D','2D'];

/* ── Unique neon color per genre ── */
const GENRE_NEON: Record<string,{bg:string,glow:string,text:string}> = {
  Action:    { bg:'linear-gradient(135deg,#ff0040,#ff4080)', glow:'rgba(255,0,64,0.5)',   text:'#ff4080' },
  Drama:     { bg:'linear-gradient(135deg,#7c3aed,#a855f7)', glow:'rgba(168,85,247,0.5)', text:'#c084fc' },
  Comedy:    { bg:'linear-gradient(135deg,#d97706,#fbbf24)', glow:'rgba(251,191,36,0.5)', text:'#fbbf24' },
  Horror:    { bg:'linear-gradient(135deg,#1e1b4b,#4c1d95)', glow:'rgba(76,29,149,0.5)',  text:'#a78bfa' },
  'Sci-Fi':  { bg:'linear-gradient(135deg,#0891b2,#06b6d4)', glow:'rgba(6,182,212,0.5)',  text:'#22d3ee' },
  Thriller:  { bg:'linear-gradient(135deg,#be123c,#f43f5e)', glow:'rgba(244,63,94,0.5)',  text:'#fb7185' },
  Animation: { bg:'linear-gradient(135deg,#059669,#10b981)', glow:'rgba(16,185,129,0.5)', text:'#34d399' },
  Crime:     { bg:'linear-gradient(135deg,#9a3412,#ea580c)', glow:'rgba(234,88,12,0.5)',  text:'#fb923c' },
};

const LANG_NEON: Record<string,string> = {
  Hindi:'#ff6b35', English:'#00d4ff', Telugu:'#b565ff',
  Tamil:'#ff3d5e', Kannada:'#ffd700', Malayalam:'#00e5a0',
};

/* ── Floating neon orbs bg ── */
const MoviesBackground: React.FC = () => (
  <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
    {/* Deep void */}
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, #0d0020 0%, #050010 50%, #000008 100%)' }} />
    {/* Neon orbs */}
    {[
      { x:'8%',  y:'15%', size:500, color:'rgba(120,40,255,0.07)', anim:'orbFloat1 18s ease-in-out infinite' },
      { x:'80%', y:'10%', size:400, color:'rgba(255,20,80,0.06)',  anim:'orbFloat2 22s ease-in-out infinite' },
      { x:'60%', y:'60%', size:600, color:'rgba(0,180,255,0.05)', anim:'orbFloat3 26s ease-in-out infinite' },
      { x:'15%', y:'70%', size:350, color:'rgba(0,200,120,0.05)', anim:'orbFloat1 20s ease-in-out infinite reverse' },
    ].map((o,i) => (
      <div key={i} style={{
        position:'absolute', left:o.x, top:o.y,
        width:o.size, height:o.size, borderRadius:'50%',
        background:`radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
        animation:o.anim, transform:'translate(-50%,-50%)',
      }} />
    ))}
    {/* Neon grid lines */}
    <div style={{
      position:'absolute', inset:0,
      backgroundImage:`
        linear-gradient(rgba(120,40,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(120,40,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize:'80px 80px',
    }} />
    {/* Top glow bar */}
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:2,
      background:'linear-gradient(90deg, transparent, #7828ff, #ff1450, #00d4ff, #7828ff, transparent)',
      boxShadow:'0 0 20px rgba(120,40,255,0.6)',
    }} />
  </div>
);

/* ── Neon Tab Button ── */
const NeonTab: React.FC<{
  label:string; count:number; active:boolean;
  color:string; glow:string; icon:React.ReactNode; onClick:()=>void;
}> = ({ label, count, active, color, glow, icon, onClick }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:8,
    padding:'11px 22px', borderRadius:16, cursor:'pointer',
    fontWeight:800, fontSize:13, transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    fontFamily:'inherit', position:'relative', overflow:'hidden',
    background: active
      ? `linear-gradient(135deg, ${color}25, ${color}10)`
      : 'rgba(255,255,255,0.03)',
    border: active ? `1.5px solid ${color}60` : '1.5px solid rgba(255,255,255,0.06)',
    color: active ? '#fff' : 'rgba(255,255,255,0.35)',
    boxShadow: active ? `0 0 24px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
    transform: active ? 'translateY(-2px)' : 'none',
  }}>
    {active && <div style={{
      position:'absolute', inset:0,
      background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
      pointerEvents:'none',
    }} />}
    <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>
    <span>{label}</span>
    <span style={{
      background: active ? color : 'rgba(255,255,255,0.08)',
      color: active ? '#000' : 'rgba(255,255,255,0.3)',
      borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:900,
      boxShadow: active ? `0 2px 8px ${glow}` : 'none',
    }}>{count}</span>
  </button>
);

/* ── Genre Pill ── */
const GenrePill: React.FC<{g:string; active:boolean; onClick:()=>void}> = ({g,active,onClick}) => {
  const [hov,setHov] = useState(false);
  const n = GENRE_NEON[g] || { bg:'linear-gradient(135deg,#6366f1,#8b5cf6)', glow:'rgba(99,102,241,0.5)', text:'#a5b4fc' };
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        padding:'8px 18px', borderRadius:24, border:'none', cursor:'pointer',
        fontSize:12, fontWeight:800, transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily:'inherit', position:'relative', overflow:'hidden',
        background: active ? n.bg : (hov ? `${n.text}15` : 'rgba(255,255,255,0.04)'),
        color: active ? '#fff' : (hov ? n.text : 'rgba(255,255,255,0.40)'),
        boxShadow: active ? `0 4px 20px ${n.glow}, 0 0 0 1px ${n.text}40` : (hov ? `0 4px 12px ${n.glow}40` : 'none'),
        transform: (active||hov) ? 'translateY(-2px) scale(1.04)' : 'none',
        letterSpacing:0.3,
      }}
    >
      {active && <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)',
        pointerEvents:'none',
      }}/>}
      {g}
    </button>
  );
};

/* ── Animated number counter ── */
const Counter: React.FC<{value:number}> = ({value}) => {
  const [display,setDisplay] = useState(0);
  useEffect(()=>{
    let start = 0; const step = Math.ceil(value/30);
    const t = setInterval(()=>{ start=Math.min(start+step,value); setDisplay(start); if(start>=value) clearInterval(t); },30);
    return ()=>clearInterval(t);
  },[value]);
  return <>{display}</>;
};

/* ── Main Movie Card (Ultra-premium design) ── */
const UltraMovieCard: React.FC<{movie:Movie; rank:number; onClick:()=>void}> = ({movie,rank,onClick}) => {
  const [hov,setHov] = useState(false);
  const [imgErr,setImgErr] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos,setMousePos] = useState({x:0.5,y:0.5});

  const avgRating = movie.userRatings?.length
    ? (movie.userRatings.reduce((s,r)=>s+r.rating,0)/movie.userRatings.length).toFixed(1)
    : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if(!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX-rect.left)/rect.width,
      y: (e.clientY-rect.top)/rect.height,
    });
  };

  const rotX = hov ? (mousePos.y-0.5)*-14 : 0;
  const rotY = hov ? (mousePos.x-0.5)*14 : 0;

  const rankColors = ['#ffd700','#c0c0c0','#cd7f32'];

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false); setMousePos({x:0.5,y:0.5});}}
      onMouseMove={handleMouseMove}
      style={{
        cursor:'pointer', borderRadius:24, overflow:'hidden', position:'relative',
        background:'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border:`1px solid ${hov ? 'rgba(120,40,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
        transition:'box-shadow 0.4s ease, border-color 0.4s ease',
        transform:`perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${hov?'translateY(-12px) scale(1.03)':'translateY(0) scale(1)'}`,
        transitionProperty:'transform,box-shadow,border-color',
        transitionDuration:'0.35s',
        transitionTimingFunction:'cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hov
          ? '0 30px 70px rgba(0,0,0,0.7), 0 0 40px rgba(120,40,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Poster */}
      <div style={{ position:'relative', aspectRatio:'2/3', overflow:'hidden', background:'#0a0015' }}>
        {!imgErr ? (
          <img
            src={movie.poster} alt={movie.title}
            onError={()=>setImgErr(true)}
            style={{
              width:'100%', height:'100%', objectFit:'cover',
              transition:'transform 0.6s ease',
              transform: hov ? 'scale(1.10)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width:'100%', height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'linear-gradient(135deg,#1a0030,#0a0020)',
          }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎬</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{movie.title}</div>
          </div>
        )}

        {/* Deep gradient overlay */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(5,0,15,0.98) 0%, rgba(5,0,15,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)',
        }}/>

        {/* Holographic shimmer on hover */}
        {hov && (
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:`radial-gradient(circle at ${mousePos.x*100}% ${mousePos.y*100}%, rgba(180,120,255,0.12) 0%, rgba(255,80,120,0.06) 40%, transparent 70%)`,
          }}/>
        )}

        {/* Neon scan line on hover */}
        {hov && (
          <div style={{
            position:'absolute', left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(120,40,255,0.8),rgba(255,20,80,0.8),transparent)',
            boxShadow:'0 0 10px rgba(120,40,255,0.6)',
            animation:'scanDown 1.5s linear infinite',
            pointerEvents:'none',
          }}/>
        )}

        {/* Rank badge */}
        {rank <= 3 && (
          <div style={{
            position:'absolute', top:12, left:12,
            width:32, height:32, borderRadius:10,
            background:`linear-gradient(135deg,${rankColors[rank-1]},${rankColors[rank-1]}99)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:900, color:'#000',
            boxShadow:`0 4px 12px ${rankColors[rank-1]}60`,
          }}>#{rank}</div>
        )}

        {/* Rating badge */}
        <div style={{
          position:'absolute', top:12, right:12,
          background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)',
          borderRadius:12, padding:'5px 10px',
          border:'1px solid rgba(255,215,0,0.3)',
          display:'flex', alignItems:'center', gap:4,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{ color:'#fbbf24', fontSize:11, fontWeight:900 }}>{movie.rating}</span>
        </div>

        {/* User rating */}
        {avgRating && (
          <div style={{
            position:'absolute', top:44, right:12,
            background:'rgba(16,185,129,0.85)', backdropFilter:'blur(8px)',
            borderRadius:10, padding:'3px 8px',
          }}>
            <span style={{ color:'#fff', fontSize:10, fontWeight:800 }}>👥 {avgRating}</span>
          </div>
        )}

        {/* Status badge */}
        {movie.isTrending && (
          <div style={{
            position:'absolute', top:0, left:0,
            background:'linear-gradient(135deg,#ff0040,#ff6b35)',
            color:'#fff', fontSize:9, fontWeight:900, padding:'6px 12px',
            borderRadius:'0 0 14px 0', letterSpacing:0.8,
            boxShadow:'0 4px 12px rgba(255,0,64,0.4)',
          }}>🔥 TRENDING</div>
        )}
        {movie.isComingSoon && !movie.isNowShowing && (
          <div style={{
            position:'absolute', top:0, left:0,
            background:'linear-gradient(135deg,#7c3aed,#06b6d4)',
            color:'#fff', fontSize:9, fontWeight:900, padding:'6px 12px',
            borderRadius:'0 0 14px 0', letterSpacing:0.8,
          }}>⏳ SOON</div>
        )}

        {/* Bottom: genre + book button */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:12 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
            {movie.genre.slice(0,2).map(g=>{
              const n = GENRE_NEON[g];
              return n ? (
                <span key={g} style={{
                  fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:8,
                  background:`${n.text}20`, color:n.text,
                  border:`1px solid ${n.text}35`, backdropFilter:'blur(8px)',
                  letterSpacing:0.3,
                }}>{g}</span>
              ) : null;
            })}
          </div>

          {/* Book Now button */}
          <div style={{
            opacity: hov ? 1 : 0,
            transform: hov ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
            transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              background:'linear-gradient(135deg,#7828ff,#ff1450)',
              color:'#fff', fontSize:12, fontWeight:900,
              padding:'10px', borderRadius:14, textAlign:'center',
              boxShadow:'0 6px 20px rgba(120,40,255,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              letterSpacing:0.5, position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', top:0, left:'-100%', right:'-100%', height:'50%',
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)',
                animation:'shineMove 2s linear infinite',
              }}/>
              🎬 Book Tickets
            </div>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div style={{ padding:'14px 16px 16px', background:'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(0,0,0,0.2))' }}>
        <h3 style={{
          color: hov ? '#c084fc' : '#f1f5f9',
          fontSize:13, fontWeight:900, marginBottom:6,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          transition:'color 0.3s',
          textShadow: hov ? '0 0 12px rgba(192,132,252,0.5)' : 'none',
        }}>{movie.title}</h3>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>
            {Math.floor(movie.duration/60)}h {movie.duration%60}m
          </span>
          <div style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }}/>
          <span style={{
            background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.4)',
            fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:6,
          }}>{movie.certificate}</span>
        </div>

        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {movie.language.slice(0,3).map(l=>(
            <span key={l} style={{
              fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:6,
              background:`${LANG_NEON[l]||'#7828ff'}15`,
              color: LANG_NEON[l]||'#c084fc',
              border:`1px solid ${LANG_NEON[l]||'#7828ff'}30`,
            }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Coming Soon card (horizontal) ── */
const ComingSoonCard: React.FC<{movie:Movie; onClick:()=>void}> = ({movie,onClick}) => {
  const [hov,setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        display:'flex', gap:16, padding:16, borderRadius:20, cursor:'pointer',
        background: hov ? 'rgba(120,40,255,0.08)' : 'rgba(255,255,255,0.03)',
        border:`1px solid ${hov ? 'rgba(120,40,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
        transition:'all 0.3s ease',
        boxShadow: hov ? '0 8px 32px rgba(120,40,255,0.15)' : 'none',
        transform: hov ? 'translateX(4px)' : 'none',
      }}
    >
      <div style={{ position:'relative', width:70, height:100, borderRadius:14, overflow:'hidden', flexShrink:0 }}>
        <img src={movie.poster} alt={movie.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s', transform:hov?'scale(1.1)':'scale(1)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.6),transparent)' }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#7828ff', boxShadow:'0 0 8px rgba(120,40,255,0.8)', animation:'pulse 2s infinite' }}/>
          <span style={{ color:'#c084fc', fontSize:10, fontWeight:800, letterSpacing:1 }}>COMING SOON</span>
        </div>
        <h4 style={{ color:'#f1f5f9', fontSize:14, fontWeight:900, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{movie.title}</h4>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
          {movie.genre.slice(0,2).map(g=>{
            const n=GENRE_NEON[g];
            return n ? <span key={g} style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:6, background:`${n.text}20`, color:n.text, border:`1px solid ${n.text}30` }}>{g}</span> : null;
          })}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{movie.releaseDate}</span>
          <div style={{ flex:1 }}/>
          <div style={{
            background:'linear-gradient(135deg,#7828ff,#ff1450)',
            color:'#fff', fontSize:10, fontWeight:800,
            padding:'5px 12px', borderRadius:10,
            opacity: hov ? 1 : 0.7,
            transition:'opacity 0.3s',
          }}>Notify Me</div>
        </div>
      </div>
    </div>
  );
};

export const Movies: React.FC = () => {
  const { movies, selectMovie, filterGenre, filterLanguage, setFilterGenre, setFilterLanguage } = useApp();
  const [tab, setTab] = useState<'now'|'coming'|'all'>('now');
  const [localFormat, setLocalFormat] = useState('');
  const [sortBy, setSortBy] = useState<'rating'|'votes'|'release'>('rating');
  const [animMovie, setAnimMovie] = useState<Movie|null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');

  let filtered = movies.filter(m=>{
    if(tab==='now') return m.isNowShowing;
    if(tab==='coming') return m.isComingSoon;
    return true;
  });
  if(filterGenre) filtered = filtered.filter(m=>m.genre.includes(filterGenre));
  if(filterLanguage) filtered = filtered.filter(m=>m.language.includes(filterLanguage));
  if(localFormat) filtered = filtered.filter(m=>(m as Movie & {format?:string[]}).format?.includes(localFormat));
  if(searchQ) filtered = filtered.filter(m=>m.title.toLowerCase().includes(searchQ.toLowerCase()));
  filtered = [...filtered].sort((a,b)=>{
    if(sortBy==='rating') return b.rating-a.rating;
    if(sortBy==='votes') return b.votes-a.votes;
    return new Date(b.releaseDate).getTime()-new Date(a.releaseDate).getTime();
  });

  const clearFilters = ()=>{ setFilterGenre(''); setFilterLanguage(''); setLocalFormat(''); setSearchQ(''); };
  const hasFilters = filterGenre||filterLanguage||localFormat||searchQ;

  return (
    <>
      <style>{`
        @keyframes scanDown { 0%{top:0%} 100%{top:100%} }
        @keyframes neonPulse { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(120,40,255,0.8)} 50%{opacity:0.6;box-shadow:0 0 20px rgba(120,40,255,0.4)} }
        @keyframes shineMove { 0%{left:-100%} 100%{left:100%} }
        @keyframes cardEntrance { from{opacity:0;transform:translateY(30px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes headerGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(-50%,-50%) translateY(0px)} 50%{transform:translate(-50%,-50%) translateY(-30px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(-50%,-50%) translateY(0px)} 50%{transform:translate(-50%,-50%) translateY(20px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(-50%,-50%) translateX(0px)} 50%{transform:translate(-50%,-50%) translateX(-25px)} }
      `}</style>

      {animMovie && (
        <MovieClickAnimation
          active={!!animMovie}
          posterSrc={animMovie.poster}
          title={animMovie.title}
          onComplete={()=>{ const m=animMovie; setAnimMovie(null); selectMovie(m); }}
        />
      )}

      <MoviesBackground />

      <div style={{ minHeight:'100vh', paddingBottom:80, position:'relative', zIndex:1 }}>

        {/* ══ HERO HEADER ══ */}
        <div style={{
          position:'relative', overflow:'hidden',
          padding:'56px 0 40px',
          borderBottom:'1px solid rgba(120,40,255,0.15)',
          marginBottom:36,
        }}>
          {/* Header glow */}
          <div style={{
            position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)',
            width:800, height:300,
            background:'radial-gradient(ellipse, rgba(120,40,255,0.12) 0%, rgba(255,20,80,0.06) 40%, transparent 70%)',
            pointerEvents:'none', animation:'headerGlow 4s ease-in-out infinite',
          }}/>

          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20, marginBottom:32 }}>
              <div>
                {/* Super title */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ height:2, width:24, background:'linear-gradient(90deg,#7828ff,#ff1450)', borderRadius:2 }}/>
                  <span style={{ color:'#c084fc', fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase' }}>CineConnect</span>
                </div>

                <h1 style={{
                  fontSize:48, fontWeight:900, margin:0, lineHeight:1,
                  background:'linear-gradient(135deg,#ffffff 0%,#c084fc 40%,#ff1450 80%,#fbbf24 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                  letterSpacing:'-1px',
                }}>
                  Movies
                </h1>

                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, margin:'8px 0 0', fontWeight:500 }}>
                  <Counter value={filtered.length} /> titles • <Counter value={movies.filter(m=>m.isNowShowing).length} /> now showing • <Counter value={movies.filter(m=>m.isComingSoon).length} /> coming soon
                </p>
              </div>

              {/* Controls */}
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                {/* Search */}
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    value={searchQ}
                    onChange={e=>setSearchQ(e.target.value)}
                    placeholder="Search movies…"
                    style={{
                      background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(120,40,255,0.2)',
                      borderRadius:14, padding:'10px 14px 10px 34px', color:'#f1f5f9',
                      fontSize:13, outline:'none', fontFamily:'inherit', width:200,
                      transition:'all 0.3s',
                    }}
                    onFocus={e=>{ e.target.style.borderColor='rgba(120,40,255,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(120,40,255,0.12)'; }}
                    onBlur={e=>{ e.target.style.borderColor='rgba(120,40,255,0.2)'; e.target.style.boxShadow='none'; }}
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e=>setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    background:'rgba(255,255,255,0.05)', color:'#f1f5f9',
                    borderRadius:14, padding:'10px 14px', fontSize:13,
                    border:'1.5px solid rgba(120,40,255,0.2)', outline:'none',
                    cursor:'pointer', fontFamily:'inherit', fontWeight:700,
                  }}
                >
                  <option value="rating">⭐ Top Rated</option>
                  <option value="votes">🔥 Most Voted</option>
                  <option value="release">🆕 Latest</option>
                </select>

                {/* View toggle */}
                <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:3, border:'1px solid rgba(255,255,255,0.08)' }}>
                  {(['grid','list'] as const).map(v=>(
                    <button key={v} onClick={()=>setViewMode(v)} style={{
                      padding:'7px 12px', borderRadius:10, border:'none', cursor:'pointer',
                      fontFamily:'inherit', transition:'all 0.2s',
                      background: viewMode===v ? 'linear-gradient(135deg,#7828ff,#ff1450)' : 'transparent',
                      color: viewMode===v ? '#fff' : 'rgba(255,255,255,0.35)',
                      boxShadow: viewMode===v ? '0 2px 12px rgba(120,40,255,0.4)' : 'none',
                    }}>
                      {v==='grid'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      }
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <NeonTab key="now" label="Now Showing" count={movies.filter(m=>m.isNowShowing).length} active={tab==='now'} color="#00e5a0" glow="rgba(0,229,160,0.4)"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>}
                onClick={()=>setTab('now')}
              />
              <NeonTab key="coming" label="Coming Soon" count={movies.filter(m=>m.isComingSoon).length} active={tab==='coming'} color="#00d4ff" glow="rgba(0,212,255,0.4)"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                onClick={()=>setTab('coming')}
              />
              <NeonTab key="all" label="All Movies" count={movies.length} active={tab==='all'} color="#c084fc" glow="rgba(192,132,252,0.4)"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="2.5"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>}
                onClick={()=>setTab('all')}
              />
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>

          {/* ══ FILTER PANEL ══ */}
          <div style={{
            background:'linear-gradient(135deg,rgba(120,40,255,0.06),rgba(255,20,80,0.04))',
            border:'1px solid rgba(120,40,255,0.15)',
            borderRadius:24, padding:'22px 26px', marginBottom:32,
            backdropFilter:'blur(24px)',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
            position:'relative', overflow:'hidden',
          }}>
            {/* Corner glow */}
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(120,40,255,0.08) 0%,transparent 70%)', pointerEvents:'none' }}/>

            {/* Genre */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:3, height:14, borderRadius:2, background:'linear-gradient(to bottom,#7828ff,#ff1450)' }}/>
                <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>Genre</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {GENRES.map(g=>(
                  <GenrePill key={g} g={g} active={filterGenre===g} onClick={()=>setFilterGenre(filterGenre===g?'':g)} />
                ))}
              </div>
            </div>

            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(120,40,255,0.2),rgba(255,20,80,0.15),transparent)', margin:'18px 0' }}/>

            {/* Language + Format */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:28 }}>
              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:3, height:14, borderRadius:2, background:'linear-gradient(to bottom,#00d4ff,#7828ff)' }}/>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>Language</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {LANGUAGES.map(l=>{
                    const c=LANG_NEON[l]||'#7828ff';
                    const active=filterLanguage===l;
                    return (
                      <button key={l} onClick={()=>setFilterLanguage(active?'':l)} style={{
                        padding:'7px 15px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                        fontSize:12, fontWeight:800, transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                        border:`1.5px solid ${active ? c : c+'30'}`,
                        background: active ? `${c}22` : 'rgba(255,255,255,0.03)',
                        color: active ? c : 'rgba(255,255,255,0.35)',
                        boxShadow: active ? `0 0 16px ${c}40, 0 0 0 1px ${c}20` : 'none',
                        transform: active ? 'translateY(-2px)' : 'none',
                        textShadow: active ? `0 0 8px ${c}60` : 'none',
                      }}>{l}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:3, height:14, borderRadius:2, background:'linear-gradient(to bottom,#ff1450,#fbbf24)' }}/>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>Format</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {FORMATS.map(f=>{
                    const active=localFormat===f;
                    const colors: Record<string,string> = { IMAX:'#00d4ff', '4DX':'#c084fc', Dolby:'#00e5a0', '3D':'#fbbf24', '2D':'rgba(255,255,255,0.5)' };
                    const c = colors[f]||'#7828ff';
                    return (
                      <button key={f} onClick={()=>setLocalFormat(active?'':f)} style={{
                        padding:'7px 15px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                        fontSize:12, fontWeight:800, transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                        border:`1.5px solid ${active ? c : c+'30'}`,
                        background: active ? `${c}22` : 'rgba(255,255,255,0.03)',
                        color: active ? c : 'rgba(255,255,255,0.35)',
                        boxShadow: active ? `0 0 16px ${c}40` : 'none',
                        transform: active ? 'translateY(-2px)' : 'none',
                        textShadow: active ? `0 0 8px ${c}60` : 'none',
                      }}>{f}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active filter pills */}
            {hasFilters && (
              <div style={{ marginTop:18, display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                <span style={{ color:'rgba(255,255,255,0.25)', fontSize:11, fontWeight:700 }}>ACTIVE:</span>
                {[
                  filterGenre && { label:filterGenre, color:GENRE_NEON[filterGenre]?.text||'#c084fc', onRemove:()=>setFilterGenre('') },
                  filterLanguage && { label:filterLanguage, color:LANG_NEON[filterLanguage]||'#00d4ff', onRemove:()=>setFilterLanguage('') },
                  localFormat && { label:localFormat, color:'#fbbf24', onRemove:()=>setLocalFormat('') },
                  searchQ && { label:`"${searchQ}"`, color:'#00e5a0', onRemove:()=>setSearchQ('') },
                ].filter(Boolean).map((f,i)=>{
                  const pill = f as {label:string;color:string;onRemove:()=>void};
                  return (
                    <span key={i} style={{
                      background:`${pill.color}18`, border:`1px solid ${pill.color}40`,
                      color:pill.color, borderRadius:20, padding:'4px 12px',
                      fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:6,
                      boxShadow:`0 0 8px ${pill.color}25`,
                    }}>
                      {pill.label}
                      <span onClick={pill.onRemove} style={{ cursor:'pointer', opacity:0.7, fontWeight:900 }}>×</span>
                    </span>
                  );
                })}
                <button onClick={clearFilters} style={{
                  marginLeft:'auto', background:'rgba(255,20,80,0.12)',
                  border:'1px solid rgba(255,20,80,0.3)', color:'#ff6b8a',
                  borderRadius:20, padding:'4px 14px', fontSize:11, fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit',
                  transition:'all 0.2s',
                }}>Clear All ×</button>
              </div>
            )}
          </div>

          {/* ══ RESULTS ══ */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 24px' }}>
              <div style={{
                width:100, height:100, borderRadius:'50%', margin:'0 auto 24px',
                background:'radial-gradient(circle,rgba(120,40,255,0.15) 0%,transparent 70%)',
                border:'1px solid rgba(120,40,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:44,
                boxShadow:'0 0 40px rgba(120,40,255,0.2)',
              }}>🎬</div>
              <h3 style={{
                fontSize:26, fontWeight:900, marginBottom:8,
                background:'linear-gradient(135deg,#c084fc,#ff1450)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>No movies found</h3>
              <p style={{ color:'rgba(255,255,255,0.35)', marginBottom:24, fontSize:14 }}>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} style={{
                background:'linear-gradient(135deg,#7828ff,#ff1450)',
                color:'#fff', border:'none', borderRadius:16, padding:'13px 32px',
                fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit',
                boxShadow:'0 8px 28px rgba(120,40,255,0.4)',
                transition:'all 0.2s',
              }}>Clear All Filters</button>
            </div>
          ) : tab==='coming' ? (
            /* Coming soon — horizontal list layout */
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#00d4ff,#7828ff)', boxShadow:'0 0 8px rgba(0,212,255,0.5)' }}/>
                <h2 style={{ fontSize:20, fontWeight:900, color:'#f1f5f9', margin:0 }}>Coming Soon</h2>
                <span style={{ background:'rgba(0,212,255,0.12)', border:'1px solid rgba(0,212,255,0.3)', color:'#00d4ff', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:800 }}>{filtered.length} upcoming</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                {filtered.map(m=>(
                  <ComingSoonCard key={m.id} movie={m} onClick={()=>setAnimMovie(m)} />
                ))}
              </div>
            </div>
          ) : (
            /* Now showing / all — grid */
            <div>
              {/* Results header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#7828ff,#ff1450)', boxShadow:'0 0 8px rgba(120,40,255,0.5)' }}/>
                  <h2 style={{ fontSize:20, fontWeight:900, color:'#f1f5f9', margin:0 }}>
                    {tab==='now' ? 'Now Showing' : 'All Movies'}
                  </h2>
                  <span style={{
                    background:'rgba(120,40,255,0.12)', border:'1px solid rgba(120,40,255,0.3)',
                    color:'#c084fc', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:800,
                  }}>{filtered.length} titles</span>
                </div>
              </div>

              <div style={{
                display:'grid',
                gridTemplateColumns: viewMode==='grid'
                  ? 'repeat(auto-fill,minmax(190px,1fr))'
                  : '1fr',
                gap: viewMode==='grid' ? 22 : 14,
              }}>
                {filtered.map((m,i)=>
                  viewMode==='grid' ? (
                    <div key={m.id} style={{ animation:`cardEntrance 0.5s ease ${i*0.05}s both` }}>
                      <UltraMovieCard movie={m} rank={i+1} onClick={()=>setAnimMovie(m)} />
                    </div>
                  ) : (
                    <div key={m.id}
                      onClick={()=>setAnimMovie(m)}
                      style={{
                        display:'flex', gap:16, padding:16, borderRadius:20, cursor:'pointer',
                        background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(120,40,255,0.12)',
                        transition:'all 0.3s ease',
                        animation:`cardEntrance 0.4s ease ${i*0.03}s both`,
                      }}
                      onMouseEnter={e=>{
                        (e.currentTarget as HTMLDivElement).style.background='rgba(120,40,255,0.08)';
                        (e.currentTarget as HTMLDivElement).style.borderColor='rgba(120,40,255,0.35)';
                        (e.currentTarget as HTMLDivElement).style.transform='translateX(6px)';
                      }}
                      onMouseLeave={e=>{
                        (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLDivElement).style.borderColor='rgba(120,40,255,0.12)';
                        (e.currentTarget as HTMLDivElement).style.transform='none';
                      }}
                    >
                      <img src={m.poster} alt={m.title} style={{ width:70, height:100, objectFit:'cover', borderRadius:12, flexShrink:0 }} onError={e=>(e.currentTarget.style.display='none')} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                          <h3 style={{ color:'#f1f5f9', fontSize:15, fontWeight:900, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.title}</h3>
                          <span style={{ background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)', color:'#fbbf24', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:800, flexShrink:0 }}>★ {m.rating}</span>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                          {m.genre.slice(0,3).map(g=>{
                            const n=GENRE_NEON[g];
                            return n ? <span key={g} style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:8, background:`${n.text}20`, color:n.text, border:`1px solid ${n.text}30` }}>{g}</span> : null;
                          })}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:12, color:'rgba(255,255,255,0.35)', fontSize:12 }}>
                          <span>{Math.floor(m.duration/60)}h {m.duration%60}m</span>
                          <span>•</span>
                          <span>{m.certificate}</span>
                          <span>•</span>
                          <span>{m.language.slice(0,2).join(', ')}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', paddingLeft:8 }}>
                        <div style={{
                          background:'linear-gradient(135deg,#7828ff,#ff1450)',
                          color:'#fff', fontSize:12, fontWeight:800,
                          padding:'10px 18px', borderRadius:12,
                          boxShadow:'0 4px 16px rgba(120,40,255,0.4)',
                        }}>Book →</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
