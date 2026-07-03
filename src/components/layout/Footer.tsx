import React from 'react';
import { useApp } from '../../context/AppContext';

const S = `
  .footer-link {
    color: rgba(241,245,249,0.45);
    background: none; border: none; cursor: pointer;
    font-size: 13px; font-weight: 500;
    font-family: 'Outfit', sans-serif;
    padding: 3px 0; text-align: left;
    position: relative; display: inline-block;
    transition: color 0.2s ease;
  }
  .footer-link::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .footer-link:hover { color: #c084fc; }
  .footer-link:hover::after { transform: scaleX(1); }

  .social-btn {
    width: 38px; height: 38px; border-radius: 10px;
    border: 1.5px solid rgba(168,85,247,0.2);
    background: rgba(99,102,241,0.06);
    color: rgba(241,245,249,0.5);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .social-btn:hover {
    border-color: rgba(168,85,247,0.6);
    background: rgba(99,102,241,0.15);
    color: #c084fc;
    box-shadow: 0 0 16px rgba(168,85,247,0.25);
    transform: translateY(-3px);
  }
`;

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const LinkedinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  const columns = [
    {
      title: 'Movies', color: '#a855f7',
      links: [
        { label: 'Now Showing',  action: () => navigate('movies') },
        { label: 'Coming Soon',  action: () => navigate('movies') },
        { label: 'Browse All',   action: () => navigate('movies') },
        { label: 'Offers & Deals', action: () => navigate('offers') },
      ],
    },
    {
      title: 'Company', color: '#ec4899',
      links: [
        { label: 'How It Works', action: () => navigate('how-it-works') },
        { label: 'About Us',     action: () => navigate('home') },
        { label: 'Careers',      action: () => navigate('home') },
        { label: 'Press',        action: () => navigate('home') },
      ],
    },
    {
      title: 'Support', color: '#34d399',
      links: [
        { label: 'Help Center',    action: () => navigate('home') },
        { label: 'Contact Us',     action: () => navigate('home') },
        { label: 'Privacy Policy', action: () => navigate('home') },
        { label: 'Terms of Use',   action: () => navigate('home') },
      ],
    },
  ];

  return (
    <>
      <style>{S}</style>
      <footer className="cc-footer" style={{ position: 'relative', paddingTop: 64, paddingBottom: 32 }}>
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: 0, left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>

            {/* Brand column */}
            <div>
              {/* Logo */}
              <button onClick={() => navigate('home')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
                  border: '1.5px solid rgba(168,85,247,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(168,85,247,0.25)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(192,132,252,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="3"/><line x1="1" y1="9" x2="23" y2="9"/><line x1="1" y1="15" x2="23" y2="15"/><line x1="7" y1="4" x2="7" y2="9"/><line x1="7" y1="15" x2="7" y2="20"/><line x1="17" y1="4" x2="17" y2="9"/><line x1="17" y1="15" x2="17" y2="20"/>
                  </svg>
                </div>
                <span style={{
                  fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 24,
                  background: 'linear-gradient(135deg, #fff 0%, #c084fc 40%, #f472b6 80%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}>CineConnect</span>
              </button>

              <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>
                India's premium movie booking platform. Book tickets, discover shows, and experience cinema like never before.
              </p>

              {/* Social icons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                {[<TwitterIcon/>, <InstagramIcon/>, <YoutubeIcon/>, <LinkedinIcon/>].map((icon, i) => (
                  <button key={i} className="social-btn">{icon}</button>
                ))}
              </div>

              {/* Status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 100,
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.7)', animation: 'corePulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>All Systems Operational</span>
              </div>
            </div>

            {/* Link columns */}
            {columns.map(col => (
              <div key={col.title}>
                <h4 style={{
                  fontSize: 12, fontWeight: 800, fontFamily: "'Outfit',sans-serif",
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: col.color, marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 20, height: 2, background: col.color, display: 'inline-block', borderRadius: 1 }} />
                  {col.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <button key={l.label} onClick={l.action} className="footer-link">{l.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(168,85,247,0.1)',
            paddingTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.25)', fontFamily: "'Inter',sans-serif" }}>
              © {new Date().getFullYear()} CineConnect. All rights reserved.
            </div>

            {/* App store buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {['App Store', 'Google Play'].map(s => (
                <button key={s}
                  style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(168,85,247,0.15)',
                    color: 'rgba(241,245,249,0.5)', fontSize: 11, fontWeight: 600,
                    fontFamily: "'Outfit',sans-serif", cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.45)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#c084fc';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(241,245,249,0.5)';
                  }}
                >{s}</button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.2)', fontFamily: "'Inter',sans-serif" }}>
              Made with ❤️ for cinema lovers
            </div>
          </div>
        </div>

        {/* Gradient fade-in from transparent */}
        <div style={{ position: 'absolute', top: -80, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, rgba(7,2,15,0.6))', pointerEvents: 'none' }} />
      </footer>
    </>
  );
};
