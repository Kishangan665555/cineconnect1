import React, { useState, useRef, useCallback } from 'react';

interface Props {
  step1Data: { name: string; phone: string; email: string; password: string };
  onComplete: (profile: {
    avatar?: string;
    avatarFile?: File;
    username: string;
    gender: 'Male'|'Female'|'Other';
    bio: string;
    movieInterests: string[];
  }) => void;
  onBack: () => void;
  loading: boolean;
}

const GENRES = ['Action','Comedy','Romantic','Thriller','Sci-Fi','Horror','Adventure','Drama'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/* ─── Injected Styles ──────────────────────────────────────────────────── */
const AVATAR_STYLES = `
  @keyframes av-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes av-fadeIn  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
  @keyframes av-pulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes av-ring    { 0%{box-shadow:0 0 0 0 rgba(251,146,60,.5)} 100%{box-shadow:0 0 0 12px rgba(251,146,60,0)} }
  @keyframes av-shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes av-glow    { 0%,100%{box-shadow:0 0 20px rgba(251,146,60,.4),0 0 40px rgba(236,72,153,.2)} 50%{box-shadow:0 0 35px rgba(251,146,60,.7),0 0 60px rgba(236,72,153,.4)} }
  @keyframes av-check   { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
  @keyframes av-drop-flash { 0%,100%{border-color:rgba(251,146,60,.6)} 50%{border-color:rgba(251,146,60,1);background:rgba(251,146,60,.12)} }
  .av-upload-zone { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
  .av-upload-zone:hover { transform: scale(1.04); }
  .av-upload-zone.dragging { animation: av-drop-flash .8s ease infinite; transform: scale(1.06); }
`;

const S = {
  progressBar: { display: 'flex', gap: 6, marginBottom: 24 },
  progressDot: (active: boolean) => ({ flex: 1, height: 3, borderRadius: 99, background: active ? 'linear-gradient(90deg,#fb923c,#ec4899)' : 'rgba(255,255,255,0.1)', boxShadow: active ? '0 0 8px rgba(251,146,60,0.5)' : 'none', transition: 'all 0.3s' }),
  header: { marginBottom: 20 },
  step: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#ec4899', textTransform: 'uppercase' as const, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#fff 30%,#ec4899 70%,#fb923c)', WebkitBackgroundClip: 'text' as any, WebkitTextFillColor: 'transparent', fontFamily:"'Outfit',sans-serif", marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 7 },
  input: (err?: boolean) => ({
    width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.038)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 13, color: 'rgba(255,255,255,0.92)', fontFamily:"'Inter',sans-serif",
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.25s',
  }),
  select: { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.038)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, color:'rgba(255,255,255,0.92)', fontFamily:"'Inter',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' as const, cursor:'pointer', appearance:'none' as any },
  textarea: { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.038)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13, color:'rgba(255,255,255,0.92)', fontFamily:"'Inter',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' as const, resize:'none' as const, minHeight:72, transition:'all 0.25s' },
  err: { fontSize: 11, color: '#f87171', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 },
  chip: (sel: boolean) => ({ padding:'7px 14px', borderRadius:100, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${sel?'rgba(251,146,60,0.6)':'rgba(255,255,255,0.1)'}`, background:sel?'rgba(251,146,60,0.15)':'transparent', color:sel?'#fb923c':'rgba(255,255,255,0.4)', transition:'all 0.2s', boxShadow:sel?'0 0 10px rgba(251,146,60,0.2)':'none' }),
  btn: { width:'100%', padding:'15px', background:'linear-gradient(135deg,#ec4899,#db2777 40%,#fb923c)', border:'none', borderRadius:14, color:'#fff', fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', marginTop:4, transition:'all 0.3s', boxShadow:'0 4px 0 rgba(120,30,60,0.6),0 0 28px rgba(236,72,153,0.3)', position:'relative' as const, overflow:'hidden' },
  backBtn: { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(255,255,255,0.5)', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', padding:'10px 20px', marginTop:10, width:'100%', transition:'all 0.2s' },
};

/* ─── Avatar Uploader Component ─────────────────────────────────────────── */
const AvatarUploader: React.FC<{
  avatar: string;
  name: string;
  onAvatarChange: (dataUrl: string) => void;
  onFileSelect: (file: File) => void;
  onError: (msg: string) => void;
}> = ({ avatar, name, onAvatarChange, onFileSelect, onError }) => {
  const [hov, setHov] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Only JPG, PNG, WebP, or GIF images are allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError(`Image too large. Max size is 2MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setTimeout(() => {
        onAvatarChange(ev.target?.result as string);
        onFileSelect(file);           // ← pass raw File to parent for MongoDB upload
        setUploading(false);
        onError('');
      }, 400);
    };
    reader.onerror = () => { onError('Failed to read file'); setUploading(false); };
    reader.readAsDataURL(file);
  }, [onAvatarChange, onFileSelect, onError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
      {/* Main circular avatar zone */}
      <div
        className={`av-upload-zone${dragging ? ' dragging' : ''}`}
        onClick={() => fileRef.current?.click()}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          position: 'relative',
          width: 110, height: 110,
          borderRadius: '50%',
          cursor: 'pointer',
          flexShrink: 0,
          // Glow border using conic-gradient trick
          background: avatar
            ? 'transparent'
            : dragging
              ? 'rgba(251,146,60,.12)'
              : 'rgba(251,146,60,.05)',
          border: `2px ${avatar && !hov ? 'solid' : 'dashed'} ${dragging ? 'rgba(251,146,60,1)' : hov ? 'rgba(251,146,60,.85)' : 'rgba(251,146,60,.4)'}`,
          boxShadow: avatar
            ? (hov ? '0 0 0 3px rgba(251,146,60,.25), 0 8px 30px rgba(0,0,0,.5), 0 0 30px rgba(251,146,60,.3)' : '0 0 0 2px rgba(251,146,60,.15), 0 6px 24px rgba(0,0,0,.5)')
            : dragging
              ? '0 0 0 4px rgba(251,146,60,.3), 0 0 30px rgba(251,146,60,.4)'
              : hov ? '0 0 0 3px rgba(251,146,60,.2), 0 0 20px rgba(251,146,60,.2)' : 'none',
          overflow: 'hidden',
          animation: avatar && !uploading ? 'av-glow 4s ease-in-out infinite' : 'none',
        }}
      >
        {/* Avatar image or placeholder */}
        {uploading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,146,60,.08)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5" style={{ animation: 'av-spin .8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        ) : avatar ? (
          <>
            <img
              src={avatar}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'av-fadeIn .4s ease' }}
            />
            {/* Hover overlay */}
            {hov && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                animation: 'av-fadeIn .2s ease',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700, marginTop: 5 }}>CHANGE</span>
              </div>
            )}
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
          }}>
            {hov || dragging ? (
              <>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(251,146,60,.9)" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: 9, color: 'rgba(251,146,60,.85)', fontWeight: 700, marginTop: 5, letterSpacing: '0.5px' }}>
                  {dragging ? 'DROP' : 'UPLOAD'}
                </span>
              </>
            ) : (
              <>
                {/* Default user icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,rgba(251,146,60,.2),rgba(236,72,153,.15))',
                  border: '1.5px solid rgba(251,146,60,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: 'rgba(251,146,60,.7)',
                  fontFamily: "'Outfit',sans-serif",
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', fontWeight: 600, marginTop: 6, letterSpacing: '0.5px' }}>ADD PHOTO</span>
              </>
            )}
          </div>
        )}

        {/* Success ring when avatar uploaded */}
        {avatar && !uploading && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0a0015',
            boxShadow: '0 2px 8px rgba(16,185,129,.5)',
            animation: 'av-fadeIn .3s ease',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'av-check .4s ease both' }}/>
            </svg>
          </div>
        )}
      </div>

      {/* Label & action row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12, gap: 6 }}>
        <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, fontWeight: 500, textAlign: 'center' }}>
          {avatar ? 'Profile photo set ✨' : 'Profile Photo'}
          <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, marginLeft: 4 }}>(optional)</span>
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              background: 'rgba(251,146,60,.1)', border: '1px solid rgba(251,146,60,.35)',
              borderRadius: 8, color: '#fb923c', fontSize: 11, fontWeight: 700,
              padding: '6px 14px', cursor: 'pointer', transition: 'all .2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(251,146,60,.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(251,146,60,.1)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {avatar ? 'Change Photo' : 'Choose File'}
          </button>
          {avatar && (
            <button
              type="button"
              onClick={() => onAvatarChange('')}
              style={{
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                borderRadius: 8, color: 'rgba(239,68,68,.7)', fontSize: 11, fontWeight: 700,
                padding: '6px 12px', cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(239,68,68,.18)'; (e.currentTarget as HTMLElement).style.color='#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(239,68,68,.08)'; (e.currentTarget as HTMLElement).style.color='rgba(239,68,68,.7)'; }}
            >
              Remove
            </button>
          )}
        </div>
        <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, textAlign: 'center' }}>
          JPG, PNG, WebP · Max 2MB · Drag & drop supported
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function RegStep2({ step1Data, onComplete, onBack, loading }: Props) {
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'Male'|'Female'|'Other'|''>('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [errs, setErrs] = useState<Record<string,string>>({});

  // Inject styles once
  React.useEffect(() => {
    if (!document.getElementById('avatar-uploader-styles')) {
      const s = document.createElement('style');
      s.id = 'avatar-uploader-styles';
      s.textContent = AVATAR_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev,g]);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!gender) e.gender = 'Please select a gender';
    if (genres.length < 1) e.genres = 'Select at least one genre';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onComplete({
      avatar: avatar || undefined,
      avatarFile: avatarFile || undefined,
      username: username || step1Data.name,
      gender: gender as 'Male'|'Female'|'Other',
      bio,
      movieInterests: genres,
    });
  };

  const focusStyle = (el: EventTarget & HTMLElement) => { el.style.borderColor='rgba(251,146,60,0.5)'; el.style.boxShadow='0 0 0 3px rgba(251,146,60,0.1)'; };
  const blurStyle  = (el: EventTarget & HTMLElement, err?: boolean) => { el.style.borderColor=err?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.07)'; el.style.boxShadow='none'; };

  return (
    <div style={{ width:'100%', maxWidth:420 }}>
      <style>{`@keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <div style={S.progressBar}>
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(true)} />
      </div>

      <div style={S.header}>
        <div style={S.step}>Step 2 of 2</div>
        <div style={S.title}>Build Your Profile</div>
        <div style={S.sub}>Personalize your cinema experience</div>
      </div>

      {/* ── Premium Avatar Uploader ── */}
      <AvatarUploader
        avatar={avatar}
        name={step1Data.name}
        onAvatarChange={setAvatar}
        onFileSelect={setAvatarFile}
        onError={msg => setErrs(p => ({ ...p, avatar: msg }))}
      />
      {errs.avatar && (
        <div style={{ ...S.err, marginTop: -14, marginBottom: 12, justifyContent: 'center', animation: 'av-shake .4s ease' }}>
          ⚠ {errs.avatar}
        </div>
      )}

      {/* ── Username ── */}
      <div style={{ marginBottom:16 }}>
        <label style={S.label}>Username <span style={{color:'rgba(255,255,255,.2)',fontSize:10}}>(optional)</span></label>
        <input
          style={S.input()}
          type="text" value={username}
          placeholder={`@${step1Data.name.toLowerCase().replace(/\s+/g,'_')}`}
          onChange={e => setUsername(e.target.value)}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target)}
        />
      </div>

      {/* ── Gender ── */}
      <div style={{ marginBottom:16 }}>
        <label style={S.label}>Gender <span style={{color:'rgba(251,146,60,.6)',fontSize:10}}>*</span></label>
        <div style={{ position:'relative' }}>
          <select
            style={{ ...S.select, borderColor: errs.gender?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.07)' }}
            value={gender}
            onChange={e => { setGender(e.target.value as any); setErrs(p=>({...p,gender:''})); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.gender)}
          >
            <option value="" style={{ background:'#0a0015' }}>Select Gender</option>
            <option value="Male" style={{ background:'#0a0015' }}>Male</option>
            <option value="Female" style={{ background:'#0a0015' }}>Female</option>
            <option value="Other" style={{ background:'#0a0015' }}>Other</option>
          </select>
          <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}>▼</span>
        </div>
        {errs.gender && <div style={S.err}>⚠ {errs.gender}</div>}
      </div>

      {/* ── Bio ── */}
      <div style={{ marginBottom:16 }}>
        <label style={S.label}>Bio <span style={{color:'rgba(255,255,255,.2)',fontSize:10}}>(optional)</span></label>
        <textarea
          style={S.textarea}
          value={bio} placeholder="Tell us a bit about yourself…" maxLength={160}
          onChange={e => setBio(e.target.value)}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target)}
        />
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'right', marginTop:2 }}>{bio.length}/160</div>
      </div>

      {/* ── Genre chips ── */}
      <div style={{ marginBottom:20 }}>
        <label style={S.label}>Movie Interests <span style={{color:'rgba(251,146,60,.6)',fontSize:10}}>*</span></label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {GENRES.map(g => (
            <button key={g} type="button" style={S.chip(genres.includes(g))} onClick={() => { toggleGenre(g); setErrs(p=>({...p,genres:''})); }}>
              {g}
            </button>
          ))}
        </div>
        {errs.genres && <div style={{ ...S.err, marginTop:8 }}>⚠ {errs.genres}</div>}
      </div>

      {/* ── Submit ── */}
      <button
        style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
        onClick={submit} disabled={loading}
        onMouseEnter={e => { if(!loading){(e.currentTarget).style.transform='translateY(-2px)';(e.currentTarget).style.boxShadow='0 8px 0 rgba(120,30,60,0.6),0 0 40px rgba(236,72,153,0.5)';} }}
        onMouseLeave={e => { (e.currentTarget).style.transform='';(e.currentTarget).style.boxShadow='0 4px 0 rgba(120,30,60,0.6),0 0 28px rgba(236,72,153,0.3)'; }}
      >
        {loading ? (
          <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:'spinSlow 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Creating Account…
          </span>
        ) : '🎬 Complete Registration'}
      </button>

      <button
        style={S.backBtn} onClick={onBack}
        onMouseEnter={e => { (e.currentTarget).style.borderColor='rgba(251,146,60,0.3)';(e.currentTarget).style.color='#fb923c'; }}
        onMouseLeave={e => { (e.currentTarget).style.borderColor='rgba(255,255,255,0.1)';(e.currentTarget).style.color='rgba(255,255,255,0.5)'; }}
      >
        ← Back to Step 1
      </button>
    </div>
  );
}
