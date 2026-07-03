import React, { useEffect, useState } from 'react';

interface TermsModalProps {
  onClose: () => void;
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(onAccept, 300);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', pointerEvents: isVisible ? 'auto' : 'none'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
          opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease'
        }}
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '600px',
        backgroundColor: 'rgba(15,3,5,0.95)', border: '1px solid rgba(255,100,50,0.3)',
        borderRadius: '24px', padding: '32px 40px', overflow: 'hidden',
        boxShadow: '0 32px 100px rgba(0,0,0,0.9), 0 0 60px rgba(255,100,30,0.15)',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        opacity: isVisible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        
        {/* Glow border pulse */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '24px', pointerEvents: 'none',
          boxShadow: 'inset 0 0 20px rgba(255,100,30,0.2)', opacity: 0.5
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Cine Connect User Terms</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Last updated: V1.0</p>
          </div>
          <button 
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', 
              borderRadius: '50%', color: '#fff', fontSize: '18px', cursor: 'pointer', transition: '0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,100,30,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ×
          </button>
        </div>

        <div style={{
          maxHeight: '55vh', overflowY: 'auto', paddingRight: '12px',
          color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6',
          fontFamily: "'Inter', sans-serif"
        }}>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', margin: 0 }}>
            <li>Users must provide correct login and registration details.</li>
            <li>Users are responsible for account security.</li>
            <li>Fraudulent bookings or misuse may lead to suspension.</li>
            <li>Personal data is handled according to privacy policy.</li>
            <li>Users must follow platform rules respectfully.</li>
            <li>Theatre timings and availability depend on theatre owners.</li>
            <li>Payment disputes follow Cine Connect refund policies.</li>
            <li>Cine Connect may update features and policies anytime.</li>
            <li>OTP/password sharing is user responsibility.</li>
            <li>By continuing, user agrees to all terms.</li>
          </ol>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={handleClose}
            style={{
              padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            Decline
          </button>
          
          <button 
            onClick={handleAccept}
            style={{
              padding: '12px 32px', background: 'linear-gradient(135deg, #fb923c, #ec4899)', 
              border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(251,146,60,0.4)', transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};
