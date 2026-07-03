import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { NavSearchPanel } from '../NavSearchPanel';
import { MessagingHub } from '../social/MessagingHub';
import { apiGetUnreadCount } from '../../services/apiService';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  Film: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3"/><line x1="1" y1="9" x2="23" y2="9"/><line x1="1" y1="15" x2="23" y2="15"/><line x1="7" y1="4" x2="7" y2="9"/><line x1="7" y1="15" x2="7" y2="20"/><line x1="17" y1="4" x2="17" y2="9"/><line x1="17" y1="15" x2="17" y2="20"/>
    </svg>
  ),
  Tag: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ChevDown: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Dashboard: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Bookings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Theatre: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l10 5 10-5V20H2z"/><polyline points="2 8 12 3 22 8"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Admin: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const S = `
  @keyframes navDropIn {
    from { opacity:0; transform:translateY(-10px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes mobileSlideIn {
    from { opacity:0; transform:translateX(100%); }
    to   { opacity:1; transform:translateX(0); }
  }
  .nav-link-item {
    position:relative;
    color:rgba(241,245,249,0.65);
    font-size:14px;
    font-weight:600;
    font-family:'Outfit',sans-serif;
    padding:6px 2px;
    background:none;
    border:none;
    cursor:pointer;
    transition:color 0.2s ease;
    white-space:nowrap;
  }
  .nav-link-item::after {
    content:'';
    position:absolute;
    bottom:-2px; left:0; right:0;
    height:2px;
    background:linear-gradient(90deg,#6366f1,#a855f7,#ec4899);
    border-radius:1px;
    transform:scaleX(0);
    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .nav-link-item:hover { color:#fff; }
  .nav-link-item:hover::after { transform:scaleX(1); }
`;

export const Navbar: React.FC = () => {
  const { currentUser, navigate, logout, openCityModal, currentCity: selectedCity, page, movies, bookings, selectMovie } = useApp();
  const [scrolled, setScrolled]   = useState(false);
  const [dropdown, setDropdown]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [msgHubOpen, setMsgHubOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // close mobile on navigate
  useEffect(() => { setMobileOpen(false); }, [page]);

  // poll unread count
  useEffect(() => {
    if (!currentUser) { setUnreadCount(0); return; }
    apiGetUnreadCount().then(r => { if (r.ok && r.data) setUnreadCount(r.data.count); });
    const iv = setInterval(() => {
      apiGetUnreadCount().then(r => { if (r.ok && r.data) setUnreadCount(r.data.count); });
    }, 12000);
    return () => clearInterval(iv);
  }, [currentUser]);

  const handleSelectMovie = (movie: typeof movies[0]) => {
    selectMovie(movie);
    setSearchPanelOpen(false);
    setMobileOpen(false);
  };

  const roleColor: Record<string, string> = {
    admin: '#ef4444',
    theatre_owner: '#f59e0b',
    user: '#a855f7',
  };
  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    theatre_owner: 'Theatre',
    user: 'User',
  };
  const accentColor = currentUser ? (roleColor[currentUser.role] ?? '#a855f7') : '#a855f7';

  // Avatar is stored in MongoDB and synced via cc_user in localStorage by apiUploadAvatar / login
  const avatarSrc = currentUser?.avatar ?? '';


  const navLinks = [
    { label: 'Movies',   page: 'movies'   as const },
    { label: 'Offers',   page: 'offers'   as const },
    { label: 'Play Zone',page: 'play-zone' as const },
    { label: 'Docs',     page: 'how-it-works' as const },
  ];

  return (
    <>
      <style>{S}</style>

      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 68, zIndex: 1000,
          background: scrolled ? 'rgba(7,2,15,0.97)' : 'rgba(7,2,15,0.82)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          borderBottom: scrolled ? '1px solid rgba(168,85,247,0.22)' : '1px solid rgba(168,85,247,0.1)',
          boxShadow: scrolled ? '0 4px 40px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.3s ease',
          display: 'flex', alignItems: 'center',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #6366f1, #a855f7, #ec4899, #fb7185, transparent)',
          boxShadow: '0 0 12px rgba(168,85,247,0.5)',
        }} />

        <div style={{
          width: '100%', maxWidth: 1400, margin: '0 auto',
          padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24,
        }}>
          {/* ── Logo */}
          <button
            onClick={() => navigate('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
          >
            {/* Mini reel logo */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
              border: '1.5px solid rgba(168,85,247,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168,85,247,0.3)',
              flexShrink: 0,
            }}>
              <Icon.Film />
            </div>
            <span style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22,
              background: 'linear-gradient(135deg, #fff 0%, #c084fc 40%, #f472b6 80%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px', lineHeight: 1,
            }}>
              CineConnect
            </span>
          </button>

          {/* ── Nav Links (desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, marginLeft: 12 }} className="hide-mobile">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => navigate(l.page)} className="nav-link-item"
                style={{ color: page === l.page ? '#c084fc' : undefined }}>
                {l.label}
                {page === l.page && (
                  <span style={{
                    position: 'absolute', bottom: -2, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)',
                    borderRadius: 1, transform: 'scaleX(1)',
                  }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* ── Smart Search Button (desktop) */}
          <div style={{ position: 'relative' }} className="hide-mobile">
            <button
              id="navbar-search-btn"
              onClick={() => setSearchPanelOpen(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: searchPanelOpen ? '1.5px solid rgba(168,85,247,0.7)' : '1.5px solid rgba(168,85,247,0.25)',
                background: searchPanelOpen ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
                color: searchPanelOpen ? '#c084fc' : 'rgba(241,245,249,0.7)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
                boxShadow: searchPanelOpen ? '0 0 16px rgba(168,85,247,0.35), 0 0 0 3px rgba(124,58,237,.15)' : 'none',
                animation: searchPanelOpen ? 'nsp-glow 2s ease-in-out infinite' : 'none',
              }}
              onMouseEnter={e => {
                if (!searchPanelOpen) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.6)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#c084fc';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)';
                }
              }}
              onMouseLeave={e => {
                if (!searchPanelOpen) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.25)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(241,245,249,0.7)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
                }
              }}
            >
              <Icon.Search />
            </button>
          </div>

          {/* ── City pill */}
          <button
            onClick={openCityModal}
            className="hide-mobile"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(99,102,241,0.08)',
              border: '1.5px solid rgba(168,85,247,0.25)',
              color: '#c084fc', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.6)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(168,85,247,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.25)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {/* pulsing dot */}
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7', animation: 'corePulse 2s ease-in-out infinite' }} />
            <Icon.MapPin />
            <span>{selectedCity}</span>
            <Icon.ChevDown />
          </button>

          {/* ── Notifications */}
          <div className="hide-mobile">
            {currentUser && <NotificationDropdown />}
          </div>

          {/* ── Auth / Profile */}
          {currentUser ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdown(!dropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 14px 6px 6px', borderRadius: 100,
                  background: 'rgba(99,102,241,0.08)',
                  border: `1.5px solid ${dropdown ? accentColor + '55' : 'rgba(168,85,247,0.2)'}`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  boxShadow: dropdown ? `0 0 20px ${accentColor}30` : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)`,
                  border: `2px solid ${accentColor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff',
                  boxShadow: `0 0 12px ${accentColor}40`,
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={currentUser.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: "'Outfit',sans-serif", lineHeight: 1.2 }}>
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 10, color: accentColor, fontWeight: 600 }}>
                    {roleLabel[currentUser.role]}
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', transform: dropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <Icon.ChevDown />
                </div>
              </button>

              {/* Dropdown */}
              {dropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 240, borderRadius: 16,
                  background: 'rgba(10,2,25,0.97)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  backdropFilter: 'blur(28px)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1)',
                  overflow: 'hidden',
                  animation: 'navDropIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  zIndex: 9999,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
                    background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
                    borderBottom: '1px solid rgba(168,85,247,0.1)',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}44)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 900, color: '#fff',
                      boxShadow: `0 0 16px ${accentColor}50`,
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={currentUser.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', fontFamily: "'Outfit',sans-serif" }}>{currentUser.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{currentUser.email}</div>
                      <div style={{ marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, boxShadow: `0 0 4px ${accentColor}` }} />
                        <span style={{ fontSize: 10, color: accentColor, fontWeight: 700 }}>{roleLabel[currentUser.role]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {[
                    currentUser.role === 'admin' && { icon: <Icon.Admin />, label: 'Admin Panel', col: '#ef4444', action: () => navigate('admin') },
                    currentUser.role === 'theatre_owner' && { icon: <Icon.Theatre />, label: 'Theatre Dashboard', col: '#f59e0b', action: () => navigate('theatre-owner') },
                    currentUser.role === 'user' && { icon: <Icon.Dashboard />, label: 'My Dashboard', col: '#a855f7', action: () => navigate('user-dashboard') },
                    { icon: <Icon.Bookings />, label: 'My Bookings', col: '#60a5fa', action: () => navigate('my-bookings') },
                    { icon: <Icon.Tag />, label: 'Offers', col: '#34d399', action: () => navigate('offers') },
                    currentUser.role === 'user' && {
                      icon: (
                        <span style={{ position: 'relative', display: 'inline-flex' }}>
                          <span style={{ fontSize: '0.9rem' }}>💬</span>
                          {unreadCount > 0 && (
                            <span style={{
                              position: 'absolute', top: -5, right: -6,
                              width: 14, height: 14, borderRadius: '50%',
                              background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                              fontSize: '0.5rem', fontWeight: 900, color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                          )}
                        </span>
                      ),
                      label: unreadCount > 0 ? `Messages (${unreadCount})` : 'Messages',
                      col: '#d946ef',
                      action: () => setMsgHubOpen(true),
                    },
                  ].filter(Boolean).map((item: any, i) => (
                    <button key={i} onClick={() => { item.action(); setDropdown(false); }}
                      style={{
                        width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        color: 'rgba(241,245,249,0.8)', fontSize: 13, fontFamily: "'Outfit',sans-serif",
                        fontWeight: 600, textAlign: 'left', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${item.col}12`;
                        (e.currentTarget as HTMLButtonElement).style.color = item.col;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'none';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(241,245,249,0.8)';
                      }}
                    >
                      <span style={{ color: item.col, opacity: 0.9 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(168,85,247,0.1)', margin: '4px 0' }} />

                  {/* Logout */}
                  <button
                    onClick={() => { logout(); setDropdown(false); }}
                    style={{
                      width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      color: 'rgba(241,245,249,0.6)', fontSize: 13, fontFamily: "'Outfit',sans-serif",
                      fontWeight: 600, textAlign: 'left', transition: 'all 0.15s ease',
                      marginBottom: 4,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(241,245,249,0.6)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    }}
                  >
                    <span style={{ color: '#ef4444' }}><Icon.LogOut /></span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('auth')}
              style={{
                padding: '9px 22px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                color: '#fff', fontWeight: 800, fontSize: 13,
                fontFamily: "'Outfit',sans-serif",
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 0 rgba(99,102,241,0.4), 0 0 24px rgba(168,85,247,0.3)',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 0 rgba(99,102,241,0.4), 0 0 40px rgba(168,85,247,0.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 rgba(99,102,241,0.4), 0 0 24px rgba(168,85,247,0.3)';
              }}
            >
              Sign In
            </button>
          )}

          {/* ── Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none', width: 38, height: 38, borderRadius: 10,
              background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(168,85,247,0.25)',
              color: 'rgba(241,245,249,0.8)', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
            }}
            className="show-mobile"
          >
            {mobileOpen ? <Icon.X /> : <Icon.Menu />}
          </button>
        </div>

        {/* ── Mobile drawer */}
        {mobileOpen && (
          <div style={{
            position: 'fixed', top: 68, left: 0, right: 0, bottom: 0,
            background: 'rgba(7,2,15,0.97)', backdropFilter: 'blur(28px)',
            zIndex: 999, display: 'flex', flexDirection: 'column', gap: 4, padding: 20,
            borderTop: '1px solid rgba(168,85,247,0.15)',
            animation: 'mobileSlideIn 0.3s ease forwards',
          }}>
            {/* Mobile Search Button */}
            <button
              onClick={() => { setMobileOpen(false); setTimeout(() => setSearchPanelOpen(true), 150); }}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12, marginBottom: 12,
                background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(168,85,247,0.2)',
                color: 'rgba(241,245,249,0.6)', fontSize: 14, fontFamily: 'Inter,sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}
            >
              <Icon.Search />
              <span>Search movies, genres…</span>
            </button>

            {/* Nav links */}
            {navLinks.map(l => (
              <button key={l.page} onClick={() => navigate(l.page)}
                style={{
                  padding: '14px 16px', borderRadius: 12, background: page === l.page ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1px solid ${page === l.page ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
                  color: page === l.page ? '#c084fc' : 'rgba(241,245,249,0.7)',
                  fontSize: 16, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
                  textAlign: 'left', cursor: 'pointer',
                }}>
                {l.label}
              </button>
            ))}

            {/* City */}
            <button onClick={openCityModal}
              style={{
                padding: '14px 16px', borderRadius: 12, background: 'transparent',
                border: '1px solid rgba(168,85,247,0.15)',
                color: '#c084fc', fontSize: 15, fontWeight: 600,
                fontFamily: "'Outfit',sans-serif", textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <Icon.MapPin /> {selectedCity}
            </button>

            {/* Sign in / profile actions */}
            {currentUser ? (
              <>
                <div style={{ height: 1, background: 'rgba(168,85,247,0.1)', margin: '8px 0' }} />
                <button onClick={() => navigate('my-bookings')}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'transparent', border: 'none', color: 'rgba(241,245,249,0.7)', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon.Bookings /> My Bookings
                </button>
                <button onClick={logout}
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon.LogOut /> Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => navigate('auth')}
                style={{
                  margin: '12px 0', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                  color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif",
                }}>
                Sign In →
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Smart Search Panel ── */}
      <NavSearchPanel
        movies={movies}
        bookings={bookings as { movieId: string; movieTitle: string }[]}
        onSelectMovie={handleSelectMovie}
        onClose={() => setSearchPanelOpen(false)}
        isOpen={searchPanelOpen}
      />

      {/* Messaging Hub */}
      {msgHubOpen && currentUser && (
        <MessagingHub
          currentUserId={currentUser.id}
          onClose={() => setMsgHubOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
};
