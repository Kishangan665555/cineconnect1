/**
 * src/components/ai/QuickActions.tsx
 * Smart pre-built quick action buttons for common support scenarios
 */
import React from 'react';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  message: string;
  color: string;
  glow: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'book',
    icon: '🎟️',
    label: 'Book Tickets',
    message: 'How do I book movie tickets on CineConnect?',
    color: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
    glow: 'rgba(99,102,241,0.4)',
  },
  {
    id: 'cancel',
    icon: '❌',
    label: 'Cancel Ticket',
    message: 'How do I cancel my ticket and get a refund?',
    color: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
    glow: 'rgba(239,68,68,0.3)',
  },
  {
    id: 'refund',
    icon: '💰',
    label: 'Refund Help',
    message: 'What is the refund policy and how long does a refund take?',
    color: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
    glow: 'rgba(34,197,94,0.3)',
  },
  {
    id: 'payment',
    icon: '💳',
    label: 'Payment Issue',
    message: 'My payment was deducted but I did not get a booking confirmation. What should I do?',
    color: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
    glow: 'rgba(251,191,36,0.3)',
  },
  {
    id: 'seats',
    icon: '🪑',
    label: 'Seat Selection',
    message: 'How does seat selection work? What are the different seat categories?',
    color: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))',
    glow: 'rgba(168,85,247,0.4)',
  },
  {
    id: 'razorpay',
    icon: '🔧',
    label: 'Razorpay Issue',
    message: 'I am having a problem with Razorpay payment. How can I fix it?',
    color: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    id: 'offers',
    icon: '🎁',
    label: 'Offers Today',
    message: 'What offers and coupon codes are available today on CineConnect?',
    color: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))',
    glow: 'rgba(236,72,153,0.3)',
  },
  {
    id: 'movies',
    icon: '🎬',
    label: 'Movie Suggestions',
    message: 'Can you suggest some popular movies available on CineConnect right now?',
    color: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    id: 'login',
    icon: '🔐',
    label: 'Login Help',
    message: 'I am having trouble logging in or forgot my password. Can you help?',
    color: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    id: 'download',
    icon: '📥',
    label: 'Download Ticket',
    message: 'How do I download or view my e-ticket?',
    color: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))',
    glow: 'rgba(52,211,153,0.3)',
  },
  {
    id: 'bug',
    icon: '🐛',
    label: 'Report Bug',
    message: 'I want to report a bug or technical issue with CineConnect.',
    color: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'human',
    icon: '👤',
    label: 'Speak to Human',
    message: 'I want to speak with a human support agent. How can I contact the support team directly?',
    color: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.06))',
    glow: 'rgba(168,85,247,0.4)',
  },
];

interface Props {
  onAction: (message: string) => void;
}

const QuickActions: React.FC<Props> = ({ onAction }) => {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(168,85,247,0.3) transparent' }}>
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: "'Outfit', sans-serif",
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        Tap a topic to get instant help
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            id={`qa-${action.id}`}
            onClick={() => onAction(action.message)}
            style={{
              padding: '14px 12px',
              borderRadius: 14,
              border: `1px solid ${action.glow.replace('0.4', '0.2').replace('0.3', '0.15')}`,
              background: action.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              transition: 'all 0.25s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = 'translateY(-2px)';
              b.style.boxShadow = `0 8px 24px ${action.glow}`;
              b.style.borderColor = action.glow;
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = 'translateY(0)';
              b.style.boxShadow = 'none';
              b.style.borderColor = action.glow.replace('0.4', '0.2').replace('0.3', '0.15');
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{action.icon}</span>
            <span style={{
              color: 'rgba(230,225,255,0.9)',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1.3,
            }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: 16,
        padding: '12px',
        background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 12,
        fontSize: 12,
        color: 'rgba(200,180,255,0.7)',
        fontFamily: "'Outfit', sans-serif",
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        💡 <strong>Tip:</strong> Switch to the <em>AI Chat</em> tab for custom questions not listed here!
      </div>
    </div>
  );
};

export default QuickActions;
