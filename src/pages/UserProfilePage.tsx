/**
 * UserProfilePage.tsx
 * /profile/:userId — shows OWN full dashboard if self, else public social profile
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  apiGetUserProfile, apiFollowUser, apiUnfollowUser,
  apiGetOrCreateConversation, apiGetFollowers, apiGetFollowing,
  apiGetOtherUserBookings,
  SocialUserProfile, FollowState, ConversationSummary,
} from '../services/apiService';
import { ChatWindow } from '../components/social/ChatWindow';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const Avatar: React.FC<{ src?: string; name: string; size?: number }> = ({ src, name, size = 80 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: src ? 'transparent' : 'linear-gradient(135deg,#6366f1,#a855f7)',
    border: '3px solid rgba(168,85,247,0.5)',
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35, fontWeight: 900, color: '#fff',
    boxShadow: '0 0 20px rgba(99,102,241,0.35)',
  }}>
    {src
      ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      : name.charAt(0).toUpperCase()}
  </div>
);

const StatBox: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', minWidth: 80 }}>
    <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.25rem', fontFamily: "'Outfit',sans-serif" }}>{value}</div>
    <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

/* ── follow button ────────────────────────────────────────────────────────── */
const FollowBtn: React.FC<{ state: FollowState; onFollow: () => void; onUnfollow: () => void; loading: boolean }> =
  ({ state, onFollow, onUnfollow, loading }) => {
    if (state === 'following') return (
      <button onClick={onUnfollow} disabled={loading} style={{ padding: '10px 28px', borderRadius: 100, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", transition: 'all .2s' }}>
        {loading ? '…' : '✓ Following'}
      </button>
    );
    if (state === 'requested') return (
      <button disabled style={{ padding: '10px 28px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontWeight: 700, fontSize: 13, cursor: 'not-allowed', fontFamily: "'Outfit',sans-serif" }}>
        ⏳ Requested
      </button>
    );
    return (
      <button onClick={onFollow} disabled={loading} style={{ padding: '10px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 4px 15px rgba(99,102,241,0.4)', transition: 'all .2s' }}>
        {loading ? '…' : '+ Follow'}
      </button>
    );
  };

/* ── Booking card (public) ────────────────────────────────────────────────── */
const BookingCard: React.FC<{ b: any }> = ({ b }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.3s' }} className="hover:-translate-y-1 hover:border-indigo-500/30">
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 40, height: 56, borderRadius: 8, overflow: 'hidden', background: '#333', flexShrink: 0 }}>
        <img src={b.movieId?.poster || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>🎬 {b.movieId?.title || b.movieTitle}</div>
        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{b.theatreId?.name || b.theatreName}</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
      <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '4px 10px', borderRadius: 8, color: '#c4b5fd', fontSize: 11, fontWeight: 700 }}>🎟️ Watched on {b.showDate}</div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────── */
export const UserProfilePage: React.FC = () => {
  const { currentUser, profileUserId, goBack, navigate, navigateToProfile, getUserBookings } = useApp();

  const isSelf = !profileUserId || profileUserId === currentUser?.id;

  // If self → redirect to full dashboard
  useEffect(() => {
    if (isSelf) navigate('user-dashboard');
  }, [isSelf, navigate]);

  /* ── Remote profile data ── */
  const [profile, setProfile]       = useState<SocialUserProfile | null>(null);
  const [followState, setFollowState] = useState<FollowState>('none');
  const [isPrivate, setIsPrivate]   = useState(false);
  const [followers, setFollowers]   = useState<SocialUserProfile[]>([]);
  const [following, setFollowing]   = useState<SocialUserProfile[]>([]);
  const [publicBookings, setPublicBookings] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab]               = useState<'bookings' | 'followers' | 'following'>('followers');
  const [chatConv, setChatConv] = useState<ConversationSummary | null>(null);

  const load = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const r = await apiGetUserProfile(profileUserId);
      if (r.ok && r.data) {
        setProfile(r.data.user);
        setFollowState(r.data.followState);
        setIsPrivate(r.data.isPrivate);
      }
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => { load(); }, [load]);

  /* load social lists when tabs opened */
  useEffect(() => {
    if (!profileUserId) return;
    if (tab === 'followers') {
      apiGetFollowers().then(r => { if (r.ok && r.data?.followers) setFollowers(r.data.followers); });
    } else if (tab === 'following') {
      apiGetFollowing().then(r => { if (r.ok && r.data?.following) setFollowing(r.data.following); });
    } else if (tab === 'bookings') {
      apiGetOtherUserBookings(profileUserId).then(r => { 
        if (r.ok && r.data?.bookings) {
          const today = new Date().toISOString().split('T')[0];
          // only show past confirmed bookings
          setPublicBookings(r.data.bookings.filter(b => b.status === 'confirmed' && b.showDate < today));
        }
      });
    }
  }, [tab, profileUserId]);

  const handleFollow = async () => {
    if (!profileUserId) return;
    setFollowLoading(true);
    const r = await apiFollowUser(profileUserId);
    if (r.ok && r.data?.state) setFollowState(r.data.state);
    setFollowLoading(false);
  };

  const handleUnfollow = async () => {
    if (!profileUserId) return;
    setFollowLoading(true);
    const r = await apiUnfollowUser(profileUserId);
    if (r.ok && r.data?.state) setFollowState(r.data.state);
    setFollowLoading(false);
  };

  const handleMessage = async () => {
    if (!profileUserId || !profile) return;
    const r = await apiGetOrCreateConversation(profileUserId);
    if (r.ok && r.data?.conversation) {
      const conv = r.data.conversation;
      // Build a ConversationSummary-compatible object for ChatWindow
      const convObj: ConversationSummary = {
        ...conv,
        otherUser: { id: profileUserId, name: profile.name, avatar: profile.avatar },
      };
      setChatConv(convObj);
    }
  };

  /* ── own bookings shared on profile (public) ── */
  // Removed faulty logic that used getUserBookings()
  
  if (isSelf) return null; // redirecting

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)', paddingBottom: 60, fontFamily: "'Outfit',sans-serif" }}>

      {/* Chat overlay */}
      {chatConv && currentUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, height: '80vh', borderRadius: 24, overflow: 'hidden' }}>
            <ChatWindow conversation={chatConv} currentUserId={currentUser.id} onClose={() => setChatConv(null)} />
          </div>
        </div>
      )}

      {/* ── Back bar ── */}
      <div style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={goBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          ← Back
        </button>
        <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem' }}>
          {loading ? 'Loading…' : profile?.name ?? 'User Profile'}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading profile…</div>
      ) : !profile ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>User not found</p>
          <button onClick={goBack} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', cursor: 'pointer' }}>Go Back</button>
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

          {/* ── Profile header ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '32px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            {/* bg glow */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' as const }}>
              {/* Avatar always visible */}
              <div style={{ position: 'relative' }}>
                <Avatar src={profile.avatar} name={profile.name} size={90} />
                {isPrivate && followState !== 'following' && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, border: '2.5px solid rgba(15,15,26,1)',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                  }}>🔒</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>{profile.name}</h1>
                {profile.username && !isPrivate && <div style={{ color: '#a78bfa', fontSize: 13, marginTop: 2 }}>@{profile.username}</div>}

                {/* Only show details when public OR following */}
                {(!isPrivate || followState === 'following') && (
                  <>
                    {profile.city && <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>📍 {profile.city}</div>}
                    {profile.bio && <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{profile.bio}</p>}
                  </>
                )}

                {/* Private notice */}
                {isPrivate && followState !== 'following' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#fbbf24', fontSize: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 14px', width: 'fit-content' }}>
                    🔒 Private account · Follow to see their profile
                  </div>
                )}
              </div>
            </div>

            {/* ── Stat row — only when public or following ── */}
            {(!isPrivate || followState === 'following') && (
              <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' as const }}>
                <StatBox label="Followers" value={profile.followersCount} />
                <StatBox label="Following" value={profile.followingCount} />
              </div>
            )}

            {/* ── Action buttons ── */}
            {currentUser && (
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                <FollowBtn state={followState} onFollow={handleFollow} onUnfollow={handleUnfollow} loading={followLoading} />

                {/* Message button — only if NOT private, OR if already following */}
                {(!isPrivate || followState === 'following') && (
                  <button
                    onClick={handleMessage}
                    style={{
                      padding: '10px 28px', borderRadius: 100,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#34d399', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    💬 Message
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Private notice — hide all tabs/content ── */}
          {isPrivate && followState !== 'following' ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.4))' }}>🔒</div>
              <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Private Account</p>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Only their profile picture is visible.</p>
              <p style={{ color: '#475569', fontSize: 12 }}>Follow this user to see their posts, followers, and activity.</p>
            </div>
          ) : (
            <>
              {/* ── Tabs ── */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
                {([
                  { key: 'followers' as const, label: '👥 Followers' },
                  { key: 'following' as const, label: '✨ Following' },
                  { key: 'bookings' as const, label: '🎬 Bookings' },
                ] as const).map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
                    background: tab === t.key ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'transparent',
                    color: tab === t.key ? 'white' : '#64748b', transition: 'all .2s',
                  }}>{t.label}</button>
                ))}
              </div>

              {/* ── Followers list ── */}
              {tab === 'followers' && (
                followers.length === 0
                  ? <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No followers yet.</p>
                  : <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {followers.map(u => (
                      <div key={u.id} onClick={() => navigateToProfile(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, cursor: 'pointer' }}>
                        <Avatar src={u.avatar} name={u.name} size={44} />
                        <div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{u.name}</div>{u.username && <div style={{ color: '#a78bfa', fontSize: 12 }}>@{u.username}</div>}</div>
                      </div>
                    ))}
                  </div>
              )}

              {/* ── Following list ── */}
              {tab === 'following' && (
                following.length === 0
                  ? <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>Not following anyone yet.</p>
                  : <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {following.map(u => (
                      <div key={u.id} onClick={() => navigateToProfile(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, cursor: 'pointer' }}>
                        <Avatar src={u.avatar} name={u.name} size={44} />
                        <div><div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{u.name}</div>{u.username && <div style={{ color: '#a78bfa', fontSize: 12 }}>@{u.username}</div>}</div>
                      </div>
                    ))}
                  </div>
              )}

              {/* ── Bookings ── */}
              {tab === 'bookings' && (
                publicBookings.length === 0
                  ? <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>{isPrivate && followState !== 'following' ? 'Bookings are private' : 'No public bookings yet.'}</p>
                  : <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    {publicBookings.map(b => <BookingCard key={b._id || b.id} b={b} />)}
                  </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
