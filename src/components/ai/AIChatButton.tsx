/**
 * src/components/ai/AIChatButton.tsx
 * Premium floating AI assistant button — bottom-right of every page
 */
import React, { useState, useEffect, useCallback } from 'react';
import AIChatPopup from './AIChatPopup';
import { useApp } from '../../context/AppContext';

// Pages where the AI button should NOT appear
const HIDDEN_ON_PAGES = ['admin-login', 'admin', 'theatre-owner'];

const AIChatButton: React.FC = () => {
  const { page, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showPulse, setShowPulse] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Animate in after 2s
    const t = setTimeout(() => setMounted(true), 2000);
    // Show label once after 4s
    const t2 = setTimeout(() => { setShowLabel(true); }, 4000);
    const t3 = setTimeout(() => { setShowLabel(false); }, 8000);
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Stop pulse after first open
  const handleOpen = useCallback(() => {
    setOpen(true);
    setShowPulse(false);
    setUnread(0);
    setShowLabel(false);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  if (HIDDEN_ON_PAGES.includes(page)) return null;
  if (!mounted) return null;

  return (
    <>
      {/* Floating button */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 99998,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Label tooltip */}
        {showLabel && !open && (
          <div style={{
            background: 'rgba(10,10,25,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            padding: '8px 14px',
            color: '#e0e0ff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
            pointerEvents: 'none',
            animation: 'aiLabelFadeIn 0.4s ease',
            fontFamily: "'Outfit', sans-serif",
          }}>
            👋 Need help? Ask AI!
          </div>
        )}

        {/* Main button */}
        <button
          id="ai-chat-button"
          onClick={handleOpen}
          title="CineConnect AI Assistant"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.5), 0 0 0 0 rgba(168,85,247,0.4)',
            position: 'relative',
            transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease',
            pointerEvents: 'auto',
            animation: open ? 'none' : 'aiBtnFloat 3s ease-in-out infinite',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget;
            b.style.transform = 'scale(1.12)';
            b.style.boxShadow = '0 12px 40px rgba(99,102,241,0.7), 0 0 0 0 rgba(168,85,247,0)';
          }}
          onMouseLeave={e => {
            const b = e.currentTarget;
            b.style.transform = 'scale(1)';
            b.style.boxShadow = '0 8px 32px rgba(99,102,241,0.5), 0 0 0 0 rgba(168,85,247,0.4)';
          }}
        >
          {/* Pulse ring */}
          {showPulse && (
            <>
              <span style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: '2px solid rgba(168,85,247,0.6)',
                animation: 'aiPulseRing 2s ease-out infinite',
              }} />
              <span style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '2px solid rgba(99,102,241,0.3)',
                animation: 'aiPulseRing 2s ease-out infinite 0.5s',
              }} />
            </>
          )}

          {/* Icon */}
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9"  cy="11" r="1" fill="white" />
              <circle cx="12" cy="11" r="1" fill="white" />
              <circle cx="15" cy="11" r="1" fill="white" />
            </svg>
          )}

          {/* Unread badge */}
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#ec4899',
              color: 'white',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #07071a',
            }}>
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Chat Popup */}
      <AIChatPopup
        open={open}
        onClose={handleClose}
        currentUser={currentUser}
      />

      {/* CSS animations injected globally */}
      <style>{`
        @keyframes aiPulseRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes aiBtnFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes aiLabelFadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aiSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiTypingDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes aiMessageIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AIChatButton;
