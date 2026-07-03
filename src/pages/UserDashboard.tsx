import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, Movie } from '../data/store';
import { SmartSearch } from '../components/SmartSearch';
import { apiUploadAvatar, apiUpdatePrivacy, apiGetUnreadCount, apiGetFollowers, apiGetFollowing, apiGetFollowRequests, apiAcceptFollowRequest, apiRejectFollowRequest, apiUnfollowUser, apiGetTheatreSeatView, SocialUserProfile } from '../services/apiService';
import { MessagingHub } from '../components/social/MessagingHub';
import { UserProfileModal } from '../components/social/UserProfileModal';

/* ── Keyframes injected once ─────────────────────────────────────────────── */
const STYLES = `
@keyframes ud-float    { 0%,100%{transform:translateY(0px) rotate(0deg)} 33%{transform:translateY(-14px) rotate(1.5deg)} 66%{transform:translateY(-6px) rotate(-1deg)} }
@keyframes ud-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes ud-spinr    { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
@keyframes ud-pulse    { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
@keyframes ud-shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes ud-rise     { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes ud-pop      { 0%{transform:scale(.8);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
@keyframes ud-bar      { from{width:0} to{width:var(--w)} }
@keyframes ud-orb1     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.15)} }
@keyframes ud-orb2     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.12)} }
@keyframes ud-orb3     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,35px) scale(1.1)} }
@keyframes ud-glow     { 0%,100%{box-shadow:0 0 24px 4px rgba(139,92,246,.5)} 50%{box-shadow:0 0 48px 12px rgba(139,92,246,.85)} }
@keyframes ud-tick     { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
@keyframes ud-badge    { 0%{transform:scale(.5) rotate(-20deg);opacity:0} 100%{transform:scale(1) rotate(0deg);opacity:1} }
`;

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
const I = {
  Film:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
  Ticket:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>,
  Wallet:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  Gift:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Calendar: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Star:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Heart:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Home:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  User:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MapPin:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Bell:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Settings: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M22 12h-2M4 12H2M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 22v-2M12 4V2"/></svg>,
  TrendUp:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Award:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  ChevR:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Edit:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Zap:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Play:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Check:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

/* ── Animated Number ─────────────────────────────────────────────────────── */
const AnimNum: React.FC<{val:number;pre?:string;suf?:string;dur?:number}> = ({val,pre='',suf='',dur=1200}) => {
  const [n, setN] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const t0 = performance.now();
    const go = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * val));
      if (p < 1) raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, [val, dur]);
  return <>{pre}{n.toLocaleString()}{suf}</>;
};

/* ── Theme Tokens ────────────────────────────────────────────────────────── */
const T = {
  bg:      '#07071a',
  card:    'rgba(255,255,255,0.04)',
  cardHov: 'rgba(255,255,255,0.08)',
  border:  'rgba(255,255,255,0.08)',
  borderH: 'rgba(255,255,255,0.18)',
  text:    '#f1f5f9',
  muted:   '#64748b',
  dim:     '#334155',
};

const GRAD = {
  violet:  'linear-gradient(135deg,#7c3aed,#4f46e5)',
  rose:    'linear-gradient(135deg,#f43f5e,#e11d48)',
  cyan:    'linear-gradient(135deg,#06b6d4,#0284c7)',
  amber:   'linear-gradient(135deg,#f59e0b,#d97706)',
  emerald: 'linear-gradient(135deg,#10b981,#059669)',
  fuchsia: 'linear-gradient(135deg,#d946ef,#9333ea)',
  orange:  'linear-gradient(135deg,#f97316,#ea580c)',
  teal:    'linear-gradient(135deg,#14b8a6,#0d9488)',
};

const GLOW = {
  violet:  'rgba(124,58,237,.35)',
  rose:    'rgba(244,63,94,.35)',
  cyan:    'rgba(6,182,212,.35)',
  amber:   'rgba(245,158,11,.35)',
  emerald: 'rgba(16,185,129,.35)',
  fuchsia: 'rgba(217,70,239,.35)',
  orange:  'rgba(249,115,22,.35)',
  teal:    'rgba(20,184,166,.35)',
};

/* ── Glassmorphism Card ───────────────────────────────────────────────────── */
const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  hover?: boolean;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, style, hover = false, glowColor, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && hover ? T.cardHov : T.card,
        border: `1px solid ${hov && hover ? T.borderH : T.border}`,
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all .3s cubic-bezier(.23,1,.32,1)',
        transform: hov && hover ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hov && hover
          ? `0 20px 60px rgba(0,0,0,.5), 0 0 40px ${glowColor ?? 'rgba(124,58,237,.2)'}`
          : '0 4px 20px rgba(0,0,0,.3)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* top shimmer line */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:1,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)',
        pointerEvents:'none',
      }}/>
      {children}
    </div>
  );
};

