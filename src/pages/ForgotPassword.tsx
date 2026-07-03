import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ForgotPassword() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success'} | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMsg({ text: 'Please enter your email', type: 'error' });
      return;
    }
    setLoading(true);
    setMsg(null);
    setDevResetUrl(null);
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.message || 'Something went wrong', type: 'error' });
      } else {
        setMsg({ text: data.message, type: 'success' });
        if (data.resetUrl) setDevResetUrl(data.resetUrl);
      }
    } catch {
      setMsg({ text: 'Backend is offline. Please try again later.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0014', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(236,72,153,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(251,146,60,0.15), transparent 40%)' }} />
      
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: 32, background: 'rgba(20,0,8,0.65)', backdropFilter: 'blur(20px) saturate(1.5)', borderRadius: 24, border: '1px solid rgba(200,60,20,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(251,146,60,0.05)' }}>
        <button onClick={() => navigate('auth')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Login
        </button>
        
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Reset Password</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>
        
        {msg && (
          <div style={{ padding: 12, borderRadius: 12, background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: msg.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, fontWeight: 600, marginBottom: devResetUrl ? 8 : 20, border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{msg.type === 'error' ? '⚠' : '✅'}</span> {msg.text}
          </div>
        )}

        {devResetUrl && (
          <div style={{ marginBottom: 20, padding: 12, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ color: '#fb923c', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>[DEV MODE] Password Reset Link Generated</p>
            <a href={devResetUrl} style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 16px', background: '#fb923c', color: 'black', fontWeight: 800, borderRadius: 8, fontSize: 13 }}>
              Open Reset Page Now
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#fb923c'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f97316, #ec4899)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.2s', boxShadow: '0 8px 16px rgba(236,72,153,0.25)' }}
            onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
