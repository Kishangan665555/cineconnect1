import React, { useState, useRef } from 'react';
import { CITIES } from '../../data/store';

interface Step2Data {
  avatar?: string; theatreName: string; theatreLocation: string; theatreCity: string;
  aadhaarNumber: string; aadhaarFront?: string; aadhaarBack?: string;
}
interface Props {
  step1Data: { name: string; phone: string; email: string; password: string; };
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

const S = {
  wrap: { width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' as const },
  progressBar: { display: 'flex', gap: 6, marginBottom: 20 },
  progressDot: (active: boolean) => ({ flex: 1, height: 3, borderRadius: 99, background: active ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : 'rgba(255,255,255,0.1)', boxShadow: active ? '0 0 8px rgba(245,158,11,0.5)' : 'none', transition: 'all 0.3s' }),
  header: { marginBottom: 16 },
  step: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#fb923c', textTransform: 'uppercase' as const, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#fff 30%,#fb923c 70%,#f59e0b)', WebkitBackgroundClip: 'text' as any, WebkitTextFillColor: 'transparent', fontFamily: "'Outfit',sans-serif", marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 6 },
  input: (err?: boolean) => ({
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.038)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 12, color: 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif",
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.25s',
  }),
  select: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.038)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, cursor: 'pointer', appearance: 'none' as any },
  err: { fontSize: 11, color: '#f87171', marginTop: 4 },
  field: { marginBottom: 14 },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#fb923c,#f97316 40%,#f59e0b)', border: 'none', borderRadius: 13, color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6, transition: 'all 0.3s', boxShadow: '0 4px 0 rgba(120,60,0,0.6),0 0 28px rgba(251,146,60,0.3)', position: 'relative' as const, overflow: 'hidden' },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '10px 20px', marginTop: 10, width: '100%', transition: 'all 0.2s' },
};