/* ── KPI Card ────────────────────────────────────────────────────────────── */
const KPI: React.FC<{
  icon: React.ReactNode; label: string; val: number;
  pre?: string; suf?: string; grad: string; glow: string;
  accent: string; onClick?: () => void; delay?: number;
}> = ({ icon, label, val, pre='', suf='', grad, glow, accent, onClick, delay=0 }) => {
  const [hov, setHov] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1px solid ${hov ? accent + '55' : T.border}`,
        borderRadius: 20, padding: '22px 20px',
        backdropFilter: 'blur(20px)',
        position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        transform: vis ? (hov ? 'perspective(600px) rotateX(-5deg) translateY(-8px) scale(1.03)' : 'perspective(600px) rotateX(0) translateY(0) scale(1)') : 'translateY(24px)',
        opacity: vis ? 1 : 0,
        transition: `all .4s cubic-bezier(.23,1,.32,1) ${delay}ms`,
        boxShadow: hov ? `0 20px 60px rgba(0,0,0,.5), 0 0 50px ${glow}` : '0 4px 20px rgba(0,0,0,.3)',
      }}
    >
      {/* Orb bg */}
      <div style={{ position:'absolute',top:-30,right:-30,width:100,height:100,borderRadius:'50%',background:grad,filter:'blur(30px)',opacity:hov?.45:.2,transition:'opacity .3s',pointerEvents:'none'}}/>
      {/* Diagonal stripe */}
      <div style={{ position:'absolute',bottom:-20,left:-20,width:80,height:80,background:grad,opacity:.06,transform:'rotate(30deg)',pointerEvents:'none'}}/>
      {/* Top bar */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:grad,opacity:hov?1:.5,transition:'opacity .3s'}}/>

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{
          width:44,height:44,borderRadius:14,background:grad,
          display:'flex',alignItems:'center',justifyContent:'center',color:'white',
          boxShadow:`0 4px 20px ${glow}`,
          transform:hov?'scale(1.15) rotate(-8deg)':'scale(1) rotate(0)',
          transition:'transform .3s',
        }}>{icon}</div>
        {onClick && <div style={{color:hov?accent:T.dim,transition:'color .2s,transform .2s',transform:hov?'translateX(4px)':'translateX(0)'}}><I.ChevR/></div>}
      </div>
      <div style={{fontSize:'2rem',fontWeight:900,color:T.text,lineHeight:1,marginBottom:4,letterSpacing:'-0.02em'}}>
        {vis && <AnimNum val={val} pre={pre} suf={suf}/>}
      </div>
      <div style={{fontSize:'0.68rem',color:T.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
    </div>
  );
};

/* ── Tab Button ──────────────────────────────────────────────────────────── */
const Tab: React.FC<{active:boolean;label:string;icon:React.ReactNode;color:string;onClick:()=>void}> = ({active,label,icon,color,onClick}) => (
  <button onClick={onClick} style={{
    display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:12,
    fontSize:'0.82rem',fontWeight:700,whiteSpace:'nowrap',cursor:'pointer',
    background: active ? color : 'transparent',
    color: active ? 'white' : T.muted,
    border: active ? `1px solid ${color}55` : '1px solid transparent',
    boxShadow: active ? `0 4px 20px ${color}55` : 'none',
    transition:'all .25s',
  }}>
    <span style={{opacity: active ? 1 : .6}}>{icon}</span>{label}
  </button>
);

/* ── Neon Progress Bar ───────────────────────────────────────────────────── */
const NeonBar: React.FC<{val:number;max:number;color:string;grad:string;label:string;cur:string;tgt:string}> = ({val,max,color,grad,label,cur,tgt}) => {
  const pct = Math.min(100,(val/max)*100);
  const [w, setW] = useState(0);
  useEffect(()=>{ const t = setTimeout(()=>setW(pct),200); return ()=>clearTimeout(t); },[pct]);
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{color:T.text,fontSize:'0.75rem',fontWeight:600}}>{label}</span>
        <span style={{color:T.muted,fontSize:'0.68rem'}}>{cur} / {tgt}</span>
      </div>
      <div style={{height:8,background:'rgba(255,255,255,0.06)',borderRadius:999,overflow:'hidden',position:'relative'}}>
        <div style={{
          height:'100%',width:`${w}%`,borderRadius:999,
          background:grad,transition:'width 1.2s cubic-bezier(.23,1,.32,1)',
          boxShadow:`0 0 12px ${color}88`,
          position:'relative',
        }}>
          {/* Moving shine */}
          <div style={{position:'absolute',top:0,right:0,bottom:0,width:30,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4))',borderRadius:'0 999px 999px 0'}}/>
        </div>
      </div>
    </div>
  );
};

/* ── Booking Row Card ────────────────────────────────────────────────────── */
const BookingRow: React.FC<{b:Booking;poster:string;onClick:()=>void}> = ({b,poster,onClick}) => {
  const [hov,setHov] = useState(false);
  const ok = b.status === 'confirmed';
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:14,
      background: hov ? T.cardHov : T.card,
      border:`1px solid ${hov ? (ok?'rgba(16,185,129,.3)':'rgba(244,63,94,.3)') : T.border}`,
      cursor:'pointer',transition:'all .25s',
      transform:hov?'translateX(6px)':'translateX(0)',
      boxShadow:hov?`0 8px 30px rgba(0,0,0,.4)`:'none',
      marginBottom:8,
    }}>
      {/* Status side bar */}
      <div style={{width:3,height:50,borderRadius:999,background:ok?GRAD.emerald:GRAD.rose,flexShrink:0,boxShadow:`0 0 8px ${ok?GLOW.emerald:GLOW.rose}`}}/>
      <div style={{width:42,height:58,borderRadius:8,overflow:'hidden',flexShrink:0,boxShadow:'0 4px 16px rgba(0,0,0,.5)'}}>
        <img src={poster} alt={b.movieTitle} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{color:T.text,fontWeight:700,fontSize:'0.85rem',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.movieTitle}</p>
        <p style={{color:T.muted,fontSize:'0.72rem',marginBottom:2}}>{b.theatreName}</p>
        <p style={{color:T.dim,fontSize:'0.68rem'}}>{b.showDate} · {b.showTime}</p>
      </div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <p style={{color:T.text,fontWeight:800,fontSize:'0.9rem',marginBottom:4}}>₹{b.finalAmount}</p>
        <span style={{
          fontSize:'0.6rem',fontWeight:700,padding:'3px 10px',borderRadius:20,
          background:ok?'rgba(16,185,129,.12)':'rgba(244,63,94,.12)',
          color:ok?'#34d399':'#fb7185',
          border:`1px solid ${ok?'rgba(16,185,129,.25)':'rgba(244,63,94,.25)'}`,
        }}>{ok?'✓ Confirmed':'✗ Cancelled'}</span>
      </div>
    </div>
  );
};

/* ── Quick Action ────────────────────────────────────────────────────────── */
const Action: React.FC<{icon:React.ReactNode;label:string;sub:string;grad:string;glow:string;onClick:()=>void}> = ({icon,label,sub,grad,glow,onClick}) => {
  const [hov,setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      width:'100%',padding:'16px 18px',borderRadius:16,textAlign:'left',cursor:'pointer',
      background:hov?T.cardHov:T.card,
      border:`1px solid ${hov?T.borderH:T.border}`,
      transform:hov?'perspective(600px) rotateX(-3deg) translateY(-5px)':'perspective(600px) rotateX(0) translateY(0)',
      boxShadow:hov?`0 16px 40px rgba(0,0,0,.45),0 0 30px ${glow}`:'0 2px 10px rgba(0,0,0,.2)',
      transition:'all .3s cubic-bezier(.23,1,.32,1)',
      display:'flex',alignItems:'center',gap:14,
    }}>
      <div style={{
        width:48,height:48,borderRadius:14,background:grad,flexShrink:0,
        display:'flex',alignItems:'center',justifyContent:'center',color:'white',
        boxShadow:`0 6px 20px ${glow}`,
        transform:hov?'scale(1.15) rotate(-8deg)':'scale(1) rotate(0)',
        transition:'transform .3s',
      }}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{color:T.text,fontWeight:700,fontSize:'0.88rem',marginBottom:2}}>{label}</p>
        <p style={{color:T.muted,fontSize:'0.7rem'}}>{sub}</p>
      </div>
      <div style={{color:hov?'#a78bfa':T.dim,transition:'all .2s',transform:hov?'translateX(5px)':'translateX(0)'}}>
        <I.ChevR/>
      </div>
    </button>
  );
};

/* ── Genre pill ──────────────────────────────────────────────────────────── */
const GCOL: Record<string,{g:string;c:string;glow:string}> = {
  Action:    {g:GRAD.rose,    c:'#fb7185',glow:GLOW.rose},
  Horror:    {g:GRAD.violet,  c:'#a78bfa',glow:GLOW.violet},
  Comedy:    {g:GRAD.amber,   c:'#fbbf24',glow:GLOW.amber},
  Drama:     {g:GRAD.cyan,    c:'#67e8f9',glow:GLOW.cyan},
  Thriller:  {g:GRAD.teal,    c:'#2dd4bf',glow:GLOW.teal},
  'Sci-Fi':  {g:GRAD.fuchsia, c:'#e879f9',glow:GLOW.fuchsia},
  Romance:   {g:GRAD.orange,  c:'#fdba74',glow:GLOW.orange},
  Animation: {g:GRAD.emerald, c:'#4ade80',glow:GLOW.emerald},
};

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING ORBS BACKGROUND
══════════════════════════════════════════════════════════════════════════════ */
const OrbBg: React.FC = () => (
  <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
    {/* Orb 1 — Violet */}
    <div style={{position:'absolute',top:'10%',left:'15%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%)',animation:'ud-orb1 12s ease-in-out infinite',filter:'blur(2px)'}}/>
    {/* Orb 2 — Rose */}
    <div style={{position:'absolute',bottom:'15%',right:'10%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,63,94,.15) 0%,transparent 70%)',animation:'ud-orb2 15s ease-in-out infinite',filter:'blur(2px)'}}/>
    {/* Orb 3 — Cyan */}
    <div style={{position:'absolute',top:'55%',left:'55%',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%)',animation:'ud-orb3 18s ease-in-out infinite',filter:'blur(2px)'}}/>
    {/* Orb 4 — Amber */}
    <div style={{position:'absolute',top:'5%',right:'30%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,.1) 0%,transparent 70%)',animation:'ud-orb1 20s ease-in-out infinite reverse',filter:'blur(2px)'}}/>
    {/* Grid lines */}
    <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN USER DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
/* -- Social Tab sub-component -------------------------------------------- */
type SocialSubTab = 'followers' | 'following' | 'requests';
const SocialTab: React.FC<{
  currentUser: any; isPrivate: boolean;
  onLoadFollowers: () => void; onLoadFollowing: () => void; onLoadRequests: () => void;
  followers: SocialUserProfile[]; following: SocialUserProfile[]; followReqs: SocialUserProfile[];
  socialLoading: boolean;
  onViewProfile: (id: string) => void;
  onAccept: (uid: string) => void; onReject: (uid: string) => void; onUnfollow: (uid: string) => void;
  onMessages: () => void;
}> = ({ isPrivate, onLoadFollowers, onLoadFollowing, onLoadRequests, followers, following, followReqs, socialLoading, onViewProfile, onAccept, onReject, onUnfollow, onMessages }) => {
  const [sub, setSub] = React.useState<SocialSubTab>('followers');
  React.useEffect(() => {
    if (sub === 'followers') onLoadFollowers();
    else if (sub === 'following') onLoadFollowing();
    else onLoadRequests();
  }, [sub]); // eslint-disable-line
  const list = sub === 'followers' ? followers : sub === 'following' ? following : followReqs;
  return (
    <div style={{ animation: 'ud-rise .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 999, background: 'linear-gradient(135deg,#10b981,#06b6d4)' }} />
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.15rem', fontFamily: "'Outfit',sans-serif" }}>Social</h2>
        </div>
        <button onClick={onMessages} style={{ padding: '8px 18px', borderRadius: 100, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          messages
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {([{ key: 'followers' as const, label: 'Followers' }, { key: 'following' as const, label: 'Following' }, { key: 'requests' as const, label: 'Requests' + (followReqs.length > 0 ? ' (' + followReqs.length + ')' : '') }]).map(t => (
          <button key={t.key} onClick={() => setSub(t.key)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: sub === t.key ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'transparent', color: sub === t.key ? 'white' : '#64748b', transition: 'all .2s' }}>{t.label}</button>
        ))}
      </div>
      {!isPrivate && sub === 'requests' && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#fbbf24', fontSize: 12 }}>
          Follow requests only appear when your account is Private. Enable it in Settings.
        </div>
      )}
      {socialLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
            {sub === 'followers' ? 'No followers yet.' : sub === 'following' ? 'Not following anyone yet.' : 'No pending follow requests.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(user => (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
              <div onClick={() => onViewProfile(user.id)} style={{ width: 46, height: 46, borderRadius: '50%', background: user.avatar ? 'transparent' : 'linear-gradient(135deg,#6366f1,#a855f7)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white', cursor: 'pointer', border: '2px solid rgba(168,85,247,0.3)' }}>
                {user.avatar ? React.createElement('img', { src: user.avatar, alt: user.name, style: { width: '100%', height: '100%', objectFit: 'cover' } }) : user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }} onClick={() => onViewProfile(user.id)}>{user.name}</div>
                {user.username && React.createElement('div', { style: { color: '#a78bfa', fontSize: 12 } }, '@' + user.username)}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {sub === 'following' && React.createElement('button', { onClick: () => onUnfollow(user.id), style: { padding: '6px 14px', borderRadius: 100, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: 11, fontWeight: 700, cursor: 'pointer' } }, 'Unfollow')}
                {sub === 'requests' && React.createElement(React.Fragment, null,
                  React.createElement('button', { onClick: () => onAccept(user.id), style: { padding: '6px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' } }, 'Accept'),
                  React.createElement('button', { onClick: () => onReject(user.id), style: { padding: '6px 14px', borderRadius: 100, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: 11, fontWeight: 700, cursor: 'pointer' } }, 'Reject')
                )}
                <button onClick={() => onViewProfile(user.id)} style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const UserDashboard: React.FC = () => {
  const { currentUser, getUserBookings, movies, navigate, selectMovie, openCityModal, logout, movieLikes, movieInterests, updateCurrentUser, refreshUserBookings } = useApp();
  // Derived: movies this user has liked / shown interest in
  const likedMovieIds    = currentUser ? Object.entries(movieLikes   ).filter(([,ids])=>ids.includes(currentUser.id)).map(([id])=>id) : [];
  const interestedMovieIds = currentUser ? Object.entries(movieInterests).filter(([,ids])=>ids.includes(currentUser.id)).map(([id])=>id) : [];
  const [tab, setTab] = useState<'overview'|'discover'|'activity'|'preferences'|'settings'|'social'|'theatre'>('overview');
  const [greeting, setGreeting] = useState('');
  const [avatarHov, setAvatarHov] = useState(false);
  const [avatarLocal, setAvatarLocal] = useState<string>(currentUser?.avatar ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [, setToast] = useState<{msg:string;type:'success'|'error'|'info'}|null>(null);
  const [, setBookingsLoading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  // Social state
  const [isPrivate, setIsPrivate]         = useState<boolean>((currentUser as any)?.isPrivate ?? false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [msgHubOpen, setMsgHubOpen]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  // Social tab state
  const [profileModal, setProfileModal]   = useState<string|null>(null);
  const [followers, setFollowers]         = useState<SocialUserProfile[]>([]);
  const [following, setFollowing]         = useState<SocialUserProfile[]>([]);
  const [followReqs, setFollowReqs]       = useState<SocialUserProfile[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  // Theatre Experience tab state
  const [theatreViewData, setTheatreViewData]   = useState<any>(null);
  const [theatreViewName, setTheatreViewName]   = useState('');
  const [theatreViewLoading, setTheatreViewLoading] = useState(false);
  const [theatreViewId, setTheatreViewId]       = useState('');

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
    // inject CSS
    if (!document.getElementById('ud-styles')) {
      const s = document.createElement('style');
      s.id = 'ud-styles'; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  // ─── Load real bookings from MongoDB on mount ────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setBookingsLoading(true);
    refreshUserBookings().finally(() => setBookingsLoading(false));

    // Refresh when user returns to this tab or a new booking signal fires
    const onVisible = () => { if (document.visibilityState === 'visible') refreshUserBookings(); };
    document.addEventListener('visibilitychange', onVisible);
    const onStorage = (e: StorageEvent) => { if (e.key === 'cc_booking_ts') refreshUserBookings(); };
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, [currentUser?.id]); // eslint-disable-line

  // Sync avatarLocal when currentUser.avatar changes (e.g. after login refresh)
  useEffect(() => {
    if (currentUser?.avatar) setAvatarLocal(currentUser.avatar);
  }, [currentUser?.avatar]); // eslint-disable-line

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) {
      showToast('Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      showToast(`Image too large (${(f.size/1024/1024).toFixed(1)}MB). Max is 2MB.`, 'error');
      return;
    }

    // Instant local preview while upload is in progress
    const previewUrl = URL.createObjectURL(f);
    setAvatarLocal(previewUrl);
    setAvatarUploading(true);

    const result = await apiUploadAvatar(f);
    setAvatarUploading(false);
    URL.revokeObjectURL(previewUrl);

    if (result.ok) {
      const newAvatar = result.avatar;
      setAvatarLocal(newAvatar);            // instant local preview
      updateCurrentUser({ avatar: newAvatar }); // ← FIX: persist to AppContext + localStorage
      showToast('✅ Profile photo saved to database!', 'success');
    } else {
      // Fallback: keep preview from base64 locally
      const reader = new FileReader();
      reader.onload = ev => {
        const b64 = ev.target?.result as string;
        setAvatarLocal(b64);
        updateCurrentUser({ avatar: b64 }); // at least update local context
        showToast(`⚠️ ${result.message} — saved locally as fallback.`, 'info');
      };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };

  // Load unread conversation count for badge
  useEffect(() => {
    if (!currentUser) return;
    apiGetUnreadCount().then(r => { if (r.ok && r.data) setUnreadCount(r.data.count); });
    const iv = setInterval(() => {
      apiGetUnreadCount().then(r => { if (r.ok && r.data) setUnreadCount(r.data.count); });
    }, 10000);
    return () => clearInterval(iv);
  }, [currentUser]);

  const handlePrivacyToggle = useCallback(async () => {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    setPrivacySaving(true);
    const r = await apiUpdatePrivacy(newVal);
    setPrivacySaving(false);

    if (r.ok) {
      // Immediately update currentUser in AppContext so mergedSeatMap reflects change
      updateCurrentUser({ isPrivate: newVal });
      showToast(
        newVal
          ? '🔒 Account set to Private — your profile is now hidden on seat maps'
          : '🌐 Account set to Public — everyone can see your profile on seat maps',
        'info'
      );
    } else {
      setIsPrivate(!newVal); // revert if save failed
      showToast('❌ Failed to save privacy setting. Please try again.', 'error');
    }
  }, [isPrivate, showToast, updateCurrentUser]);

  useEffect(() => { if (!currentUser) navigate('auth'); }, [currentUser, navigate]);
  if (!currentUser) return null;

  /* ── Data ── */
  const bookings   = getUserBookings();
  const today      = new Date().toISOString().split('T')[0];
  const confirmed  = bookings.filter(b => b.status === 'confirmed');
  const upcoming   = confirmed.filter(b => b.showDate >= today);
  const past       = confirmed.filter(b => b.showDate < today);
  const totalSpent = confirmed.reduce((s,b) => s + b.finalAmount, 0);
  const totalSaved = bookings.reduce((s,b) => s + (b.discount ?? 0), 0);
  const rated      = past.filter(b => b.hasRated).length;
  const avgSpend   = confirmed.length ? Math.round(totalSpent / confirmed.length) : 0;

  /* Membership */
  const level   = totalSpent >= 5000 ? 'Gold' : totalSpent >= 2000 ? 'Silver' : 'Bronze';
  const lvlGrad = totalSpent >= 5000 ? 'linear-gradient(135deg,#b8860b,#ffd700,#b8860b)' : totalSpent >= 2000 ? 'linear-gradient(135deg,#64748b,#cbd5e1,#64748b)' : 'linear-gradient(135deg,#7c3c00,#cd7f32,#7c3c00)';
  const lvlGlow = totalSpent >= 5000 ? 'rgba(255,215,0,.4)' : totalSpent >= 2000 ? 'rgba(148,163,184,.3)' : 'rgba(205,127,50,.3)';
  const nxtTgt  = totalSpent >= 5000 ? 5000 : totalSpent >= 2000 ? 5000 : 2000;
  const nxtLbl  = totalSpent >= 5000 ? 'Gold ✓' : totalSpent >= 2000 ? 'Gold' : 'Silver';
  const lvlPct  = Math.min(100, totalSpent >= 2000 ? ((totalSpent-2000)/3000)*100 : (totalSpent/2000)*100);

  /* Genres */
  const gc: Record<string,number> = {};
  bookings.forEach(b => { const m = movies.find(x => x.id === b.movieId); m?.genre.forEach(g => { gc[g] = (gc[g]||0)+1; }); });
  const topG = Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([g,c])=>({genre:g,count:c}));

  const memberSince = new Date(currentUser.joinDate);
  const months = Math.max(1,(new Date().getFullYear()-memberSince.getFullYear())*12+(new Date().getMonth()-memberSince.getMonth()));



  return (
    <>
      <OrbBg/>
      <div style={{position:'relative',zIndex:1,minHeight:'100vh',padding:'32px 16px',maxWidth:1140,margin:'0 auto'}}>

        {/* ═══ HERO PROFILE BANNER ═══════════════════════════════════════════ */}
        <div style={{
          borderRadius:28,overflow:'hidden',marginBottom:28,position:'relative',
          background:'linear-gradient(145deg,rgba(15,10,40,.97) 0%,rgba(8,5,25,.99) 50%,rgba(12,5,30,.97) 100%)',
          border:'1px solid rgba(255,255,255,.09)',
          boxShadow:`0 32px 100px rgba(0,0,0,.7),0 0 80px ${lvlGlow}`,
          animation:'ud-rise .6s ease both',
        }}>
          {/* Top colour bar */}
          <div style={{height:4,background:'linear-gradient(90deg,#7c3aed,#e11d48,#0891b2,#059669)',backgroundSize:'200% 100%',animation:'ud-shimmer 4s linear infinite'}}/>

          {/* Membership level orb */}
          <div style={{position:'absolute',top:-80,left:-80,width:300,height:300,borderRadius:'50%',background:lvlGrad,filter:'blur(70px)',opacity:.15,animation:'ud-orb1 10s ease-in-out infinite',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.2),transparent)',filter:'blur(50px)',pointerEvents:'none'}}/>

          {/* Grid */}
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}}/>

          <div style={{position:'relative',zIndex:1,padding:'28px 28px 0'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:22,flexWrap:'wrap'}}>

              {/* ── Avatar ── */}
              <div
                style={{position:'relative',flexShrink:0,cursor:'pointer'}}
                onMouseEnter={() => setAvatarHov(true)}
                onMouseLeave={() => setAvatarHov(false)}
                onClick={() => avatarFileRef.current?.click()}
                title="Click to change profile photo"
              >
                <div style={{
                  width:88,height:88,borderRadius:24,
                  background: avatarLocal ? 'transparent' : `linear-gradient(135deg,#7c3aed,#e11d48,#0891b2)`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'2.4rem',fontWeight:900,color:'white',
                  boxShadow: avatarHov
                    ? `0 0 0 3px rgba(124,58,237,.6), 0 12px 40px rgba(124,58,237,.6), 0 0 30px rgba(124,58,237,.4)`
                    : `0 0 0 3px rgba(255,255,255,.12),0 12px 40px rgba(124,58,237,.5)`,
                  animation:'ud-glow 3s ease-in-out infinite',
                  overflow:'hidden',
                  transition:'box-shadow .3s ease',
                }}>
                  {avatarLocal ? (
                    <img
                      src={avatarLocal}
                      alt={currentUser.name}
                      style={{width:'100%',height:'100%',objectFit:'cover',
                        transform: avatarHov ? 'scale(1.08)' : 'scale(1)',
                        transition:'transform .35s ease',
                      }}
                      onError={() => setAvatarLocal('')}
                    />
                  ) : (
                    currentUser.name[0].toUpperCase()
                  )}

                  {/* Upload spinner overlay */}
                  {avatarUploading && (
                    <div style={{
                      position:'absolute',inset:0,
                      background:'rgba(0,0,0,.7)',backdropFilter:'blur(3px)',
                      display:'flex',flexDirection:'column',
                      alignItems:'center',justifyContent:'center',
                      borderRadius:24,
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" style={{animation:'ud-spin 0.8s linear infinite'}}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      <span style={{color:'rgba(255,255,255,.7)',fontSize:'0.48rem',fontWeight:800,marginTop:5}}>SAVING…</span>
                    </div>
                  )}
                  {/* Hover overlay (only when not uploading) */}
                  {avatarHov && !avatarUploading && (
                    <div style={{
                      position:'absolute',inset:0,
                      background:'rgba(0,0,0,.58)',backdropFilter:'blur(3px)',
                      display:'flex',flexDirection:'column',
                      alignItems:'center',justifyContent:'center',
                      borderRadius:24,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <span style={{color:'white',fontSize:'0.5rem',fontWeight:800,marginTop:4,letterSpacing:'0.05em'}}>CHANGE</span>
                    </div>
                  )}
                </div>

                {/* Online badge */}
                <div style={{
                  position:'absolute',bottom:-4,right:-4,width:22,height:22,
                  borderRadius:'50%',background:'#22c55e',
                  border:'3px solid rgba(8,5,25,.99)',
                  boxShadow:'0 0 12px rgba(34,197,94,.8)',
                  animation:'ud-pulse 2s ease-in-out infinite',
                }}/>

                {/* Camera icon on bottom-right of avatar (when no hover) */}
                {!avatarHov && (
                  <div style={{
                    position:'absolute',bottom:-4,left:-4,
                    width:24,height:24,borderRadius:'50%',
                    background:'linear-gradient(135deg,#7c3aed,#e11d48)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    border:'2px solid rgba(8,5,25,.99)',
                    boxShadow:'0 2px 8px rgba(124,58,237,.6)',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{display:'none'}}
              />

              {/* ── Info ── */}
              <div style={{flex:1,minWidth:200}}>
                <p style={{color:'#a78bfa',fontSize:'0.78rem',fontWeight:600,marginBottom:4,letterSpacing:'0.04em'}}>
                  {greeting} 👋
                </p>
                <h1 style={{
                  color:'white',fontSize:'1.8rem',fontWeight:900,marginBottom:6,lineHeight:1.1,
                  background:'linear-gradient(135deg,#f1f5f9,#a78bfa)',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
                }}>
                  {currentUser.name}
                </h1>
                <p style={{color:T.muted,fontSize:'0.8rem',marginBottom:12}}>{currentUser.email} · <span style={{color:'#64748b'}}>{currentUser.phone}</span></p>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                  {/* Level badge */}
                  <div style={{
                    display:'inline-flex',alignItems:'center',gap:6,
                    padding:'5px 14px',borderRadius:999,
                    background:lvlGrad,
                    boxShadow:`0 4px 20px ${lvlGlow}`,
                    animation:'ud-badge .5s cubic-bezier(.34,1.56,.64,1) both',
                  }}>
                    <I.Award/>
                    <span style={{fontSize:'0.72rem',fontWeight:800,color:'rgba(0,0,0,.75)',letterSpacing:'0.05em'}}>{level} MEMBER</span>
                  </div>
                  {/* City */}
                  <button onClick={openCityModal} style={{
                    display:'inline-flex',alignItems:'center',gap:5,
                    padding:'5px 12px',borderRadius:999,cursor:'pointer',
                    background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.10)',
                    color:'#94a3b8',fontSize:'0.72rem',fontWeight:600,transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(124,58,237,.5)';(e.currentTarget as HTMLElement).style.color='#a78bfa';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.10)';(e.currentTarget as HTMLElement).style.color='#94a3b8';}}
                  >
                    <I.MapPin/>{currentUser.city}<I.Edit/>
                  </button>
                  {upcoming.length > 0 && (
                    <div style={{
                      display:'inline-flex',alignItems:'center',gap:5,
                      padding:'5px 12px',borderRadius:999,
                      background:'rgba(6,182,212,.1)',border:'1px solid rgba(6,182,212,.25)',
                      color:'#67e8f9',fontSize:'0.72rem',fontWeight:600,
                    }}>
                      <I.Calendar/>{upcoming.length} Upcoming
                    </div>
                  )}
                </div>
              </div>

              {/* ── Membership Progress ── */}
              <div style={{minWidth:200,flex:'0 0 auto'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{color:T.muted,fontSize:'0.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Progress to {nxtLbl}</span>
                  <span style={{color:'#94a3b8',fontSize:'0.66rem'}}>₹{totalSpent.toLocaleString()} / ₹{nxtTgt.toLocaleString()}</span>
                </div>
                <div style={{height:10,background:'rgba(255,255,255,.05)',borderRadius:999,overflow:'hidden',marginBottom:10,position:'relative'}}>
                  <div style={{
                    height:'100%',width:`${lvlPct}%`,borderRadius:999,
                    background:lvlGrad,transition:'width 1.4s cubic-bezier(.23,1,.32,1)',
                    boxShadow:`0 0 14px ${lvlGlow}`,position:'relative',
                  }}>
                    <div style={{position:'absolute',top:0,right:0,bottom:0,width:20,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.5))',borderRadius:'0 999px 999px 0'}}/>
                  </div>
                </div>
                {/* Mini stats */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[
                    {l:'Bookings',v:bookings.length,c:'#a78bfa'},
                    {l:'Watched',v:past.length,c:'#67e8f9'},
                    {l:'Saved ₹',v:totalSaved,c:'#4ade80'},
                  ].map(s=>(
                    <div key={s.l} style={{
                      textAlign:'center',padding:'8px 6px',borderRadius:10,
                      background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
                    }}>
                      <p style={{color:s.c,fontWeight:900,fontSize:'1rem',lineHeight:1}}>{s.v}</p>
                      <p style={{color:T.dim,fontSize:'0.58rem',fontWeight:700,marginTop:2}}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{
              marginTop:22,display:'flex',gap:4,overflowX:'auto',
              padding:'4px',background:'rgba(255,255,255,.03)',borderRadius:14,
              border:'1px solid rgba(255,255,255,.06)',scrollbarWidth:'none',
            }}>
              {([
                {key:'overview',    label:'Overview',     icon:<I.Home/>,    color:'rgba(124,58,237,1)'},
                {key:'discover',    label:'Discover',     icon:<I.Film/>,    color:'rgba(8,145,178,1)'},
                {key:'activity',    label:'Activity',     icon:<I.TrendUp/>, color:'rgba(217,70,239,1)'},
                {key:'preferences', label:'Taste Profile',icon:<I.Heart/>,   color:'rgba(225,29,72,1)'},
                {key:'theatre',     label:'Theatre View', icon:<span style={{fontSize:'1rem'}}>👁</span>, color:'rgba(168,85,247,1)'},
                {key:'social',      label:'Social',       icon:<span style={{fontSize:'1rem'}}>👥</span>, color:'rgba(16,185,129,1)'},
                {key:'settings',    label:'Settings',     icon:<I.Settings/>,color:'rgba(5,150,105,1)'},
              ] as const).map(t=>(
                <Tab key={t.key} active={tab===t.key} label={t.label} icon={t.icon} color={t.color} onClick={()=>setTab(t.key as any)}/>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ DISCOVER (Smart Search) ══════════════════════════════════════ */}
        {tab === 'discover' && (
          <div style={{animation:'ud-rise .4s ease both'}}>
            <SmartSearch
              movies={movies}
              bookings={bookings}
              onSelect={(m: Movie) => { selectMovie(m); }}
              onBrowseAll={() => navigate('movies')}
            />
          </div>
        )}

        {/* ═══ OVERVIEW ═══════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div style={{animation:'ud-rise .4s ease both'}}>
            {/* KPI Row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:24}}>
              <KPI icon={<I.Ticket/>}   label="Bookings"     val={bookings.length} grad={GRAD.violet}  glow={GLOW.violet}  accent="#7c3aed" delay={0}   onClick={()=>navigate('my-bookings')}/>
              <KPI icon={<I.Wallet/>}   label="Total Spent"  val={totalSpent}      grad={GRAD.emerald} glow={GLOW.emerald} accent="#10b981" delay={80}  pre="₹"/>
              <KPI icon={<I.Gift/>}     label="Total Saved"  val={totalSaved}      grad={GRAD.amber}   glow={GLOW.amber}   accent="#f59e0b" delay={160} pre="₹"/>
              <KPI icon={<I.Calendar/>} label="Upcoming"     val={upcoming.length} grad={GRAD.cyan}    glow={GLOW.cyan}    accent="#06b6d4" delay={240} onClick={()=>navigate('my-bookings')}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:20,marginBottom:20}}>
              {/* Quick Actions */}
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.violet}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Quick Actions</h3>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <Action icon={<I.Film/>}    label="Browse Movies"   sub="Discover what's showing near you"  grad={GRAD.violet}  glow={GLOW.violet}  onClick={()=>navigate('movies')}/>
                  <Action icon={<I.Ticket/>}  label="My Tickets"      sub="View & manage your bookings"        grad={GRAD.rose}    glow={GLOW.rose}    onClick={()=>navigate('my-bookings')}/>
                  <Action icon={<I.Gift/>}    label="Offers & Deals"  sub="Exclusive discounts for you"        grad={GRAD.amber}   glow={GLOW.amber}   onClick={()=>navigate('offers')}/>
                  <Action icon={<I.Play/>}    label="Now Showing"     sub="Hot movies right now"               grad={GRAD.emerald} glow={GLOW.emerald} onClick={()=>navigate('home')}/>
                  {/* Messages shortcut with unread badge */}
                  <div style={{position:'relative'}}>
                    <Action
                      icon={<span style={{fontSize:'1.1rem'}}>💬</span>}
                      label="Messages"
                      sub={unreadCount > 0 ? `${unreadCount} active conversation${unreadCount!==1?'s':''}` : 'Chat with fellow movie-goers'}
                      grad={GRAD.fuchsia}
                      glow={GLOW.fuchsia}
                      onClick={()=>setMsgHubOpen(true)}
                    />
                    {unreadCount > 0 && (
                      <div style={{
                        position:'absolute',top:10,right:14,
                        width:20,height:20,borderRadius:'50%',
                        background:GRAD.rose,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'0.6rem',fontWeight:900,color:'white',
                        boxShadow:`0 0 10px ${GLOW.rose}`,
                        pointerEvents:'none',
                      }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Recent Bookings */}
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:4,height:20,borderRadius:999,background:GRAD.cyan}}/>
                    <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Recent Bookings</h3>
                  </div>
                  <button onClick={()=>navigate('my-bookings')} style={{
                    fontSize:'0.72rem',fontWeight:700,color:'#67e8f9',cursor:'pointer',
                    background:'rgba(6,182,212,.1)',border:'1px solid rgba(6,182,212,.2)',
                    padding:'4px 10px',borderRadius:8,transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(6,182,212,.2)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(6,182,212,.1)';}}
                  >View all →</button>
                </div>
                {bookings.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px 0'}}>
                    <div style={{fontSize:'3rem',marginBottom:12,animation:'ud-float 3s ease-in-out infinite'}}>🎬</div>
                    <p style={{color:T.muted,fontSize:'0.85rem',marginBottom:16}}>No bookings yet</p>
                    <button onClick={()=>navigate('movies')} style={{
                      background:GRAD.violet,color:'white',border:'none',
                      padding:'10px 24px',borderRadius:12,fontWeight:700,cursor:'pointer',
                      boxShadow:`0 4px 20px ${GLOW.violet}`,
                    }}>Book Your First Movie</button>
                  </div>
                ) : (
                  bookings.slice(-4).reverse().map(b => {
                    const poster = movies.find(m=>m.id===b.movieId)?.poster ?? '';
                    return <BookingRow key={b.id} b={b} poster={poster} onClick={()=>navigate('my-bookings')}/>;
                  })
                )}
              </Card>
            </div>

            {/* Membership progress + stats */}
            <Card style={{padding:24,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:4,height:20,borderRadius:999,background:lvlGrad}}/>
                <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Membership & Progress</h3>
                <div style={{
                  marginLeft:'auto',padding:'4px 12px',borderRadius:999,
                  background:lvlGrad,fontSize:'0.7rem',fontWeight:800,
                  color:'rgba(0,0,0,.7)',boxShadow:`0 2px 12px ${lvlGlow}`,
                }}>{level}</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
                <div>
                  <NeonBar val={totalSpent}     max={nxtTgt}              color="#a78bfa" grad={GRAD.violet}  label={`Spend to reach ${nxtLbl}`} cur={`₹${totalSpent}`}     tgt={`₹${nxtTgt}`}/>
                  <NeonBar val={bookings.length} max={10}                  color="#67e8f9" grad={GRAD.cyan}    label="Booking milestone (10)"     cur={`${bookings.length}`} tgt="10"/>
                  <NeonBar val={rated}           max={Math.max(past.length,1)} color="#fbbf24" grad={GRAD.amber}  label="Reviews written"            cur={`${rated}`}           tgt={`${past.length}`}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {[
                    {l:'Avg Spend / Visit', v:`₹${avgSpend}`,   c:'#a78bfa', g:GRAD.violet},
                    {l:'Movies Watched',    v:past.length,       c:'#67e8f9', g:GRAD.cyan},
                    {l:'Months Active',     v:months,            c:'#fbbf24', g:GRAD.amber},
                    {l:'Reviews Written',   v:rated,             c:'#4ade80', g:GRAD.emerald},
                  ].map(s=>(
                    <div key={s.l} style={{
                      padding:'14px 16px',borderRadius:14,
                      background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
                      position:'relative',overflow:'hidden',
                    }}>
                      <div style={{position:'absolute',top:-10,right:-10,width:50,height:50,borderRadius:'50%',background:s.g,filter:'blur(16px)',opacity:.3}}/>
                      <p style={{color:s.c,fontWeight:900,fontSize:'1.4rem',lineHeight:1,marginBottom:4}}>{typeof s.v==='number'?<AnimNum val={s.v}/>:s.v}</p>
                      <p style={{color:T.dim,fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Upcoming shows */}
            {upcoming.length > 0 && (
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.rose}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Upcoming Shows</h3>
                  <div style={{
                    marginLeft:8,padding:'3px 10px',borderRadius:999,
                    background:'rgba(244,63,94,.12)',border:'1px solid rgba(244,63,94,.25)',
                    fontSize:'0.68rem',fontWeight:700,color:'#fb7185',
                  }}>{upcoming.length} upcoming</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                  {upcoming.map(b => {
                    const m = movies.find(x=>x.id===b.movieId);
                    const daysLeft = Math.ceil((new Date(b.showDate).getTime()-new Date().getTime())/(1000*60*60*24));
                    return (
                      <div key={b.id} onClick={()=>navigate('my-bookings')} style={{
                        borderRadius:16,overflow:'hidden',cursor:'pointer',
                        border:'1px solid rgba(244,63,94,.2)',
                        background:'rgba(244,63,94,.05)',
                        transition:'all .25s',
                      }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 40px ${GLOW.rose}`;}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='none';}}
                      >
                        <div style={{height:4,background:GRAD.rose}}/>
                        <div style={{padding:'14px 16px',display:'flex',gap:12,alignItems:'center'}}>
                          <img src={m?.poster} alt={b.movieTitle} style={{width:44,height:60,borderRadius:8,objectFit:'cover',flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,.5)'}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{color:T.text,fontWeight:700,fontSize:'0.82rem',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.movieTitle}</p>
                            <p style={{color:T.muted,fontSize:'0.7rem',marginBottom:3}}>{b.showDate} · {b.showTime}</p>
                            <p style={{color:'#94a3b8',fontSize:'0.66rem'}}>{b.seats.length} seat{b.seats.length!==1?'s':''} · ₹{b.finalAmount}</p>
                          </div>
                          <div style={{
                            textAlign:'center',flexShrink:0,padding:'6px 10px',borderRadius:10,
                            background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.2)',
                          }}>
                            <p style={{color:'#fb7185',fontWeight:900,fontSize:'1.1rem',lineHeight:1}}>{daysLeft}</p>
                            <p style={{color:T.dim,fontSize:'0.58rem',fontWeight:700}}>DAYS</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══ ACTIVITY ══════════════════════════════════════════════════════ */}
        {tab === 'activity' && (
          <div style={{animation:'ud-rise .4s ease both',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:20}}>
            {/* Timeline */}
            <Card style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:4,height:20,borderRadius:999,background:GRAD.cyan}}/>
                <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Booking Timeline</h3>
              </div>
              {bookings.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 0'}}>
                  <div style={{fontSize:'3rem',marginBottom:12}}>📽️</div>
                  <p style={{color:T.muted}}>No activity yet</p>
                </div>
              ) : (
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',left:16,top:0,bottom:0,width:2,background:'linear-gradient(180deg,#7c3aed,#06b6d4,#10b981)',borderRadius:999,opacity:.3}}/>
                  {bookings.slice().reverse().slice(0,8).map((b,i)=>{
                    const ok = b.status==='confirmed';
                    const dotGrad = ok ? GRAD.emerald : GRAD.rose;
                    const dotGlow = ok ? GLOW.emerald : GLOW.rose;
                    return (
                      <div key={b.id} style={{display:'flex',gap:16,marginBottom:16,position:'relative',opacity:1-i*.08,animation:`ud-rise .4s ease ${i*60}ms both`}}>
                        <div style={{
                          width:34,height:34,borderRadius:'50%',flexShrink:0,
                          background:dotGrad,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          color:'white',fontSize:'0.8rem',zIndex:1,
                          boxShadow:`0 0 16px ${dotGlow}`,
                        }}>
                          {ok?<I.Check/>:'✗'}
                        </div>
                        <div style={{
                          flex:1,padding:'10px 14px',borderRadius:12,cursor:'pointer',
                          background:`${ok?'rgba(16,185,129':'rgba(244,63,94'},.05)`,
                          border:`1px solid ${ok?'rgba(16,185,129':'rgba(244,63,94'},.12)`,
                          transition:'all .2s',
                        }}
                          onClick={()=>navigate('my-bookings')}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${ok?'rgba(16,185,129':'rgba(244,63,94'},.1)`;}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${ok?'rgba(16,185,129':'rgba(244,63,94'},.05)`;}}
                        >
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <p style={{color:T.text,fontWeight:700,fontSize:'0.82rem'}}>{b.movieTitle}</p>
                            <p style={{color:T.dim,fontSize:'0.62rem'}}>{b.bookingDate}</p>
                          </div>
                          <p style={{color:T.muted,fontSize:'0.7rem'}}>{b.theatreName} · {b.showTime}</p>
                          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                            <p style={{color:T.dim,fontSize:'0.64rem'}}>{b.seats.join(', ')}</p>
                            <p style={{color:ok?'#34d399':'#fb7185',fontWeight:700,fontSize:'0.72rem'}}>₹{b.finalAmount}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Spending Chart */}
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.amber}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Spending Overview</h3>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  {[
                    {l:'Total Spent',    v:`₹${totalSpent.toLocaleString()}`, c:'#fbbf24', g:GRAD.amber},
                    {l:'Total Saved',    v:`₹${totalSaved}`,                  c:'#4ade80', g:GRAD.emerald},
                    {l:'Avg Per Visit',  v:`₹${avgSpend}`,                    c:'#a78bfa', g:GRAD.violet},
                    {l:'Confirmed',      v:confirmed.length,                  c:'#67e8f9', g:GRAD.cyan},
                  ].map(s=>(
                    <div key={s.l} style={{
                      padding:'14px',borderRadius:14,
                      background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',
                      position:'relative',overflow:'hidden',
                    }}>
                      <div style={{position:'absolute',top:-8,right:-8,width:40,height:40,borderRadius:'50%',background:s.g,filter:'blur(12px)',opacity:.35}}/>
                      <p style={{color:s.c,fontWeight:900,fontSize:'1.3rem',lineHeight:1,marginBottom:4}}>{s.v}</p>
                      <p style={{color:T.dim,fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.l}</p>
                    </div>
                  ))}
                </div>
                {/* Vertical bar chart */}
                <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,padding:'0 4px'}}>
                  {bookings.slice(-7).map((b,i)=>{
                    const maxAmt = Math.max(...bookings.slice(-7).map(x=>x.finalAmount),1);
                    const h = (b.finalAmount/maxAmt)*100;
                    const ok = b.status==='confirmed';
                    return (
                      <div key={b.id} title={`${b.movieTitle}: ₹${b.finalAmount}`} style={{
                        flex:1,height:`${h}%`,borderRadius:'4px 4px 0 0',
                        background:ok?GRAD.emerald:GRAD.rose,
                        boxShadow:`0 0 12px ${ok?GLOW.emerald:GLOW.rose}`,
                        transition:'height 1s cubic-bezier(.23,1,.32,1)',
                        transitionDelay:`${i*80}ms`,cursor:'pointer',
                        minHeight:4,
                      }}/>
                    );
                  })}
                </div>
                <p style={{color:T.dim,fontSize:'0.62rem',textAlign:'center',marginTop:6}}>Last 7 bookings · hover for details</p>
              </Card>

              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.fuchsia}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Activity Stats</h3>
                </div>
                {[
                  {l:'Member Since', v:memberSince.toLocaleDateString('en-IN',{month:'long',year:'numeric'}), c:'#e879f9'},
                  {l:'Months Active', v:`${months} months`, c:'#a78bfa'},
                  {l:'Liked Movies',  v:`${likedMovieIds.length}`, c:'#fb7185'},
                  {l:'Interested In', v:`${interestedMovieIds.length} coming soon`, c:'#fbbf24'},
                ].map(s=>(
                  <div key={s.l} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.05)',
                  }}>
                    <span style={{color:T.muted,fontSize:'0.8rem'}}>{s.l}</span>
                    <span style={{color:s.c,fontWeight:700,fontSize:'0.8rem'}}>{s.v}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ═══ PREFERENCES ════════════════════════════════════════════════════ */}
        {tab === 'preferences' && (
          <div style={{animation:'ud-rise .4s ease both',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
            {/* Taste Profile */}
            <Card style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:4,height:20,borderRadius:999,background:GRAD.rose}}/>
                <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Your Taste Profile</h3>
              </div>
              {topG.length === 0 ? (
                <div style={{textAlign:'center',padding:'32px 0'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:8,animation:'ud-float 3s ease-in-out infinite'}}>❤️</div>
                  <p style={{color:T.muted,fontSize:'0.85rem',marginBottom:16}}>Book movies to discover your taste</p>
                  <button onClick={()=>navigate('movies')} style={{
                    background:GRAD.violet,color:'white',border:'none',
                    padding:'10px 24px',borderRadius:12,fontWeight:700,cursor:'pointer',
                    boxShadow:`0 4px 20px ${GLOW.violet}`,
                  }}>Browse Movies</button>
                </div>
              ) : (
                <>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
                    {topG.map(({genre,count})=>{
                      const cs = GCOL[genre] ?? {g:GRAD.violet,c:'#a78bfa',glow:GLOW.violet};
                      return (
                        <div key={genre} style={{
                          padding:'8px 16px',borderRadius:999,cursor:'default',
                          background:`${cs.c}18`,border:`1px solid ${cs.c}33`,
                          display:'flex',alignItems:'center',gap:8,
                          transition:'all .2s',boxShadow:`0 2px 12px ${cs.glow}`,
                        }}>
                          <span style={{color:cs.c,fontSize:'0.82rem',fontWeight:700}}>{genre}</span>
                          <span style={{
                            width:18,height:18,borderRadius:'50%',background:cs.g,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:'0.6rem',fontWeight:800,color:'white',
                            boxShadow:`0 2px 8px ${cs.glow}`,
                          }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    {topG.map(({genre,count})=>{
                      const cs = GCOL[genre] ?? {g:GRAD.violet,c:'#a78bfa',glow:GLOW.violet};
                      const maxC = topG[0].count;
                      return (
                        <div key={genre} style={{marginBottom:12}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                            <span style={{color:cs.c,fontSize:'0.75rem',fontWeight:700}}>{genre}</span>
                            <span style={{color:T.dim,fontSize:'0.66rem'}}>{count} booking{count!==1?'s':''}</span>
                          </div>
                          <div style={{height:7,background:'rgba(255,255,255,.05)',borderRadius:999,overflow:'hidden'}}>
                            <div style={{
                              height:'100%',width:`${(count/maxC)*100}%`,borderRadius:999,
                              background:cs.g,transition:'width 1.1s cubic-bezier(.23,1,.32,1)',
                              boxShadow:`0 0 10px ${cs.glow}`,
                            }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Recommendations */}
            <Card style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:4,height:20,borderRadius:999,background:GRAD.violet}}/>
                <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Recommended for You</h3>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {movies.filter(m=>m.isNowShowing).slice(0,5).map((m,i)=>(
                  <div key={m.id}
                    onClick={()=>selectMovie(m)}
                    style={{
                      display:'flex',gap:12,padding:'12px',borderRadius:12,cursor:'pointer',
                      background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                      transition:'all .2s',animation:`ud-rise .4s ease ${i*60}ms both`,
                    }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.08)';(e.currentTarget as HTMLElement).style.borderColor='rgba(124,58,237,.25)';(e.currentTarget as HTMLElement).style.transform='translateX(4px)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.06)';(e.currentTarget as HTMLElement).style.transform='translateX(0)';}}
                  >
                    <img src={m.poster} alt={m.title} style={{width:42,height:58,borderRadius:8,objectFit:'cover',flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,.5)'}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:T.text,fontWeight:700,fontSize:'0.82rem',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title}</p>
                      <p style={{color:T.muted,fontSize:'0.68rem',marginBottom:5}}>{m.genre.slice(0,2).join(' · ')}</p>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.62rem',padding:'2px 8px',borderRadius:999,background:'rgba(251,191,36,.1)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.2)',fontWeight:700}}>★ {m.rating}</span>
                        {m.isTrending && <span style={{fontSize:'0.62rem',padding:'2px 8px',borderRadius:999,background:'rgba(244,63,94,.1)',color:'#fb7185',border:'1px solid rgba(244,63,94,.2)',fontWeight:700}}>🔥 Hot</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>navigate('movies')} style={{
                width:'100%',marginTop:14,padding:'11px',borderRadius:12,cursor:'pointer',
                background:'rgba(124,58,237,.08)',border:'1px solid rgba(124,58,237,.2)',
                color:'#a78bfa',fontWeight:700,fontSize:'0.82rem',transition:'all .2s',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.18)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.08)';}}
              >
                See All Movies <I.ChevR/>
              </button>
            </Card>
          </div>
        )}

        {/* ═══ SETTINGS ═══════════════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div style={{animation:'ud-rise .4s ease both',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
            {/* Account Details */}
            <Card style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:4,height:20,borderRadius:999,background:GRAD.emerald}}/>
                <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Account Details</h3>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  {label:'Full Name',    value:currentUser.name,    icon:<I.User/>,     c:'#a78bfa'},
                  {label:'Email',        value:currentUser.email,   icon:<I.Zap/>,      c:'#67e8f9'},
                  {label:'Phone',        value:currentUser.phone,   icon:<I.Bell/>,     c:'#4ade80'},
                  {label:'City',         value:currentUser.city,    icon:<I.MapPin/>,   c:'#fbbf24'},
                  {label:'Member Since', value:new Date(currentUser.joinDate).toLocaleDateString('en-IN',{year:'numeric',month:'long'}), icon:<I.Calendar/>, c:'#fb7185'},
                  {label:'Account Type', value:currentUser.role.replace('_',' ').toUpperCase(), icon:<I.Award/>, c:'#e879f9'},
                ].map(f=>(
                  <div key={f.label} style={{
                    display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                    background:'rgba(255,255,255,.03)',borderRadius:12,
                    border:'1px solid rgba(255,255,255,.06)',
                    transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.06)';(e.currentTarget as HTMLElement).style.borderColor=`${f.c}22`;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.06)';}}
                  >
                    <div style={{
                      width:34,height:34,borderRadius:10,flexShrink:0,
                      background:`${f.c}18`,border:`1px solid ${f.c}33`,
                      display:'flex',alignItems:'center',justifyContent:'center',color:f.c,
                    }}>{f.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:T.dim,fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>{f.label}</p>
                      <p style={{color:T.text,fontSize:'0.84rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Privacy Settings */}
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.violet}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Privacy</h3>
                  {(currentUser as any).isPrivate && (
                    <span style={{marginLeft:'auto',padding:'3px 10px',borderRadius:999,background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#a78bfa',fontSize:'0.68rem',fontWeight:700}}>🔒 PRIVATE</span>
                  )}
                </div>
                {/* Privacy toggle row */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'rgba(255,255,255,0.03)',borderRadius:14,border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{flex:1,minWidth:0,paddingRight:16}}>
                    <p style={{color:T.text,fontWeight:700,fontSize:'0.88rem',marginBottom:4}}>Private Account</p>
                    <p style={{color:T.muted,fontSize:'0.74rem',lineHeight:1.45}}>
                      {isPrivate
                        ? '🔒 Your profile is hidden from booking lists. Other users cannot message you.'
                        : '🌐 Your profile is visible to users attending the same shows. They can message you.'}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    id="privacy-toggle"
                    onClick={handlePrivacyToggle}
                    disabled={privacySaving}
                    style={{
                      width:52,height:30,borderRadius:999,flexShrink:0,
                      background:isPrivate?GRAD.violet:'rgba(255,255,255,0.08)',
                      border:`1px solid ${isPrivate?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.12)'}`,
                      cursor:privacySaving?'not-allowed':'pointer',
                      position:'relative',transition:'all 0.3s',
                      boxShadow:isPrivate?`0 0 18px rgba(124,58,237,0.45)`:'none',
                      opacity:privacySaving?0.6:1,
                    }}
                  >
                    <div style={{
                      position:'absolute',top:3,width:22,height:22,borderRadius:'50%',
                      background:'white',transition:'left 0.3s',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.35)',
                      left:isPrivate?26:4,
                    }}/>
                  </button>
                </div>
                {/* Info note */}
                <div style={{marginTop:12,padding:'10px 14px',borderRadius:12,background:'rgba(124,58,237,0.05)',border:'1px dashed rgba(124,58,237,0.2)'}}>
                  <p style={{color:'#7c3aed',fontSize:'0.7rem',fontWeight:600,lineHeight:1.5}}>
                    💡 When Private:
                    You won't appear in the "Who's Going?" list for any show,
                    your profile is blocked, and direct messages are disabled.
                  </p>
                </div>
              </Card>
              {/* Notifications */}
              <Card style={{padding:24}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.cyan}}/>
                  <h3 style={{color:T.text,fontWeight:800,fontSize:'0.95rem'}}>Notifications</h3>
                </div>
                {[
                  {l:'Booking Confirmations',    on:true,  c:'#67e8f9'},
                  {l:'Upcoming Show Reminders',  on:true,  c:'#a78bfa'},
                  {l:'Exclusive Offers',         on:false, c:'#fbbf24'},
                  {l:'New Movie Alerts',         on:true,  c:'#4ade80'},
                ].map(n=>(
                  <div key={n.l} style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,.05)',
                  }}>
                    <span style={{color:T.muted,fontSize:'0.82rem'}}>{n.l}</span>
                    <div style={{
                      width:42,height:24,borderRadius:999,position:'relative',cursor:'pointer',
                      background:n.on?`linear-gradient(135deg,${n.c},${n.c}88)`:'rgba(255,255,255,.08)',
                      border:`1px solid ${n.on?n.c+'44':'rgba(255,255,255,.12)'}`,
                      transition:'all .3s',
                      boxShadow:n.on?`0 0 16px ${n.c}44`:'none',
                    }}>
                      <div style={{
                        position:'absolute',top:3,width:16,height:16,borderRadius:'50%',
                        background:'white',transition:'left .3s',boxShadow:'0 2px 6px rgba(0,0,0,.3)',
                        left:n.on?22:3,
                      }}/>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Actions */}
              <Card style={{padding:20}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <div style={{width:4,height:20,borderRadius:999,background:GRAD.rose}}/>
                  <h3 style={{color:'#fb7185',fontWeight:800,fontSize:'0.9rem'}}>Account Actions</h3>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <button onClick={()=>navigate('my-bookings')} style={{
                    padding:'11px 16px',borderRadius:10,cursor:'pointer',
                    background:'rgba(124,58,237,.06)',border:'1px solid rgba(124,58,237,.15)',
                    color:'#a78bfa',fontWeight:600,fontSize:'0.82rem',textAlign:'left',
                    display:'flex',alignItems:'center',gap:8,transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.15)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.06)';}}
                  ><I.Ticket/>View All Tickets</button>
                  <button onClick={()=>navigate('offers')} style={{
                    padding:'11px 16px',borderRadius:10,cursor:'pointer',
                    background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',
                    color:'#fbbf24',fontWeight:600,fontSize:'0.82rem',textAlign:'left',
                    display:'flex',alignItems:'center',gap:8,transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(245,158,11,.15)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(245,158,11,.06)';}}
                  ><I.Gift/>Browse Offers</button>
                  <button onClick={()=>{logout();}} style={{
                    padding:'11px 16px',borderRadius:10,cursor:'pointer',
                    background:'rgba(244,63,94,.06)',border:'1px solid rgba(244,63,94,.15)',
                    color:'#fb7185',fontWeight:600,fontSize:'0.82rem',textAlign:'left',
                    display:'flex',alignItems:'center',gap:8,transition:'all .2s',
                  }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(244,63,94,.15)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(244,63,94,.06)';}}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ THEATRE EXPERIENCE ══════════════════════════════════════════ */}
        {tab === 'theatre' && (() => {
          // Get unique theatres from the user's bookings
          const theatreBookings: Record<string,any> = {};
          const userBookings = bookings ?? [];
          userBookings.forEach((b: any) => {
            if (b.theatreId && !theatreBookings[b.theatreId]) {
              theatreBookings[b.theatreId] = b;
            }
          });
          const bookedTheatres = Object.values(theatreBookings);

          return (
            <div style={{ animation: 'ud-rise .4s ease both', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* ── Section Header ── */}
              <Card style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 18,
                    background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.2))',
                    border: '1px solid rgba(168,85,247,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    boxShadow: '0 0 24px rgba(168,85,247,0.25)',
                  }}>👁</div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.3px' }}>Theatre Experience</div>
                    <div style={{ color: 'rgba(168,85,247,0.8)', fontSize: 13, fontWeight: 600, marginTop: 3 }}>Preview seats in 2D, 3D and 360° — just like a theatre owner set them up</div>
                  </div>
                  <div style={{ marginLeft: 'auto', padding: '6px 14px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 100, fontSize: 11, color: '#c084fc', fontWeight: 800 }}>LIVE FROM DB</div>
                </div>
              </Card>

              {/* ── Booked Theatres Quick-Load ── */}
              {bookedTheatres.length > 0 && (
                <Card style={{ padding: '20px 24px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>Your Booked Theatres</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {bookedTheatres.slice(0, 8).map((b: any) => (
                      <button
                        key={b.theatreId}
                        onClick={async () => {
                          setTheatreViewId(b.theatreId);
                          setTheatreViewLoading(true);
                          setTheatreViewData(null);
                          const res = await apiGetTheatreSeatView(b.theatreId);
                          setTheatreViewLoading(false);
                          if (res.ok && res.data?.seatViewData) {
                            setTheatreViewData(res.data.seatViewData);
                            setTheatreViewName(res.data.theatreName || b.theatreName || 'Theatre');
                          } else {
                            setTheatreViewName(b.theatreName || 'Theatre');
                          }
                        }}
                        style={{
                          padding: '9px 16px', borderRadius: 100,
                          background: theatreViewId === b.theatreId ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.2))' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${theatreViewId === b.theatreId ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          color: theatreViewId === b.theatreId ? '#c084fc' : 'rgba(255,255,255,0.6)',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          fontFamily: "'Outfit',sans-serif",
                          transition: 'all 0.2s ease',
                        }}
                      >
                        🎭 {b.theatreName || 'Theatre'}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Manual Theatre ID Search ── */}
              <Card style={{ padding: '20px 24px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>Load Theatre View by ID</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Paste Theatre ID…"
                    value={theatreViewId}
                    onChange={e => setTheatreViewId(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 12,
                      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.2)',
                      color: 'white', fontSize: 13, outline: 'none', fontFamily: "'Outfit',sans-serif",
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!theatreViewId.trim()) return;
                      setTheatreViewLoading(true);
                      setTheatreViewData(null);
                      const res = await apiGetTheatreSeatView(theatreViewId.trim());
                      setTheatreViewLoading(false);
                      if (res.ok && res.data?.seatViewData) {
                        setTheatreViewData(res.data.seatViewData);
                        setTheatreViewName(res.data.theatreName || 'Theatre');
                      } else {
                        setTheatreViewName('No view data found — the theatre owner hasn\'t uploaded panoramas yet');
                      }
                    }}
                    style={{
                      padding: '10px 22px', borderRadius: 12, cursor: 'pointer',
                      background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                      border: 'none', color: 'white', fontWeight: 800, fontSize: 13,
                      fontFamily: "'Outfit',sans-serif",
                      boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                    }}
                  >
                    {theatreViewLoading ? '⏳ Loading…' : '👁 Load View'}
                  </button>
                </div>
              </Card>

              {/* ── View Data Display ── */}
              {theatreViewLoading && (
                <Card style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12, animation: 'ud-spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
                  <div style={{ color: 'rgba(168,85,247,0.8)', fontWeight: 700 }}>Loading theatre view data from server…</div>
                </Card>
              )}

              {!theatreViewLoading && theatreViewData && (
                <Card style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 22 }}>🎭</span>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', fontFamily: "'Outfit',sans-serif" }}>{theatreViewName}</div>
                    <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, color: '#4ade80', fontSize: 11, fontWeight: 800 }}>✓ DATA LOADED</div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                      { label: '2D Layout', ready: !!theatreViewData.view2DImage, icon: '🗺', color: '#60a5fa' },
                      { label: '3D View',   ready: true,                              icon: '🎭', color: '#a78bfa' },
                      { label: '360° View', ready: !!theatreViewData.panoramaImage,  icon: '🌐', color: '#f472b6' },
                    ].map(v => (
                      <div key={v.label} style={{
                        flex: 1, minWidth: 120, padding: '16px', borderRadius: 14, textAlign: 'center',
                        background: v.ready ? `rgba(${v.color === '#60a5fa' ? '96,165,250' : v.color === '#a78bfa' ? '167,139,250' : '244,114,182'},0.08)` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${v.ready ? v.color + '44' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
                        <div style={{ color: v.ready ? v.color : '#475569', fontWeight: 800, fontSize: 13 }}>{v.label}</div>
                        <div style={{ color: v.ready ? '#4ade80' : '#ef4444', fontSize: 11, fontWeight: 700, marginTop: 4 }}>{v.ready ? '✓ Ready' : '✗ Not uploaded'}</div>
                      </div>
                    ))}
                  </div>

                  {theatreViewData.view2DImage && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>🗺 2D Theatre Layout</div>
                      <img
                        src={theatreViewData.view2DImage}
                        alt="Theatre Layout"
                        style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(96,165,250,0.2)' }}
                      />
                    </div>
                  )}

                  {theatreViewData.panoramaImage && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#f472b6', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>🌐 360° Panorama View</div>
                      <img
                        src={theatreViewData.panoramaImage}
                        alt="360° Panorama"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(244,114,182,0.2)' }}
                      />
                      <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>Drag and rotate on seat selection page to get a full immersive 360° view</div>
                    </div>
                  )}

                  {theatreViewData.seatViewMapping?.length > 0 && (
                    <div>
                      <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>🗺 Row Distance Mapping</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {theatreViewData.seatViewMapping.map((m: any) => (
                          <div key={m.rowPrefix} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 900, fontSize: 12 }}>{m.rowPrefix}</div>
                            {m.distance && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📏 {m.distance}m</span>}
                            {m.angle    && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📐 {m.angle}°</span>}
                            {m.panoramaImage && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>✓ Custom Panorama</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>When booking, click any seat to preview the exact 2D/3D/360° view from that position before confirming.</span>
                  </div>
                </Card>
              )}

              {!theatreViewLoading && !theatreViewData && theatreViewId && (
                <Card style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 15 }}>No view data for this theatre yet</div>
                  <div style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>The theatre owner hasn't uploaded panorama images yet. Once they do, you'll see a full 2D / 3D / 360° preview here.</div>
                </Card>
              )}

              {!theatreViewId && !theatreViewData && (
                <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.4))' }}>👁</div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Seat Eye View</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>Click any of your booked theatres above to instantly preview the 2D layout, 3D render, and 360° panorama uploaded by the theatre owner.</div>
                </Card>
              )}
            </div>
          );
        })()}

        {/* ═══ SOCIAL ══════════════════════════════════════════════════════════ */}
        {tab === 'social' && (
          <SocialTab
            currentUser={currentUser}
            isPrivate={isPrivate}
            onLoadFollowers={async () => { setSocialLoading(true); const r = await apiGetFollowers(); setSocialLoading(false); if(r.ok&&r.data) setFollowers(r.data.followers); }}
            onLoadFollowing={async () => { setSocialLoading(true); const r = await apiGetFollowing(); setSocialLoading(false); if(r.ok&&r.data) setFollowing(r.data.following); }}
            onLoadRequests={async () => { setSocialLoading(true); const r = await apiGetFollowRequests(); setSocialLoading(false); if(r.ok&&r.data) setFollowReqs(r.data.requests); }}
            followers={followers} following={following} followReqs={followReqs}
            socialLoading={socialLoading}
            onViewProfile={setProfileModal}
            onAccept={async(uid)=>{ await apiAcceptFollowRequest(uid); setFollowReqs(prev=>prev.filter(u=>u.id!==uid)); }}
            onReject={async(uid)=>{ await apiRejectFollowRequest(uid); setFollowReqs(prev=>prev.filter(u=>u.id!==uid)); }}
            onUnfollow={async(uid)=>{ await apiUnfollowUser(uid); setFollowing(prev=>prev.filter(u=>u.id!==uid)); }}
            onMessages={()=>setMsgHubOpen(true)}
          />
        )}

      </div>

      {/* Profile Modal */}
      {profileModal && (
        <UserProfileModal userId={profileModal} onClose={() => setProfileModal(null)} />
      )}

      {/* Messaging Hub slideover */}
      {msgHubOpen && currentUser && (
        <MessagingHub
          currentUserId={currentUser.id}
          onClose={() => setMsgHubOpen(false)}
        />
      )}
    </>
  );
};
