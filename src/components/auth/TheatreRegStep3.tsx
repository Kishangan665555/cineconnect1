import { useState } from 'react';

interface Step1Data { name: string; phone: string; email: string; password: string; }
interface Step2Data {
  avatar?: string; theatreName: string; theatreLocation: string; theatreCity: string;
  aadhaarNumber: string; aadhaarFront?: string; aadhaarBack?: string;
}
interface Step3Data {
  bankAccountHolder: string; bankName: string; bankAccountNumber: string; bankIfsc: string;
}
interface Props {
  step1Data: Step1Data;
  step2Data: Step2Data;
  onComplete: (data: Step3Data) => void;
  onBack: () => void;
  loading: boolean;
}

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
  'IndusInd Bank', 'Yes Bank', 'Federal Bank', 'IDBI Bank', 'Bank of India',
  'Indian Overseas Bank', 'Central Bank of India', 'UCO Bank', 'Other',
];

const S = {
  wrap: { width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' as const },
  progressBar: { display: 'flex', gap: 6, marginBottom: 20 },
  progressDot: (active: boolean) => ({ flex: 1, height: 3, borderRadius: 99, background: active ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : 'rgba(255,255,255,0.1)', boxShadow: active ? '0 0 8px rgba(245,158,11,0.5)' : 'none', transition: 'all 0.3s' }),
  header: { marginBottom: 16 },
  step: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#10b981', textTransform: 'uppercase' as const, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#fff 30%,#10b981 70%,#34d399)', WebkitBackgroundClip: 'text' as any, WebkitTextFillColor: 'transparent', fontFamily: "'Outfit',sans-serif", marginBottom: 4 },
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
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#10b981,#059669 40%,#34d399)', border: 'none', borderRadius: 13, color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6, transition: 'all 0.3s', boxShadow: '0 4px 0 rgba(5,100,60,0.6),0 0 28px rgba(16,185,129,0.3)', position: 'relative' as const, overflow: 'hidden' },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '10px 20px', marginTop: 10, width: '100%', transition: 'all 0.2s' },
};

export default function TheatreRegStep3({ step1Data, step2Data, onComplete, onBack, loading }: Props) {
  const [holder, setHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [confirmAcc, setConfirmAcc] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});

  const focusStyle = (el: EventTarget & HTMLElement) => { el.style.borderColor = 'rgba(16,185,129,0.5)'; el.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; };
  const blurStyle = (el: EventTarget & HTMLElement, err?: boolean) => { el.style.borderColor = err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; };


  const validate = () => {
    const e: Record<string, string> = {};
    if (!holder.trim()) e.holder = 'Account holder name is required';
    if (!bankName) e.bankName = 'Please select a bank';
    if (!accNum || accNum.length < 8) e.accNum = 'Enter valid account number (min 8 digits)';
    if (accNum !== confirmAcc) e.confirmAcc = 'Account numbers do not match';
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) e.ifsc = 'Enter valid IFSC code (e.g. SBIN0001234)';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onComplete({
      bankAccountHolder: holder.trim(),
      bankName,
      bankAccountNumber: accNum,
      bankIfsc: ifsc.toUpperCase(),
    });
  };

  // Summary card
  const SummaryCard = () => (
    <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' as const }}>Registration Summary</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {step2Data.avatar ? (
          <img src={step2Data.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(245,158,11,0.3)' }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏛️</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step1Data.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{step2Data.theatreName} · {step2Data.theatreCity}</div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 10, fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>Step 3</div>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.progressBar}>
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(true)} />
        <div style={S.progressDot(true)} />
      </div>

      <div style={S.header}>
        <div style={S.step}>Step 3 of 3</div>
        <div style={S.title}>Bank Details</div>
        <div style={S.sub}>Required for payment settlements</div>
      </div>

      <SummaryCard />

      {/* Bank section */}
      <div style={{ padding: '14px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="1" y="10" width="22" height="12" rx="2"/><path d="M12 2L2 10h20L12 2z"/><line x1="6" y1="14" x2="6" y2="18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="18" y1="14" x2="18" y2="18"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.5px' }}>BANK ACCOUNT DETAILS</span>
        </div>

        {/* Account Holder */}
        <div style={S.field}>
          <label style={S.label}>Account Holder Name <span style={{ color: '#10b981' }}>*</span></label>
          <input
            style={S.input(!!errs.holder)} type="text" value={holder} placeholder="As per bank records"
            onChange={e => { setHolder(e.target.value); setErrs(p => ({ ...p, holder: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.holder)}
          />
          {errs.holder && <div style={S.err}>⚠ {errs.holder}</div>}
        </div>

        {/* Bank Name */}
        <div style={S.field}>
          <label style={S.label}>Bank Name <span style={{ color: '#10b981' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <select
              style={{ ...S.select, borderColor: errs.bankName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)' }}
              value={bankName}
              onChange={e => { setBankName(e.target.value); setErrs(p => ({ ...p, bankName: '' })); }}
              onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.bankName)}
            >
              <option value="" style={{ background: '#0a0015' }}>Select Bank</option>
              {BANKS.map(b => <option key={b} value={b} style={{ background: '#0a0015' }}>{b}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>▼</span>
          </div>
          {errs.bankName && <div style={S.err}>⚠ {errs.bankName}</div>}
        </div>

        {/* Account Number */}
        <div style={S.field}>
          <label style={S.label}>Account Number <span style={{ color: '#10b981' }}>*</span></label>
          <input
            style={S.input(!!errs.accNum)} type="text" value={accNum} placeholder="Enter account number"
            onChange={e => { setAccNum(e.target.value.replace(/\D/g, '')); setErrs(p => ({ ...p, accNum: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.accNum)}
          />
          {errs.accNum && <div style={S.err}>⚠ {errs.accNum}</div>}
        </div>

        {/* Confirm Account */}
        <div style={S.field}>
          <label style={S.label}>Confirm Account Number <span style={{ color: '#10b981' }}>*</span></label>
          <input
            style={S.input(!!errs.confirmAcc)} type="text" value={confirmAcc} placeholder="Re-enter account number"
            onChange={e => { setConfirmAcc(e.target.value.replace(/\D/g, '')); setErrs(p => ({ ...p, confirmAcc: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.confirmAcc)}
          />
          {accNum && confirmAcc && accNum === confirmAcc && (
            <div style={{ fontSize: 10, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
              Account numbers match
            </div>
          )}
          {errs.confirmAcc && <div style={S.err}>⚠ {errs.confirmAcc}</div>}
        </div>

        {/* IFSC */}
        <div style={{ marginBottom: 4 }}>
          <label style={S.label}>IFSC Code <span style={{ color: '#10b981' }}>*</span></label>
          <input
            style={S.input(!!errs.ifsc)} type="text" value={ifsc} placeholder="e.g. SBIN0001234" maxLength={11}
            onChange={e => { setIfsc(e.target.value.toUpperCase()); setErrs(p => ({ ...p, ifsc: '' })); }}
            onFocus={e => focusStyle(e.target)} onBlur={e => blurStyle(e.target, !!errs.ifsc)}
          />
          {errs.ifsc && <div style={S.err}>⚠ {errs.ifsc}</div>}
        </div>
      </div>

      {/* Security note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', marginBottom: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Bank details are AES-256 encrypted and stored securely</span>
      </div>

      <button
        style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
        onClick={submit} disabled={loading}
        onMouseEnter={e => { if (!loading) { (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 8px 0 rgba(5,100,60,0.6),0 0 40px rgba(16,185,129,0.5)'; } }}
        onMouseLeave={e => { (e.currentTarget).style.transform = ''; (e.currentTarget).style.boxShadow = '0 4px 0 rgba(5,100,60,0.6),0 0 28px rgba(16,185,129,0.3)'; }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spinSlow 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Submitting Registration…
          </span>
        ) : '🏛️ Submit Registration'}
      </button>
      <button style={S.backBtn} onClick={onBack}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#10b981'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
      >← Back to Step 2</button>
    </div>
  );
}
