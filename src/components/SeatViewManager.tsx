/**
 * SeatViewManager.tsx  –  Theatre Owner Control Panel (Premium Redesign)
 * All logic unchanged. UI completely transformed to a cinematic, glassmorphism design.
 */
import React, { useState, useRef } from 'react';
import { TheatreViewData } from './SeatExperienceModal';

interface Props {
  theatreId: string;
  theatreName: string;
  rows: number;
  onSave: (data: TheatreViewData) => void;
  initial?: TheatreViewData;
}

type ProcessState = 'idle' | 'processing' | 'done' | 'error';
type Section = 'upload' | 'mapping' | 'preview';

// ─── Auto 360° stitcher (logic unchanged) ─────────────────────────────────────
async function stitchImages(images: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (images.length === 0) { reject('No images'); return; }
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        imgs[i] = img;
        loaded++;
        if (loaded === images.length) {
          const totalW = Math.max(1800, images.length * 600);
          const totalH = totalW / 2;
          const canvas = document.createElement('canvas');
          canvas.width = totalW; canvas.height = totalH;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, totalW, totalH);
          const sliceW = totalW / images.length;
          imgs.forEach((image, idx) => {
            const sx = idx * sliceW;
            ctx.drawImage(image, sx, 0, sliceW, totalH);
            if (idx > 0) {
              const blendW = Math.min(sliceW * 0.15, 80);
              const grad = ctx.createLinearGradient(sx, 0, sx + blendW, 0);
              grad.addColorStop(0, 'rgba(10,10,26,0.8)'); grad.addColorStop(1, 'rgba(10,10,26,0)');
              ctx.fillStyle = grad; ctx.fillRect(sx, 0, blendW, totalH);
            }
          });
          const blendW = Math.min(sliceW * 0.1, 60);
          const wrapGrad = ctx.createLinearGradient(totalW - blendW, 0, totalW, 0);
          wrapGrad.addColorStop(0, 'rgba(10,10,26,0)'); wrapGrad.addColorStop(1, 'rgba(10,10,26,0.9)');
          ctx.fillStyle = wrapGrad; ctx.fillRect(totalW - blendW, 0, blendW, totalH);
          const topGrad = ctx.createLinearGradient(0, 0, 0, totalH * 0.3);
          topGrad.addColorStop(0, 'rgba(0,0,20,0.7)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = topGrad; ctx.fillRect(0, 0, totalW, totalH * 0.3);
          const botGrad = ctx.createLinearGradient(0, totalH * 0.7, 0, totalH);
          botGrad.addColorStop(0, 'rgba(0,0,0,0)'); botGrad.addColorStop(1, 'rgba(0,0,20,0.8)');
          ctx.fillStyle = botGrad; ctx.fillRect(0, totalH * 0.7, totalW, totalH * 0.3);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        }
      };
      img.onerror = () => reject(`Failed to load image ${i}`);
      img.src = src;
    });
  });
}

// ─── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap');
@keyframes svm-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes svm-fade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes svm-glow  { 0%,100%{box-shadow:0 0 18px rgba(168,85,247,0.35)} 50%{box-shadow:0 0 32px rgba(168,85,247,0.65)} }
@keyframes svm-spin  { to{transform:rotate(360deg)} }
@keyframes svm-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
@keyframes svm-bar   { from{width:0%} to{width:var(--w)} }

