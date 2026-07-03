import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, loginMode, closeLogin, login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(loginMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => { setMode(loginMode); setError(''); }, [loginMode, isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (mode === 'login') {
      const ok = login(form.email, form.password);
      if (!ok) setError('Invalid email or password');
    } else {
      if (!form.name || !form.email || !form.password || !form.phone) {
        setError('All fields required');
        setLoading(false);
        return;
      }
      register(form.name, form.email, form.password, form.phone, form.role);
    }
    setLoading(false);
  };

  const demoLogins = [
    { label: 'User', email: 'rahul@example.com', pass: 'user123' },
    { label: 'Admin', email: 'admin@cineconnect.com', pass: 'admin123' },
    { label: 'Owner', email: 'owner1@theatre.com', pass: 'owner123' },
  ];

  return (
    <Modal isOpen={isLoginModalOpen} onClose={closeLogin} size="sm">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-[#e53935] rounded-2xl flex items-center justify-center mx-auto mb-3 text-white font-black text-lg">BMS</div>
        <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>
        <p className="text-gray-400 text-sm mt-1">{mode === 'login' ? 'Sign in to continue' : 'Join millions of movie lovers'}</p>
      </div>

      {/* Demo Logins */}
      {mode === 'login' && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 text-center">Quick Demo Login</p>
          <div className="flex gap-2">
            {demoLogins.map(d => (
              <button
                key={d.label}
                onClick={() => setForm(f => ({ ...f, email: d.email, password: d.pass }))}
                className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg py-1.5 transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-[#1a1a2e] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
            >
              <option value="user">Movie Goer (User)</option>
              <option value="theatre_owner">Theatre Owner</option>
            </select>
          </>
        )}
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935] border border-white/10"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e53935] hover:bg-[#c62828] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#e53935] hover:text-[#ff5252] font-semibold transition-colors"
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </Modal>
  );
};
