import { useState } from 'react';

interface Props {
  onNext: (data: { name: string; phone: string; email: string; password: string }) => void;
  onBack: () => void;
}

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const pwStrength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const S = {
  wrap: { width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' as const, gap: 0 },
  header: { marginBottom: 20 },
  step: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#f59e0b', textTransform: 'uppercase' as const, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#fff 30%,#f59e0b 70%,#fb923c)', WebkitBackgroundClip: 'text' as any, WebkitTextFillColor: 'transparent', fontFamily: "'Outfit',sans-serif", marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 6 },
  inputWrap: { position: 'relative' as const },
  input: (err?: boolean) => ({
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.038)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 12, color: 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif",
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    transition: 'all 0.25s', fontWeight: 400,
  }),
  eyeBtn: { position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 },
  err: { fontSize: 11, color: '#f87171', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f59e0b,#fb923c 40%,#f97316)', border: 'none', borderRadius: 13, color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6, position: 'relative' as const, overflow: 'hidden', transition: 'all 0.3s', boxShadow: '0 4px 0 rgba(120,60,0,0.6),0 0 28px rgba(245,158,11,0.3)' },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '10px 20px', marginTop: 10, width: '100%', transition: 'all 0.2s' },
  progressBar: { display: 'flex', gap: 6, marginBottom: 20 },
  progressDot: (active: boolean) => ({ flex: 1, height: 3, borderRadius: 99, background: active ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s', boxShadow: active ? '0 0 8px rgba(245,158,11,0.5)' : 'none' }),
};

export default function TheatreRegStep1({ onNext, onBack }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showC, setShowC] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const strength = pwStrength(pw);
  const strengthColors = ['#ef4444', '#f59e0b', '#fb923c', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\d{10}$/.test(phone)) e.phone = 'Enter valid 10-digit mobile number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid business email';
    if (pw.length < 6) e.pw = 'Password must be at least 6 characters';
    if (pw !== confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onNext({ name: name.trim(), phone, email: email.trim().toLowerCase(), password: pw });
  };

  const focusStyle = (el: EventTarget & HTMLElement) => {
    el.style.borderColor = 'rgba(245,158,11,0.5)';
    el.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
  };
  const blurStyle = (el: EventTarget & HTMLElement, err?: boolean) => {
    el.style.borderColor = err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)';
    el.style.boxShadow = 'none';
  };

  return (
    <div style={S.wrap}>
      <div style={S.progressBar}>
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(false)} />
        <div style={S.progressDot(false)} />
      </div>

      {/* Theatre badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '6px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, width: 'fit-content' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>THEATRE OWNER REGISTRATION</span>
      </div>

      <div style={S.header}>
        <div style={S.step}>Step 1 of 3</div>
        <div style={S.title}>Basic Details</div>
        <div style={S.sub}>Start by providing your personal information</div>
      </div>

      <div style={S.field}>
        <label style={S.label}>Full Name</label>
        <input
          style={S.input(!!errs.name)} type="text" value={name} placeholder="Enter your full name"
          onChange={e => { setName(e.target.value); setErrs(p => ({ ...p, name: '' })); }}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.name)}
        />
        {errs.name && <div style={S.err}>⚠ {errs.name}</div>}
      </div>

      <div style={S.field}>
        <label style={S.label}>Phone Number</label>
        <div style={S.inputWrap}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, zIndex: 1 }}>🇮🇳 +91</span>
          <input
            style={{ ...S.input(!!errs.phone), paddingLeft: 72 }}
            type="tel" value={phone} placeholder="9876543210" maxLength={10}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrs(p => ({ ...p, phone: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.phone)}
          />
        </div>
        {errs.phone && <div style={S.err}>⚠ {errs.phone}</div>}
      </div>

      <div style={S.field}>
        <label style={S.label}>Business Email</label>
        <input
          style={S.input(!!errs.email)} type="email" value={email} placeholder="you@business.com"
          onChange={e => { setEmail(e.target.value); setErrs(p => ({ ...p, email: '' })); }}
          onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.email)}
        />
        {errs.email && <div style={S.err}>⚠ {errs.email}</div>}
      </div>

      <div style={S.field}>
        <label style={S.label}>Password</label>
        <div style={S.inputWrap}>
          <input
            style={{ ...S.input(!!errs.pw), paddingRight: 44 }} type={showPw ? 'text' : 'password'} value={pw} placeholder="••••••••"
            onChange={e => { setPw(e.target.value); setErrs(p => ({ ...p, pw: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.pw)}
          />
          <button style={S.eyeBtn} type="button" onClick={() => setShowPw(p => !p)}><EyeIcon open={showPw} /></button>
        </div>
        {pw.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: strength > 0 ? strengthColors[strength - 1] : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {strength > 0 ? strengthLabels[strength - 1] : ''}
            </div>
          </div>
        )}
        {errs.pw && <div style={S.err}>⚠ {errs.pw}</div>}
      </div>

      <div style={S.field}>
        <label style={S.label}>Confirm Password</label>
        <div style={S.inputWrap}>
          <input
            style={{ ...S.input(!!errs.confirm), paddingRight: 44 }} type={showC ? 'text' : 'password'} value={confirm} placeholder="••••••••"
            onChange={e => { setConfirm(e.target.value); setErrs(p => ({ ...p, confirm: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.confirm)}
          />
          <button style={S.eyeBtn} type="button" onClick={() => setShowC(p => !p)}><EyeIcon open={showC} /></button>
        </div>
        {errs.confirm && <div style={S.err}>⚠ {errs.confirm}</div>}
      </div>

      <button style={S.btn} onClick={submit}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 0 rgba(120,60,0,0.6),0 0 40px rgba(245,158,11,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 rgba(120,60,0,0.6),0 0 28px rgba(245,158,11,0.3)'; }}
      >
        Next → Profile & Verification
      </button>
      <button style={S.backBtn} onClick={onBack}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#f59e0b'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
      >← Back to Sign In</button>
    </div>
  );
}
