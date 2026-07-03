/**
 * src/components/ai/ContactSupport.tsx
 * Contact page inside AI chatbot: email, phone, WhatsApp, live call request, message form
 */
import React, { useState } from 'react';
import { apiSubmitSupportTicket } from '../../services/aiService';

interface Props {
  currentUser: any;
}

const ISSUE_TYPES = [
  { value: 'booking_help',   label: '🎟️ Booking Help' },
  { value: 'cancel_ticket',  label: '❌ Cancel Ticket' },
  { value: 'refund',         label: '💰 Refund Query' },
  { value: 'payment_failed', label: '💳 Payment Failed' },
  { value: 'razorpay_issue', label: '🔧 Razorpay Issue' },
  { value: 'login_signup',   label: '🔐 Login/Signup' },
  { value: 'account_issue',  label: '👤 Account Issue' },
  { value: 'coupon_offer',   label: '🎁 Coupon/Offers' },
  { value: 'bug_report',     label: '🐛 Bug Report' },
  { value: 'speak_to_human', label: '🤝 Speak to Human' },
  { value: 'other',          label: '💬 Other' },
];

const ContactSupport: React.FC<Props> = ({ currentUser }) => {
  const [form, setForm] = useState({
    name:      currentUser?.name  || '',
    email:     currentUser?.email || '',
    issueType: 'other',
    subject:   '',
    message:   '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    setSubmitting(true);
    const res = await apiSubmitSupportTicket(form);
    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.message || 'Failed to submit. Please email us directly.');
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(200,180,255,0.7)',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 5,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid rgba(99,102,241,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(245,240,255,0.9)',
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(168,85,247,0.3) transparent',
    }}>

      {/* Quick contact methods */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {/* Email */}
        <a
          href="mailto:kishansm301@gmail.com"
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.1)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 22 }}>📧</span>
          <span style={{ fontSize: 11, color: 'rgba(180,170,255,0.85)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, textAlign: 'center' }}>
            Email<br />
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(150,140,220,0.7)' }}>kishansm301@gmail.com</span>
          </span>
        </a>

        {/* Phone */}
        <a
          href="tel:+918660596113"
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(34,197,94,0.15)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(34,197,94,0.25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(34,197,94,0.08)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 22 }}>📞</span>
          <span style={{ fontSize: 11, color: 'rgba(160,220,180,0.9)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, textAlign: 'center' }}>
            Call Us<br />
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(120,200,140,0.7)' }}>+91 8660596113</span>
          </span>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/918660596113?text=Hi%20CineConnect%20Support%2C%20I%20need%20help%20with..."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'rgba(37,211,102,0.08)',
            border: '1px solid rgba(37,211,102,0.2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.15)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(37,211,102,0.3)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.08)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 22 }}>💬</span>
          <span style={{ fontSize: 11, color: 'rgba(100,230,130,0.9)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, textAlign: 'center' }}>
            WhatsApp<br />
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(80,200,110,0.7)' }}>Chat with us</span>
          </span>
        </a>

        {/* Live call request */}
        <button
          onClick={() => {
            setForm(prev => ({ ...prev, issueType: 'speak_to_human', message: 'I would like to request a live callback from CineConnect support.' }));
            // Scroll to form
            document.getElementById('support-form')?.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.18)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(168,85,247,0.3)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: 22 }}>🤝</span>
          <span style={{ fontSize: 11, color: 'rgba(195,145,255,0.9)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, textAlign: 'center' }}>
            Request Call<br />
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(170,120,230,0.7)' }}>We'll call you</span>
          </span>
        </button>
      </div>

      {/* Availability */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(251,191,36,0.07)',
        border: '1px solid rgba(251,191,36,0.18)',
        borderRadius: 10,
        fontSize: 12,
        color: 'rgba(255,220,100,0.75)',
        fontFamily: "'Outfit', sans-serif",
        marginBottom: 16,
        textAlign: 'center',
      }}>
        🕘 Support hours: Mon–Sat, 9 AM – 9 PM IST · Average response: &lt; 2 hours
      </div>

      {/* Message form */}
      {submitted ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ color: '#86efac', fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
            Message Received!
          </div>
          <div style={{ color: 'rgba(180,255,190,0.6)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
            We'll reply to your email within 24 hours. Thank you! 🙏
          </div>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: currentUser?.name || '', email: currentUser?.email || '', issueType: 'other', subject: '', message: '' }); }}
            style={{
              marginTop: 14,
              padding: '8px 20px',
              borderRadius: 20,
              border: '1px solid rgba(34,197,94,0.4)',
              background: 'rgba(34,197,94,0.12)',
              color: '#86efac',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form id="support-form" onSubmit={handleSubmit}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(200,185,255,0.8)', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>
            📝 Send Us a Message
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Your Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Kishan"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Issue Type</label>
            <select
              name="issueType"
              value={form.issueType}
              onChange={handleChange}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {ISSUE_TYPES.map(t => (
                <option key={t.value} value={t.value} style={{ background: '#1a1032', color: 'white' }}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief description"
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Describe your issue in detail..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 80,
                lineHeight: 1.5,
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 12,
              fontFamily: "'Outfit', sans-serif",
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            id="support-submit-btn"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 14,
              padding: '11px',
              borderRadius: 12,
              border: 'none',
              background: submitting
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: submitting ? 'none' : '0 6px 20px rgba(99,102,241,0.4)',
            }}
            onMouseEnter={e => {
              if (!submitting) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
          >
            {submitting ? '⏳ Sending...' : '🚀 Send Message'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactSupport;
