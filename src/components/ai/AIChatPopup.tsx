/**
 * src/components/ai/AIChatPopup.tsx
 * Premium glassmorphism AI chat popup — tabs: Chat | Quick Help | Contact Us
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import ChatWindow from './ChatWindow';
import QuickActions from './QuickActions';
import ContactSupport from './ContactSupport';
import { apiGetUserAIContext, apiGetAIStatus, UserAIContext } from '../../services/aiService';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: any;
}

type Tab = 'chat' | 'quick' | 'contact';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat',    label: 'AI Chat',   icon: '🤖' },
  { id: 'quick',   label: 'Quick Help', icon: '⚡' },
  { id: 'contact', label: 'Contact Us', icon: '📞' },
];

const AIChatPopup: React.FC<Props> = ({ open, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [userContext, setUserContext] = useState<UserAIContext | null>(null);
  const [aiMode, setAiMode] = useState<'gemini' | 'fallback'>('fallback');
  const [isMobile, setIsMobile] = useState(false);
  const [chatTriggerMessage, setChatTriggerMessage] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load user context + AI status when opened
  useEffect(() => {
    if (!open) return;
    apiGetAIStatus().then(s => setAiMode(s.mode === 'gemini' ? 'gemini' : 'fallback'));
    if (currentUser) {
      apiGetUserAIContext().then(ctx => setUserContext(ctx));
    }
  }, [open, currentUser]);

  // Quick action handler — switch to chat with pre-set message
  const handleQuickAction = useCallback((message: string) => {
    setChatTriggerMessage(message);
    setActiveTab('chat');
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const popupStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(7,7,26,0.97)',
        backdropFilter: 'blur(32px)',
        borderRadius: 0,
      }
    : {
        position: 'fixed',
        bottom: 100,
        right: 28,
        width: 400,
        height: 620,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(155deg, rgba(10,10,30,0.97) 0%, rgba(15,5,35,0.97) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: 24,
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        overflow: 'hidden',
        animation: 'aiSlideUp 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
      };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99998 }}
        />
      )}

      <div ref={popupRef} style={popupStyle}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px 14px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.12) 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                flexShrink: 0,
              }}>
                🎬
              </div>
              <div>
                <div style={{
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.2,
                }}>
                  CineConnect AI
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #22c55e',
                    animation: 'aiBtnFloat 2s ease-in-out infinite',
                  }} />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                    {aiMode === 'gemini' ? 'Powered by Gemini AI' : 'AI Support Online'} • Always available
                  </span>
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.2)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)';
                (e.currentTarget as HTMLButtonElement).style.color = '#f472b6';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              ×
            </button>
          </div>

          {/* User greeting if logged in */}
          {currentUser && userContext && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(99,102,241,0.1)',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.15)',
              fontSize: 12,
              color: 'rgba(200,200,255,0.85)',
              fontFamily: "'Outfit', sans-serif",
            }}>
              👋 Hi <strong style={{ color: '#c084fc' }}>{userContext.name}</strong>!
              {userContext.lastBooking
                ? ` Last booking: ${userContext.lastBooking.movieTitle} on ${userContext.lastBooking.showDate} 🎟️`
                : ' How can I help you today?'
              }
            </div>
          )}
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(99,102,241,0.12)',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '11px 4px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#c084fc' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
                borderBottom: activeTab === tab.id ? '2px solid #a855f7' : '2px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id)
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && (
            <ChatWindow
              currentUser={currentUser}
              userContext={userContext}
              triggerMessage={chatTriggerMessage}
              onTriggerConsumed={() => setChatTriggerMessage(null)}
            />
          )}
          {activeTab === 'quick' && (
            <QuickActions onAction={handleQuickAction} />
          )}
          {activeTab === 'contact' && (
            <ContactSupport currentUser={currentUser} />
          )}
        </div>
      </div>
    </>
  );
};

export default AIChatPopup;