.svm-root { font-family:'Outfit',sans-serif; }
.svm-card { animation: svm-fade 0.45s cubic-bezier(0.34,1.3,0.64,1) both; }
.svm-hover-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
.svm-hover-lift:hover { transform: translateY(-4px) scale(1.02); }
.svm-pill-btn { cursor:pointer; transition: all 0.22s cubic-bezier(0.34,1.4,0.64,1); border:none; font-family:'Outfit',sans-serif; }
.svm-pill-btn:hover { transform: translateY(-2px) scale(1.05); }
.svm-upload-zone { cursor:pointer; transition: all 0.22s ease; }
.svm-upload-zone:hover { border-color: rgba(168,85,247,0.7) !important; background: rgba(168,85,247,0.07) !important; transform: translateY(-2px); }
.svm-tab-btn { cursor:pointer; transition:all 0.2s; border:none; font-family:'Outfit',sans-serif; }
.svm-img-card { position:relative; overflow:hidden; transition: transform 0.25s, box-shadow 0.25s; }
.svm-img-card:hover { transform: scale(1.03); box-shadow: 0 0 18px rgba(168,85,247,0.4); }
.svm-save-btn { cursor:pointer; transition: all 0.28s cubic-bezier(0.34,1.4,0.64,1); border:none; font-family:'Outfit',sans-serif; }
.svm-save-btn:hover { transform:translateY(-3px) scale(1.03); box-shadow:0 12px 32px rgba(99,102,241,0.55) !important; }
.svm-seat-dot { display:inline-block; width:7px; height:7px; border-radius:2px; }
.svm-spinner { animation: svm-spin 1s linear infinite; display:inline-block; }
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ value: number; label: string; color?: string }> = ({ value, label, color = '#a855f7' }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{Math.round(value)}%</span>
    </div>
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${value}%`, borderRadius: 100,
        background: `linear-gradient(90deg,${color}88,${color})`,
        transition: 'width 0.3s ease',
        boxShadow: `0 0 10px ${color}88`,
      }} />
    </div>
  </div>
);

const ImageCard: React.FC<{ src: string; label: string; onRemove?: () => void }> = ({ src, label, onRemove }) => (
  <div className="svm-img-card" style={{ borderRadius: 14, border: '1px solid rgba(168,85,247,0.2)', background: '#080818' }}>
    <img src={src} alt={label} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', borderRadius: '14px 14px 0 0' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,20,0.75) 0%, transparent 55%)', borderRadius: 14 }} />
    <div style={{ position: 'absolute', bottom: 7, left: 10, color: '#e2e8f0', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>{label}</div>
    {onRemove && (
      <button onClick={onRemove} className="svm-pill-btn" style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    )}
  </div>
);

const UploadZone: React.FC<{
  label: string; hint: string; multiple?: boolean; accept?: string;
  onFiles: (files: File[]) => void; processing?: boolean;
}> = ({ label, hint, multiple, accept = 'image/*', onFiles, processing }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handleFiles = (files: FileList | null) => { if (!files) return; onFiles(Array.from(files)); };
  return (
    <div
      className="svm-upload-zone"
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      style={{
        border: `2px dashed ${drag ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.25)'}`,
        borderRadius: 16, padding: '22px 16px', textAlign: 'center',
        background: drag ? 'rgba(168,85,247,0.08)' : 'rgba(99,102,241,0.03)',
      }}
    >
      <div style={{ fontSize: 30, marginBottom: 8 }}>{processing ? <span className="svm-spinner">⚙️</span> : '📁'}</div>
      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#64748b', fontSize: 11 }}>{hint}</div>
      <input ref={fileRef} type="file" accept={accept} multiple={multiple} hidden onChange={e => handleFiles(e.target.files)} />
    </div>
  );
};

