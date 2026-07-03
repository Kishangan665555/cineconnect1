/**
 * FollowButton.tsx — Reusable follow/unfollow/requested button
 */
import React, { useState } from 'react';
import { apiFollowUser, apiUnfollowUser, FollowState } from '../../services/apiService';

interface Props {
  userId: string;
  initialState: FollowState;
  onStateChange?: (state: FollowState) => void;
  size?: 'sm' | 'md';
}

export const FollowButton: React.FC<Props> = ({ userId, initialState, onStateChange, size = 'md' }) => {
  const [state, setState] = useState<FollowState>(initialState);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (state === 'none' || state === 'requested') {
        const r = await apiFollowUser(userId);
        if (r.ok && r.data) { setState(r.data.state); onStateChange?.(r.data.state); }
      } else {
        const r = await apiUnfollowUser(userId);
        if (r.ok && r.data) { setState(r.data.state); onStateChange?.(r.data.state); }
      }
    } finally {
      setLoading(false);
    }
  };

  const cfg = {
    none:      { label: 'Follow',     bg: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none' },
    following: { label: 'Following ✓', bg: 'rgba(99,102,241,0.12)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.4)' },
    requested: { label: 'Requested…',  bg: 'rgba(168,85,247,0.1)',  color: '#c084fc', border: '1px solid rgba(168,85,247,0.35)' },
  };
  const c = cfg[state];
  const pad = size === 'sm' ? '6px 16px' : '9px 22px';
  const fs  = size === 'sm' ? 12 : 13;

  return (
    <button
      onClick={handle}
      disabled={loading}
      style={{
        padding: pad, borderRadius: 100, border: c.border,
        background: c.bg, color: c.color,
        fontSize: fs, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: loading ? 0.7 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '…' : c.label}
    </button>
  );
};
