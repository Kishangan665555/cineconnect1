/**
 * UserProfileModal.tsx — Full Instagram-style profile page modal
 * Shows avatar, bio, follow counts, follow button, message button.
 * Respects privacy: private+not-following shows locked state.
 */
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  apiGetUserProfile, apiGetOrCreateConversation,
  SocialUserProfile, FollowState,
} from '../../services/apiService';
import { FollowButton } from './FollowButton';
import { ChatWindow } from './ChatWindow';

interface Props {
  userId: string;
  onClose: () => void;
}

export const UserProfileModal: React.FC<Props> = ({ userId, onClose }) => {
  const { currentUser } = useApp();
  const [profile, setProfile]       = useState<SocialUserProfile | null>(null);
  const [isPrivate, setIsPrivate]   = useState(false);
  const [followState, setFollowState] = useState<FollowState>('none');
  const [loading, setLoading]       = useState(true);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const [chatOther, setChatOther]   = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError]           = useState('');

  const isMe = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiGetUserProfile(userId).then(r => {
      if (r.ok && r.data) {
        setProfile(r.data.user);
        setIsPrivate(r.data.isPrivate ?? false);
        setFollowState(r.data.followState ?? 'none');
      }
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleMessage = async () => {
    if (!profile) return;
    setMsgLoading(true);
    setError('');
    const r = await apiGetOrCreateConversation(userId);
    setMsgLoading(false);
    if (r.ok && r.data?.conversation) {
      setChatConvId(r.data.conversation.id);
      setChatOther({ id: userId, name: profile.name, avatar: profile.avatar });
    } else {
      setError(r.message || 'Cannot start chat. Follow this user first.');
    }
  };

  const canMessage = !isPrivate || followState === 'following';

  if (chatConvId && chatOther && currentUser) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 480, height: '80vh', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
          <button onClick={() => setChatConvId(null)} style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 100, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>← Profile</button>
          <ChatWindow conversation={{ id: chatConvId, otherUser: chatOther } as any} currentUserId={currentUser.id} onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 28, background: 'linear-gradient(160deg,rgba(18,6,38,0.98),rgba(8,2,22,0.99))', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.08)', overflow: 'hidden', position: 'relative' }}>
        {/* Top gradient bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⋯</div>
            Loading profile…
          </div>
        ) : !profile && isPrivate ? (
          /* Private locked state */
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>Private Account</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Follow this user to see their profile and send messages.</p>
            {!isMe && <FollowButton userId={userId} initialState={followState} onStateChange={setFollowState} />}
          </div>
        ) : profile ? (
          <div>
            {/* Hero banner */}
            <div style={{ height: 80, background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.2),rgba(236,72,153,0.15))' }} />

            {/* Avatar + stats row */}
            <div style={{ padding: '0 24px', marginTop: -40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
                {/* Avatar — always visible, lock badge if private */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.5)', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, color: '#fff', overflow: 'hidden', boxShadow: '0 0 24px rgba(168,85,247,0.35)' }}>
                    {profile.avatar
                      ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : profile.name.charAt(0).toUpperCase()}
                  </div>
                  {isPrivate && followState !== 'following' && !isMe && (
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, border: '2.5px solid rgba(8,2,22,0.99)',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                    }}>🔒</div>
                  )}
                </div>

                {/* Follower stats — only when public or following */}
                {(!isPrivate || followState === 'following' || isMe) && (
                  <div style={{ display: 'flex', gap: 20, paddingBottom: 6 }}>
                    {[
                      { label: 'Followers', val: profile.followersCount ?? 0 },
                      { label: 'Following', val: profile.followingCount ?? 0 },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: 20, fontFamily: "'Outfit',sans-serif" }}>{s.val}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Name + username */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 20, fontFamily: "'Outfit',sans-serif", lineHeight: 1.2 }}>{profile.name}</div>
                {profile.username && (!isPrivate || followState === 'following' || isMe) && (
                  <div style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600, marginTop: 2 }}>@{profile.username}</div>
                )}
              </div>

              {/* Bio + Meta — only when public or following */}
              {(!isPrivate || followState === 'following' || isMe) && (
                <>
                  {profile.bio && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{profile.bio}</p>}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                    {profile.city && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>📍 {profile.city}</span>}
                    {profile.joinDate && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>🗓 Joined {new Date(profile.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
                  </div>
                </>
              )}

              {/* Private lock card — shown instead of bio/meta */}
              {isPrivate && followState !== 'following' && !isMe && (
                <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                  <span style={{ fontSize: 28 }}>🔒</span>
                  <p style={{ color: '#fbbf24', fontWeight: 800, fontSize: 13, margin: 0 }}>Private Account</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Only their profile picture is visible. Follow to see more.</p>
                </div>
              )}

              {/* Action buttons */}
              {!isMe && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  <FollowButton userId={userId} initialState={followState} onStateChange={s => { setFollowState(s); setProfile(p => p ? { ...p } : p); }} />
                  {canMessage && (
                    <button
                      onClick={handleMessage}
                      disabled={msgLoading}
                      style={{
                        flex: 1, padding: '9px 16px', borderRadius: 100,
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        color: '#a78bfa',
                        fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      💬 {msgLoading ? '…' : 'Message'}
                    </button>
                  )}
                </div>
              )}

              {error && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>{error}</p>}
            </div>
          </div>
        ) : (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>User not found</div>
        )}
      </div>
    </div>
  );
};