const RowMappingEditor: React.FC<{
  rows: number;
  mapping: NonNullable<TheatreViewData['seatViewMapping']>;
  onChange: (m: NonNullable<TheatreViewData['seatViewMapping']>) => void;
}> = ({ rows, mapping, onChange }) => {
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, rows);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rowLabels.split('').map(row => {
        const entry = mapping.find((m: NonNullable<TheatreViewData['seatViewMapping']>[number]) => m.rowPrefix === row) ?? { rowPrefix: row };
        const inputStyle: React.CSSProperties = {
          width: 100, padding: '7px 10px', borderRadius: 10,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(168,85,247,0.2)',
          color: 'white', fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: 'none',
        };
        return (
          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 900, fontSize: 12, flexShrink: 0 }}>
              {row}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="number" placeholder="Distance (m)" value={entry.distance ?? ''}
                onChange={e => { const val = parseFloat(e.target.value); const updated = mapping.filter((m: NonNullable<TheatreViewData['seatViewMapping']>[number]) => m.rowPrefix !== row); onChange([...updated, { ...entry, distance: isNaN(val) ? undefined : val }]); }}
                style={inputStyle} />
              <input type="number" placeholder="Angle (°)" value={entry.angle ?? ''}
                onChange={e => { const val = parseFloat(e.target.value); const updated = mapping.filter((m: NonNullable<TheatreViewData['seatViewMapping']>[number]) => m.rowPrefix !== row); onChange([...updated, { ...entry, angle: isNaN(val) ? undefined : val }]); }}
                style={{ ...inputStyle, width: 80 }} />
              {entry.panoramaImage && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>✓ Panorama</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Decorative seat grid background ─────────────────────────────────────────
const SeatGrid: React.FC = () => {
  const cols = 14; const rowsG = 8;
  const colors = ['#22c55e', '#22c55e', '#22c55e', '#ef4444', '#f97316', '#22c55e', '#22c55e'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '24px 16px', alignItems: 'center' }}>
        {Array.from({ length: rowsG }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} style={{ width: 18, height: 14, borderRadius: 4, background: colors[(r * cols + c) % colors.length], boxShadow: `0 0 6px ${colors[(r * cols + c) % colors.length]}` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Preview card ──────────────────────────────────────────────────────────────
const ViewPreviewCard: React.FC<{ label: string; icon: string; color: string; image?: string; accent: string }> = ({ label, icon, color, image, accent }) => (
  <div className="svm-hover-lift" style={{ flex: 1, minWidth: 140, borderRadius: 18, overflow: 'hidden', border: `1px solid ${accent}33`, background: 'rgba(10,10,30,0.7)', backdropFilter: 'blur(12px)', position: 'relative' }}>
    <div style={{ height: 110, background: image ? 'transparent' : `linear-gradient(135deg,${accent}18,#0a0a1e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {image
        ? <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }} />
        : <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 8px ' + accent + ')' }}>{icon}</div>
      }
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(0,0,20,0.65) 0%, transparent 60%)` }} />
    </div>
    <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color, fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 15 }}>{icon}</span>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const SeatViewManager: React.FC<Props> = ({ theatreId, theatreName, rows, onSave, initial }) => {
  const [data, setData]               = useState<TheatreViewData>(initial ?? { theatreId });
  const [uploadedImgs, setUploadedImgs] = useState<string[]>(initial?.uploadedImages ?? []);
  const [autoToggle, setAutoToggle]   = useState(true);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [progress360, setProgress360] = useState(0);
  const [saved, setSaved]             = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('upload');
  const [mapping, setMapping]         = useState<NonNullable<TheatreViewData['seatViewMapping']>>(initial?.seatViewMapping ?? []);
  const [activeView, setActiveView]   = useState<'2D' | '3D' | '360'>('2D');

  const readFile = (file: File): Promise<string> => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = e => res(e.target!.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  const handleLayoutUpload = async (files: File[]) => {
    if (!files[0]) return;
    const b64 = await readFile(files[0]);
    setData((prev: TheatreViewData) => ({ ...prev, view2DImage: b64 }));
  };

  const handlePanoramaUpload = async (files: File[]) => {
    if (!files[0]) return;
    const b64 = await readFile(files[0]);
    setData((prev: TheatreViewData) => ({ ...prev, panoramaImage: b64 }));
  };

  const handleMultiUpload = async (files: File[]) => {
    const bases = await Promise.all(files.map(readFile));
    const newImgs = [...uploadedImgs, ...bases];
    setUploadedImgs(newImgs);
    setData((prev: TheatreViewData) => ({ ...prev, uploadedImages: newImgs }));
    if (!autoToggle) return;
    setProcessState('processing'); setProgress360(0);
    try {
      for (let p = 5; p <= 60; p += 8) { await new Promise(r => setTimeout(r, 120)); setProgress360(p); }
      if (newImgs.length === 1) {
        setData((prev: TheatreViewData) => ({ ...prev, view2DImage: prev.view2DImage ?? newImgs[0] }));
        setProgress360(100);
      } else {
        const panorama = await stitchImages(newImgs);
        for (let p = 65; p <= 95; p += 6) { await new Promise(r => setTimeout(r, 80)); setProgress360(p); }
        setData((prev: TheatreViewData) => ({ ...prev, panoramaImage: panorama, uploadedImages: newImgs }));
        setProgress360(100);
      }
      setProcessState('done');
    } catch { setProcessState('error'); }
  };

  const handleSave = () => {
    onSave({ ...data, seatViewMapping: mapping, theatreId });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const imageCount = uploadedImgs.length;
  const recommendation = imageCount === 0 ? null
    : imageCount === 1 ? '✅ 1 image → 2D view + 2.5D parallax effect'
    : imageCount <= 3 ? `✅ ${imageCount} images → Partial 360° panorama`
    : `⭐ ${imageCount} images → Full 360° panorama`;

  const tabs: { id: Section; icon: string; label: string }[] = [
    { id: 'upload', icon: '📁', label: 'Upload Assets' },
    { id: 'mapping', icon: '🗺', label: 'Row Mapping' },
    { id: 'preview', icon: '👁', label: 'Preview' },
  ];

  const viewModes: { id: '2D' | '3D' | '360'; label: string; color: string; glow: string }[] = [
    { id: '2D',  label: '2D',   color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    { id: '3D',  label: '3D',   color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
    { id: '360', label: '360°', color: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="svm-root svm-card" style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#08081a 0%,#0d0d25 50%,#090918 100%)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 24,
        boxShadow: '0 0 0 1px rgba(168,85,247,0.08), 0 24px 64px rgba(0,0,0,0.8), 0 0 48px rgba(99,102,241,0.06)',
      }}>

        {/* Decorative seat grid BG */}
        <SeatGrid />

        {/* Gradient top bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#6366f1)', backgroundSize: '300% 100%' }} />

        {/* ── HEADER ── */}
        <div style={{ position: 'relative', padding: '22px 28px 0' }}>
          {/* Glow orb */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {/* Icon */}
            <div style={{ width: 52, height: 52, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 24px rgba(99,102,241,0.5), 0 8px 20px rgba(0,0,0,0.4)', flexShrink: 0, animation: 'svm-glow 3s ease-in-out infinite' }}>
              👁
            </div>
            <div>
              <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>
                Seat View Management
              </h3>
              <p style={{ color: 'rgba(168,85,247,0.7)', fontSize: 12, margin: 0, marginTop: 3, fontWeight: 600 }}>
                {theatreName} · Configure immersive seat previews
              </p>
            </div>

            {/* Auto AI Toggle */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 100, padding: '6px 14px 6px 10px' }}>
              <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>AUTO AI</span>
              <button onClick={() => setAutoToggle(p => !p)} style={{ width: 40, height: 22, borderRadius: 100, border: 'none', background: autoToggle ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.08)', cursor: 'pointer', padding: 0, position: 'relative', transition: 'background 0.3s', boxShadow: autoToggle ? '0 0 10px rgba(168,85,247,0.5)' : 'none' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: autoToggle ? 21 : 3, transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
              </button>
              <span style={{ color: autoToggle ? '#a78bfa' : '#475569', fontSize: 11, fontWeight: 800 }}>{autoToggle ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          {/* ── View mode toggle pills ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>Preview Mode:</span>
            {viewModes.map(v => (
              <button key={v.id} className="svm-pill-btn" onClick={() => setActiveView(v.id)}
                style={{
                  padding: '7px 18px', borderRadius: 100,
                  background: activeView === v.id ? `linear-gradient(135deg,${v.color}33,${v.color}18)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeView === v.id ? v.color + '88' : 'rgba(255,255,255,0.08)'}`,
                  color: activeView === v.id ? v.color : '#475569',
                  fontWeight: 800, fontSize: 12, letterSpacing: '0.06em',
                  boxShadow: activeView === v.id ? `0 0 16px ${v.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* ── 3 preview cards ── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <ViewPreviewCard label="2D View"  icon="🗺" color="#60a5fa" accent="#3b82f6" image={data.view2DImage} />
            <ViewPreviewCard label="3D View"  icon="🥽" color="#a78bfa" accent="#8b5cf6" />
            <ViewPreviewCard label="360° View" icon="🌐" color="#f472b6" accent="#ec4899" image={data.panoramaImage} />
          </div>

          {/* ── Select seat prompt ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Select a seat on the booking page to preview the theatre view from that position</span>
          </div>

          {/* Smart recommendation badge */}
          {recommendation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', borderRadius: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>{recommendation}</span>
            </div>
          )}
        </div>

        {/* ── SECTION TABS ── */}
        <div style={{ position: 'relative', padding: '0 28px', marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 4 }}>
            {tabs.map(t => (
              <button key={t.id} className="svm-tab-btn" onClick={() => setActiveSection(t.id)}
                style={{
                  flex: 1, padding: '9px 8px', borderRadius: 11,
                  background: activeSection === t.id ? 'linear-gradient(135deg,rgba(99,102,241,0.22),rgba(168,85,247,0.14))' : 'transparent',
                  color: activeSection === t.id ? '#a78bfa' : '#64748b',
                  fontWeight: 700, fontSize: 12,
                  boxShadow: activeSection === t.id ? 'inset 0 0 0 1px rgba(168,85,247,0.28)' : 'none',
                  letterSpacing: '0.02em',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT PANELS ── */}
        <div style={{ position: 'relative', padding: '18px 28px 28px' }}>

          {/* Upload section */}
          {activeSection === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'svm-fade 0.3s ease both' }}>

              {/* Multi-image 360° */}
              <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🌐</span>
                  <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>360° Panorama Images</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(168,85,247,0.18)', color: '#c084fc', fontSize: 10, padding: '3px 9px', borderRadius: 100, fontWeight: 800, letterSpacing: '0.06em' }}>AUTO-STITCH</span>
                </div>
                <UploadZone label="Upload Theatre Images" hint={autoToggle ? 'Upload 3+ images → Auto-generates 360° panorama' : 'Upload multiple images manually'} multiple onFiles={handleMultiUpload} processing={processState === 'processing'} />

                {processState === 'processing' && (
                  <div style={{ marginTop: 14 }}>
                    <ProgressBar value={progress360} label="🌐 Stitching 360° panorama…" color="#a855f7" />
                    <div style={{ color: '#64748b', fontSize: 11, textAlign: 'center' }}>{imageCount >= 3 ? 'Generating full 360° panorama…' : 'Combining images…'}</div>
                  </div>
                )}
                {processState === 'done' && (
                  <div style={{ marginTop: 10, padding: '9px 13px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                    ✅ {imageCount === 1 ? '2D view generated' : `360° panorama generated from ${imageCount} images`}
                  </div>
                )}
                {processState === 'error' && (
                  <div style={{ marginTop: 10, padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 700 }}>
                    ❌ Processing failed — Please try again
                  </div>
                )}

                {uploadedImgs.length > 0 && (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                    {uploadedImgs.map((src: string, i: number) => (
                      <ImageCard key={i} src={src} label={`Image ${i + 1}`} onRemove={() => {
                        const updated = uploadedImgs.filter((_: string, idx: number) => idx !== i);
                        setUploadedImgs(updated);
                        setData((prev: TheatreViewData) => ({ ...prev, uploadedImages: updated }));
                        setProcessState('idle');
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* 2D Layout */}
              <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🗺</span>
                  <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>2D Layout Image</span>
                  <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 11 }}>Optional</span>
                </div>
                <UploadZone label="Upload Layout Image" hint="Top-view theatre seating chart" onFiles={handleLayoutUpload} />
                {data.view2DImage && (
                  <div style={{ marginTop: 10 }}>
                    <ImageCard src={data.view2DImage} label="2D Layout" onRemove={() => setData((prev: TheatreViewData) => ({ ...prev, view2DImage: undefined }))} />
                  </div>
                )}
              </div>

              {/* Manual panorama */}
              <div style={{ background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.12)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🌐</span>
                  <span style={{ color: '#f472b6', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom 360° Panorama</span>
                  <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 11 }}>Override auto-generated</span>
                </div>
                <UploadZone label="Upload 360° Panorama" hint="Equirectangular 2:1 ratio image" onFiles={handlePanoramaUpload} />
                {data.panoramaImage && (
                  <div style={{ marginTop: 10 }}>
                    <ImageCard src={data.panoramaImage} label="360° Panorama" onRemove={() => setData((prev: TheatreViewData) => ({ ...prev, panoramaImage: undefined }))} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row mapping section */}
          {activeSection === 'mapping' && (
            <div style={{ animation: 'svm-fade 0.3s ease both' }}>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
                Set distance and viewing angle for each row. These values are used to calculate view quality ratings shown to users.
              </p>
              <RowMappingEditor rows={rows} mapping={mapping} onChange={setMapping} />
              <div style={{ marginTop: 12, padding: '9px 13px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, color: '#818cf8', fontSize: 11, fontWeight: 600 }}>
                💡 Leave blank to use automatic calculations based on seat position
              </div>
            </div>
          )}

          {/* Preview section */}
          {activeSection === 'preview' && (
            <div style={{ animation: 'svm-fade 0.3s ease both' }}>
              {data.view2DImage && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>🗺 2D Layout Preview</div>
                  <img src={data.view2DImage} alt="Layout" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 0 20px rgba(59,130,246,0.1)' }} />
                </div>
              )}
              {data.panoramaImage && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#f472b6', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>🌐 360° Panorama Preview</div>
                  <img src={data.panoramaImage} alt="Panorama" style={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(236,72,153,0.2)', boxShadow: '0 0 20px rgba(236,72,153,0.1)' }} />
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 5 }}>
                    Equirectangular {data.panoramaImage.startsWith('data:') ? '(uploaded/generated)' : '(URL)'}
                  </div>
                </div>
              )}
              {!data.view2DImage && !data.panoramaImage && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.3))' }}>📂</div>
                  <div style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>No images uploaded yet</div>
                  <div style={{ color: '#334155', fontSize: 11, marginTop: 4 }}>Go to the Upload tab to add images</div>
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER / SAVE BAR ── */}
          <div style={{ marginTop: 24, padding: '18px 20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 18 }}>
            <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
              Let users preview the view from their selected seat in <span style={{ color: '#60a5fa', fontWeight: 700 }}>2D</span>, <span style={{ color: '#a78bfa', fontWeight: 700 }}>3D</span>, and <span style={{ color: '#f472b6', fontWeight: 700 }}>360°</span> to check distance and suitability before booking.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="svm-save-btn"
                onClick={handleSave}
                style={{
                  padding: '12px 28px', borderRadius: 14,
                  background: saved
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
                  color: 'white', fontWeight: 800, fontSize: 14,
                  boxShadow: saved ? '0 6px 20px rgba(34,197,94,0.4)' : '0 6px 20px rgba(99,102,241,0.4)',
                  letterSpacing: '0.02em',
                }}>
                {saved ? '✅ Saved!' : '🚀 Manage Display Options'}
              </button>
              <div style={{ color: '#475569', fontSize: 12 }}>
                {imageCount > 0 && <span style={{ color: '#a78bfa' }}>{imageCount} image{imageCount !== 1 ? 's' : ''}</span>}
                {imageCount > 0 && (data.panoramaImage || data.view2DImage) && <span style={{ color: '#334155' }}> · </span>}
                {data.panoramaImage && <span style={{ color: '#f472b6' }}>360° ready</span>}
                {data.panoramaImage && data.view2DImage && <span style={{ color: '#334155' }}> · </span>}
                {data.view2DImage && <span style={{ color: '#60a5fa' }}>2D ready</span>}
              </div>
            </div>
          </div>

          {/* Seat legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, justifyContent: 'center' }}>
            {[{ color: '#22c55e', label: 'Available' }, { color: '#ef4444', label: 'Booked' }, { color: '#f97316', label: 'Blocked' }, { color: '#a855f7', label: 'Selected' }].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="svm-seat-dot" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span style={{ color: '#475569', fontSize: 10, fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
