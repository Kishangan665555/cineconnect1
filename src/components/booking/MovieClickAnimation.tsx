import React, { useEffect, useRef, useState } from 'react';

interface Props {
  active: boolean;
  posterSrc: string;
  title: string;
  onComplete: () => void;
}

/**
 * Full-screen cinematic animation that plays when a user clicks a movie card.
 * Layers:
 *  1. Deep void flash (white → black)
 *  2. Film-strip reel spinning in from below
 *  3. Movie poster zooming into centre with 3D perspective
 *  4. Spotlight cones sweeping left/right
 *  5. Particle burst (stars, confetti, film frames)
 *  6. Title & "Book Tickets →" text flying in
 *  7. Curtain reveal (red → split open)
 */
const MovieClickAnimation: React.FC<Props> = ({ active, posterSrc, title, onComplete }) => {
  const [phase, setPhase] = useState(0); // 0=idle 1=flash 2=main 3=curtain 4=done
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clear = () => timers.current.forEach(clearTimeout);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    clear();
    setPhase(1);
    timers.current.push(setTimeout(() => setPhase(2), 120));
    timers.current.push(setTimeout(() => setPhase(3), 1800));
    timers.current.push(setTimeout(() => { setPhase(4); onComplete(); }, 2500));
    return clear;
  }, [active]);

  // Canvas particle burst
  useEffect(() => {
    if (phase !== 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; color: string;
      life: number; maxLife: number;
      type: 'star' | 'rect' | 'circle';
      rot: number; rotSpeed: number;
    }

    const colors = ['#e53935','#ffd700','#9c27b0','#00bcd4','#ff9800','#ffffff','#ff4081'];
    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120 + (Math.random() - 0.5) * 0.3;
      const speed = 4 + Math.random() * 14;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        size: 3 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0, maxLife: 60 + Math.random() * 60,
        type: ['star','rect','circle'][Math.floor(Math.random() * 3)] as any,
        rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.3,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive = true;
        p.x  += p.vx; p.vx *= 0.97;
        p.y  += p.vy; p.vy += 0.25; // gravity
        p.rot += p.rotSpeed;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.type === 'star') {
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = j % 2 === 0 ? p.size : p.size * 0.4;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath(); ctx.fill();
        } else if (p.type === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (!active && phase === 0) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        pointerEvents: phase < 4 ? 'all' : 'none',
        transition: 'opacity 0.4s',
        opacity: phase === 4 ? 0 : 1,
      }}
    >
      {/* ── Phase 1: Flash ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'white',
        opacity: phase === 1 ? 0.95 : 0,
        transition: 'opacity 0.12s',
        zIndex: 1,
      }} />

      {/* ── Deep void bg ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, #0a0015 0%, #000000 100%)',
        zIndex: 0,
      }} />

      {/* ── Spotlight left ── */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', bottom: 0, left: '15%',
          width: 0, height: 0,
          borderLeft: '180px solid transparent',
          borderRight: '180px solid transparent',
          borderBottom: '100vh solid rgba(255,220,0,0.06)',
          zIndex: 2,
          animation: 'spotlightSwing 2.2s ease-in-out infinite alternate',
          transformOrigin: 'bottom center',
        }} />
      )}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', bottom: 0, right: '15%',
          width: 0, height: 0,
          borderLeft: '180px solid transparent',
          borderRight: '180px solid transparent',
          borderBottom: '100vh solid rgba(229,57,53,0.07)',
          zIndex: 2,
          animation: 'spotlightSwingR 2.2s ease-in-out infinite alternate',
          transformOrigin: 'bottom center',
        }} />
      )}

      {/* ── Film strip reel top ── */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 56, zIndex: 4,
          display: 'flex', alignItems: 'center',
          background: 'linear-gradient(90deg,#1a0a00,#2d1800,#1a0a00)',
          animation: 'reelSlideDown 0.4s cubic-bezier(0.22,1,0.36,1) both',
          overflow: 'hidden',
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              flex: '0 0 52px', height: 40,
              margin: '0 4px', borderRadius: 3,
              border: '2px solid #3d2a00',
              background: i % 3 === 0
                ? `linear-gradient(135deg,#e53935,#7b1fa2)`
                : i % 3 === 1
                  ? 'rgba(255,193,7,0.15)'
                  : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'rgba(255,255,255,0.5)',
            }}>
              {i % 5 === 0 ? '🎬' : ''}
            </div>
          ))}
          <style>{`
            @keyframes reelSlideDown {
              from { transform: translateY(-100%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* ── Film strip reel bottom ── */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 56, zIndex: 4,
          display: 'flex', alignItems: 'center',
          background: 'linear-gradient(90deg,#1a0a00,#2d1800,#1a0a00)',
          animation: 'reelSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
          overflow: 'hidden',
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              flex: '0 0 52px', height: 40,
              margin: '0 4px', borderRadius: 3,
              border: '2px solid #3d2a00',
              background: i % 4 === 0
                ? 'linear-gradient(135deg,#1565c0,#0d47a1)'
                : 'rgba(255,255,255,0.03)',
            }} />
          ))}
          <style>{`
            @keyframes reelSlideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* ── Canvas particles ── */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />

      {/* ── Poster 3D zoom ── */}
      {phase >= 2 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 6,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Red glow orb behind poster */}
          <div style={{
            position: 'absolute',
            width: 380, height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(229,57,53,0.35) 0%,transparent 70%)',
            filter: 'blur(50px)',
            animation: 'orbPulse 1.5s ease-in-out infinite alternate',
          }} />

          {/* Poster */}
          <div style={{
            position: 'relative',
            animation: 'posterZoom3D 0.7s cubic-bezier(0.22,1,0.36,1) both',
            marginBottom: 28,
          }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -12,
              borderRadius: 24, zIndex: -1,
              background: 'linear-gradient(135deg,#e53935,#9c27b0,#1976d2,#e53935)',
              backgroundSize: '300% 300%',
              animation: 'borderSpin 2s linear infinite',
              filter: 'blur(8px)',
              opacity: 0.8,
            }} />
            <img
              src={posterSrc}
              alt={title}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              style={{
                width: 160, height: 220,
                objectFit: 'cover',
                borderRadius: 16,
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: '0 20px 80px rgba(229,57,53,0.6), 0 40px 120px rgba(0,0,0,0.8)',
                display: 'block',
              }}
            />
            {/* Shine sweep */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: 14,
              background: 'linear-gradient(135deg,rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.4) 50%,rgba(255,255,255,0.0) 100%)',
              backgroundSize: '200% 200%',
              animation: 'shineSweep 1.5s ease-in-out infinite',
            }} />
          </div>

          {/* Title */}
          <div style={{
            textAlign: 'center',
            animation: 'titleRise 0.6s 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem', fontWeight: 900,
              letterSpacing: '-0.5px',
              textShadow: '0 0 30px rgba(229,57,53,0.9), 0 0 60px rgba(229,57,53,0.4)',
              marginBottom: 8, maxWidth: 320, lineHeight: 1.2,
            }}>
              {title}
            </h2>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#e53935,#b71c1c)',
              color: 'white', fontWeight: 800,
              padding: '10px 28px', borderRadius: 50,
              fontSize: '0.95rem',
              boxShadow: '0 8px 32px rgba(229,57,53,0.6), 0 4px 0 #7f0000',
              animation: 'btnPop 0.5s 0.5s cubic-bezier(0.22,1,0.36,1) both',
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎟️</span>
              Booking Tickets…
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 3: Red curtains close ── */}
      {phase >= 3 && (
        <>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            left: 0, right: '50%',
            background: 'linear-gradient(90deg,#b71c1c,#e53935)',
            animation: 'curtainLeft 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            left: '50%', right: 0,
            background: 'linear-gradient(90deg,#e53935,#b71c1c)',
            animation: 'curtainRight 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }} />
        </>
      )}

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes spotlightSwing  { from { transform: rotate(-12deg); } to { transform: rotate(12deg); } }
        @keyframes spotlightSwingR { from { transform: rotate(12deg);  } to { transform: rotate(-12deg); } }
        @keyframes orbPulse        { from { transform: scale(1);   opacity:0.7; } to { transform: scale(1.2); opacity:1; } }
        @keyframes posterZoom3D {
          from { transform: perspective(800px) scale(0.2) rotateY(-30deg) translateZ(-200px); opacity:0; }
          to   { transform: perspective(800px) scale(1)   rotateY(0deg)   translateZ(0);     opacity:1; }
        }
        @keyframes titleRise {
          from { transform: translateY(40px); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes btnPop {
          from { transform: scale(0.5); opacity:0; }
          60%  { transform: scale(1.1); }
          to   { transform: scale(1);   opacity:1; }
        }
        @keyframes borderSpin {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes shineSweep {
          0%   { background-position: -200% -200%; }
          100% { background-position:  200%  200%; }
        }
        @keyframes curtainLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes curtainRight { from { transform: translateX(100%);  } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default MovieClickAnimation;