export default function TheatreRegStep2({ onNext, onBack }: Props) {
  const [avatar, setAvatar] = useState('');
  const [theatreName, setTheatreName] = useState('');
  const [theatreLocation, setTheatreLocation] = useState('');
  const [theatreCity, setTheatreCity] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});

  const avatarRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File, cb: (r: string) => void) => {
    const reader = new FileReader();
    reader.onload = e => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const focusStyle = (el: EventTarget & HTMLElement) => { el.style.borderColor = 'rgba(251,146,60,0.5)'; el.style.boxShadow = '0 0 0 3px rgba(251,146,60,0.1)'; };
  const blurStyle = (el: EventTarget & HTMLElement, err?: boolean) => { el.style.borderColor = err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; };

  const formatAadhaar = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 12);
    return digits;
  };

  const displayAadhaar = (v: string) => {
    if (!v) return '';
    const parts = [];
    for (let i = 0; i < v.length; i += 4) parts.push(v.slice(i, i + 4));
    return parts.join(' ');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!theatreName.trim()) e.theatreName = 'Theatre name is required';
    if (!theatreLocation.trim()) e.theatreLocation = 'Theatre location is required';
    if (!theatreCity) e.theatreCity = 'Please select a city';
    if (!/^\d{12}$/.test(aadhaarNumber)) e.aadhaarNumber = 'Enter valid 12-digit Aadhaar number';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onNext({
      avatar: avatar || undefined,
      theatreName: theatreName.trim(),
      theatreLocation: theatreLocation.trim(),
      theatreCity,
      aadhaarNumber,
      aadhaarFront: aadhaarFront || undefined,
      aadhaarBack: aadhaarBack || undefined,
    });
  };

  const UploadBox = ({ label, value, inputRef, onSet }: { label: string; value: string; inputRef: React.RefObject<HTMLInputElement | null>; onSet: (v: string) => void }) => (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{label}</div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          height: 100, borderRadius: 12, border: `2px dashed ${value ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          overflow: 'hidden', background: value ? 'rgba(251,146,60,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,146,60,0.6)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = value ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.1)')}
      >
        {value ? (
          <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>📄</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>UPLOAD</div>
          </div>
        )}
      </div>
      <input ref={inputRef as any} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, onSet); }} style={{ display: 'none' }} />
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.progressBar}>
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(false)} />
      </div>

      <div style={S.header}>
        <div style={S.step}>Step 2 of 3</div>
        <div style={S.title}>Profile & Verification</div>
        <div style={S.sub}>Theatre details and identity verification</div>
      </div>

      {/* Profile Picture */}
      <div style={S.field}>
        <label style={S.label}>Profile Picture <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>(optional)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            onClick={() => avatarRef.current?.click()}
            style={{ width: 60, height: 60, borderRadius: '50%', border: '2px dashed rgba(251,146,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: 'rgba(251,146,60,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,146,60,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(251,146,60,0.4)')}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>📸</div></div>
            )}
          </div>
          <button onClick={() => avatarRef.current?.click()} style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 8, color: '#fb923c', fontSize: 11, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' }}>Choose Photo</button>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, setAvatar); }} style={{ display: 'none' }} />
      </div>

      {/* Theatre Name */}
      <div style={S.field}>
        <label style={S.label}>Theatre Name <span style={{ color: '#fb923c' }}>*</span></label>
        <input
          style={S.input(!!errs.theatreName)} type="text" value={theatreName} placeholder="e.g. PVR Cinemas"
          onChange={e => { setTheatreName(e.target.value); setErrs(p => ({ ...p, theatreName: '' })); }}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.theatreName)}
        />
        {errs.theatreName && <div style={S.err}>⚠ {errs.theatreName}</div>}
      </div>

      {/* Theatre Location */}
      <div style={S.field}>
        <label style={S.label}>Theatre Location <span style={{ color: '#fb923c' }}>*</span></label>
        <input
          style={S.input(!!errs.theatreLocation)} type="text" value={theatreLocation} placeholder="Full address of theatre"
          onChange={e => { setTheatreLocation(e.target.value); setErrs(p => ({ ...p, theatreLocation: '' })); }}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.theatreLocation)}
        />
        {errs.theatreLocation && <div style={S.err}>⚠ {errs.theatreLocation}</div>}
      </div>

      {/* Theatre City */}
      <div style={S.field}>
        <label style={S.label}>Theatre City <span style={{ color: '#fb923c' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <select
            style={{ ...S.select, borderColor: errs.theatreCity ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)' }}
            value={theatreCity}
            onChange={e => { setTheatreCity(e.target.value); setErrs(p => ({ ...p, theatreCity: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.theatreCity)}
          >
            <option value="" style={{ background: '#0a0015' }}>Select City</option>
            {CITIES.map(c => <option key={c} value={c} style={{ background: '#0a0015' }}>{c}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>▼</span>
        </div>
        {errs.theatreCity && <div style={S.err}>⚠ {errs.theatreCity}</div>}
      </div>

      {/* Aadhaar Section */}
      <div style={{ marginBottom: 14, padding: '14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>AADHAAR VERIFICATION</span>
        </div>

        {/* Aadhaar Number */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...S.label, marginBottom: 5 }}>Aadhaar Number <span style={{ color: '#fb923c' }}>*</span></label>
          <input
            style={S.input(!!errs.aadhaarNumber)} type="text" value={displayAadhaar(aadhaarNumber)}
            placeholder="XXXX XXXX XXXX" maxLength={14}
            onChange={e => { setAadhaarNumber(formatAadhaar(e.target.value)); setErrs(p => ({ ...p, aadhaarNumber: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.aadhaarNumber)}
          />
          {errs.aadhaarNumber && <div style={S.err}>⚠ {errs.aadhaarNumber}</div>}
        </div>

        {/* Aadhaar Images */}
        <div style={{ display: 'flex', gap: 12 }}>
          <UploadBox label="Front Side" value={aadhaarFront} inputRef={frontRef} onSet={setAadhaarFront} />
          <UploadBox label="Back Side" value={aadhaarBack} inputRef={backRef} onSet={setAadhaarBack} />
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Secured with 256-bit encryption
        </div>
      </div>

      <button style={S.btn} onClick={submit}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 0 rgba(120,60,0,0.6),0 0 40px rgba(251,146,60,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 rgba(120,60,0,0.6),0 0 28px rgba(251,146,60,0.3)'; }}
      >
        Next → Bank Details
      </button>
      <button style={S.backBtn} onClick={onBack}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,146,60,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#fb923c'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
      >← Back to Step 1</button>
    </div>
  );
}
