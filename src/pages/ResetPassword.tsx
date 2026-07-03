import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ResetPassword() {
  const { navigate } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success'} | null>(null);
  const [token, setToken] = useState('');

  // Extract token from URL path: /reset-password/:token
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2) {
      setToken(pathParts[2]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (!token) {
      setMsg({ text: 'Invalid or missing password reset link', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.message || 'Something went wrong', type: 'error' });
      } else {
        setMsg({ text: 'Password reset successful! You can now login.', type: 'success' });
        setTimeout(() => navigate('auth'), 3000);
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
        
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Set New Password</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Please enter your new password below. Make sure it is at least 6 characters.
        </p>
        
        {msg && (
          <div style={{ padding: 12, borderRadius: 12, background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: msg.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 20, border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{msg.type === 'error' ? '⚠' : '✅'}</span> {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>New Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#fb923c'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#fb923c'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || msg?.type === 'success'}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: (loading || msg?.type==='success') ? 'not-allowed' : 'pointer', opacity: (loading || msg?.type==='success') ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.2s', boxShadow: '0 8px 16px rgba(16,185,129,0.25)' }}
            onMouseOver={e => !(loading || msg?.type==='success') && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !(loading || msg?.type==='success') && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => navigate('auth')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
