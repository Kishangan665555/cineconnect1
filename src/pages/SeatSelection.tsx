import React, { useMemo, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Seat, SeatCategory } from '../data/store';
import { apiGetSeatMates, apiGetSeatMatesAuth, SeatMateUser, apiGetShows } from '../services/apiService';
import { SeatAvatarOverlay } from '../components/social/SeatAvatarOverlay';
import { ChatWindow } from '../components/social/ChatWindow';
import { apiGetOrCreateConversation, ConversationSummary } from '../services/apiService';
import { SeatExperienceModal, TheatreViewData } from '../components/SeatExperienceModal';

const CATEGORY_COLORS: Record<SeatCategory, {
  bg: string; border: string; selected: string; label: string; text: string;
}> = {
  normal:  { bg: 'bg-white/20',      border: 'border-white/30',      selected: 'bg-blue-500 border-blue-400',    label: 'Normal',  text: 'text-blue-400'   },
  silver:  { bg: 'bg-gray-400/30',   border: 'border-gray-400/50',   selected: 'bg-indigo-500 border-indigo-400',label: 'Silver',  text: 'text-indigo-400' },
  gold:    { bg: 'bg-yellow-600/30', border: 'border-yellow-600/50', selected: 'bg-yellow-500 border-yellow-400',label: 'Gold',    text: 'text-yellow-400' },
  premium: { bg: 'bg-rose-700/30',   border: 'border-rose-600/50',   selected: 'bg-rose-500 border-rose-400',    label: 'Premium', text: 'text-rose-400'   },
};

/* Anonymous booked-seat avatar — used for seed-data seats with no real user */
const AnonSeat: React.FC<{ category: SeatCategory }> = ({ category }) => {
  const colors: Record<SeatCategory, string> = {
    normal: '#6366f1', silver: '#94a3b8', gold: '#d97706', premium: '#e11d48',
  };
  return (
    <div
      title="Seat booked"
      style={{
        width: 22, height: 22, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${colors[category]}cc, ${colors[category]}55)`,
        border: `2px solid ${colors[category]}99`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: 'rgba(255,255,255,0.7)',
        boxShadow: `0 0 6px ${colors[category]}55`,
        flexShrink: 0,
      }}
    >
      👤
    </div>
  );
};

export const SeatSelection: React.FC = () => {
  const {
    selectedMovie, selectedTheatre, selectedShowTime, selectedDate,
    selectedSeats, toggleSeat, navigate, currentUser,
    navigateToProfile,
    // Access full store for all-user seat visibility
    bookings: allLocalBookings,
    users: allUsers,
  } = useApp() as any;

  const theatre = selectedTheatre;

  // Try embedded showTimes first (seed/legacy), then fetch from backend Show model
  const embeddedShow = theatre?.showTimes?.find((s: any) => s.id === selectedShowTime);
  const [backendShow, setBackendShow] = useState<any>(null);

  useEffect(() => {
    if (embeddedShow || !selectedShowTime || !theatre) return;
    // Only fetch from backend if not found locally
    apiGetShows().then(res => {
      const shows: any[] = (res.data as any)?.data || (res.data as any)?.shows || [];
      const found = shows.find((s: any) =>
        String(s._id || s.id) === String(selectedShowTime) ||
        (String(s.theatreId?._id || s.theatreId) === String(theatre._id || theatre.id))
      );
      if (found) setBackendShow(found);
    }).catch(() => {});
  }, [embeddedShow, selectedShowTime, theatre]);

  // Unified show object
  const show = embeddedShow || (backendShow ? {
    id:             String(backendShow._id || backendShow.id),
    time:           backendShow.time || '',
    date:           backendShow.date || selectedDate,
    language:       backendShow.language || '',
    format:         backendShow.format || '2D',
    movieId:        String(backendShow.movieId?._id || backendShow.movieId || ''),
    totalSeats:     backendShow.totalSeats || 100,
    availableSeats: backendShow.availableSeats ?? backendShow.totalSeats ?? 100,
    isEnded:        backendShow.isEnded ?? false,
    lockedSeats:    {},
    priceOverride:  backendShow.prices || {},
  } : null);

  const screen  = theatre?.screens[0];
  const seats   = useMemo(() => screen?.seats || [], [screen]);

  const showLockedSeats: Record<string, string> = useMemo(
    () => ((show as any)?.lockedSeats ?? {}),
    [show]
  );

  // ── Seat-mates: public fetch (works for everyone) + auth overlay for isMe flag ──
  const [seatMateMap, setSeatMateMap] = useState<Record<string, SeatMateUser>>({});
  const [apiLoaded, setApiLoaded]     = useState(false);
  const [chatConv, setChatConv]       = useState<ConversationSummary | null>(null);
  const [experienceSeat, setExperienceSeat] = useState<Seat | null>(null);

  // Load theatre view data from localStorage
  const viewData: TheatreViewData | undefined = useMemo(() => {
    try {
      const raw = localStorage.getItem(`cc_view_${theatre?.id}`);
      return raw ? JSON.parse(raw) : undefined;
    } catch { return undefined; }
  }, [theatre?.id]);

  useEffect(() => {
    if (!selectedShowTime) return;
    setApiLoaded(false);
    setSeatMateMap({});

    // Step 1: Public fetch — no login required, shows ALL booked seat avatars
    apiGetSeatMates(selectedShowTime)
      .then(r => {
        if (r.ok && r.data?.seatMap) {
          const publicMap = r.data.seatMap;

          // Step 2: If logged in, overlay the auth version to get accurate isMe flags
          if (currentUser) {
            apiGetSeatMatesAuth(selectedShowTime)
              .then(ar => {
                if (ar.ok && ar.data?.seatMap) {
                  // Merge: auth version takes priority (has correct isMe)
                  setSeatMateMap({ ...publicMap, ...ar.data.seatMap });
                } else {
                  setSeatMateMap(publicMap);
                }
              })
              .catch(() => setSeatMateMap(publicMap))
              .finally(() => setApiLoaded(true));
          } else {
            setSeatMateMap(publicMap);
            setApiLoaded(true);
          }
        } else {
          setApiLoaded(true);
        }
      })
      .catch(() => setApiLoaded(true));
  }, [selectedShowTime, currentUser]);

  // ── Build a COMPLETE merged seat map visible to ALL users ─────────────────
  // Priority: backend API data > local bookings (covers seed data & offline)
  const mergedSeatMap = useMemo<Record<string, SeatMateUser & { _fromLocal?: boolean }>>(() => {
    // Start with whatever the backend API returned
    const merged: Record<string, SeatMateUser & { _fromLocal?: boolean }> = { ...seatMateMap };

    // Walk through ALL local bookings for this show
    const showBookings: any[] = (allLocalBookings || []).filter(
      (b: any) =>
        (b.showTimeId === selectedShowTime || b.showId === selectedShowTime) &&
        b.status === 'confirmed'
    );

    showBookings.forEach((booking: any) => {
      // Resolve the booking user from the local store
      let bookingUser: any =
        // Check current user first
        (currentUser && booking.userId === currentUser.id) ? currentUser
        // Then search full users list
        : (allUsers || []).find((u: any) => u.id === booking.userId)
        ?? null;

      booking.seats.forEach((seatId: string) => {
        const isOwn = bookingUser?.id === currentUser?.id;
        const priv  = !isOwn && !!(bookingUser as any)?.isPrivate;

        if (!merged[seatId]) {
          if (bookingUser) {
            merged[seatId] = {
              userId:     String(bookingUser.id),
              name:       priv ? 'Private Account' : bookingUser.name,
              avatar:     priv ? ''                : (bookingUser.avatar ?? ''),
              username:   priv ? '\ud83d\udd12 Private'       : (bookingUser.username ?? bookingUser.name),
              isMe:       isOwn,
              isPrivate:  priv,
              _fromLocal: true,
            };
          }
        } else if (!merged[seatId].isMe && currentUser && booking.userId === currentUser.id) {
          merged[seatId] = { ...merged[seatId], isMe: true, isPrivate: false };
        }
      });
    });

    return merged;
  }, [seatMateMap, allLocalBookings, allUsers, currentUser, selectedShowTime]);

  const openChat = async (userId: string, name: string, avatar: string) => {
    const r = await apiGetOrCreateConversation(userId);
    if (r.ok && r.data?.conversation) {
      const conv = r.data.conversation;
      setChatConv({
        ...conv,
        otherUser: { id: userId, name, avatar },
      });
    }
  };

  const groupedByRow = useMemo(() => {
    const groups: Record<string, Seat[]> = {};
    seats.forEach(s => {
      if (!groups[s.row]) groups[s.row] = [];
      groups[s.row].push(s);
    });
    return groups;
  }, [seats]);

  const totalAmount    = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(totalAmount * 0.05);

  if (!selectedMovie || !theatre || !show) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-white text-xl font-bold mb-2">Show Not Found</p>
          <p className="text-gray-400 text-sm mb-6">
            {!selectedMovie
              ? 'No movie selected. Please select a movie first.'
              : !theatre
              ? 'No theatre selected. Please pick a theatre and showtime.'
              : 'The selected showtime could not be found.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {selectedMovie && (
              <button onClick={() => navigate('movie-detail')} className="bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                ← Back to Movie
              </button>
            )}
            <button onClick={() => navigate('home')} className="bg-[#e53935] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#c62828] transition-colors">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categories    = [...new Set(seats.map(s => s.category))];
  const catPrices: Record<SeatCategory, number> = {} as Record<SeatCategory, number>;
  seats.forEach(s => { catPrices[s.category] = s.price; });

  const totalSeats     = seats.length;
  const bookedSeats    = seats.filter(s => s.isBooked).length;
  const blockedSeats   = seats.filter(s => (s.isBlocked && !s.isBooked) || showLockedSeats[s.id]).length;
  const availableSeats = totalSeats - bookedSeats - blockedSeats;

  return (
    <div className="min-h-screen bg-[#0f0f1a] pb-36">
      {/* Seat Experience Modal */}
      {experienceSeat && theatre && screen && (
        <SeatExperienceModal
          seat={experienceSeat}
          allSeats={seats}
          screen={screen}
          theatreId={theatre.id}
          movieTitle={selectedMovie?.title ?? ''}
          viewData={viewData}
          onClose={() => setExperienceSeat(null)}
        />
      )}

      {/* Chat window using ConversationSummary */}
      {chatConv && currentUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, height: '80vh', borderRadius: 24, overflow: 'hidden' }}>
            <ChatWindow conversation={chatConv} currentUserId={currentUser.id} onClose={() => setChatConv(null)} />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-[#1a1a2e] border-b border-white/10 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1">
              <h1 className="text-white font-bold text-lg">{selectedMovie.title}</h1>
              <p className="text-gray-400 text-sm">
                {theatre.name} · {show.time} · {selectedDate} ·{' '}
                <span className="text-blue-400">{show.language}</span> ·{' '}
                <span className="text-yellow-400">{show.format}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-400">✓ {availableSeats} available</span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">✕ {bookedSeats} booked</span>
              {blockedSeats > 0 && (
                <>
                  <span className="text-gray-500">|</span>
                  <span className="text-orange-400">🚫 {blockedSeats} blocked</span>
                </>
              )}
              <button onClick={() => navigate('movie-detail')} className="text-gray-400 hover:text-white transition-colors ml-2">
                ← Change Show
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6">
        {/* ── Screen ── */}
        <div className="text-center mb-8">
          <div className="relative mx-auto max-w-2xl">
            <div className="h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mx-8 mb-1" />
            <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full mx-16 mb-4" />
            <p className="text-gray-500 text-xs uppercase tracking-widest">All Eyes This Way Please!</p>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-white/10 border border-white/20" />
            <span className="text-gray-400 text-xs">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-green-500 border border-green-400" />
            <span className="text-gray-400 text-xs">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: '2px solid rgba(168,85,247,0.7)' }} />
            <span className="text-gray-400 text-xs">Booked by user (hover to interact)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'radial-gradient(circle, #6366f166, #6366f133)', border: '2px solid #6366f155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>👤</div>
            <span className="text-gray-400 text-xs">Booked (anonymous)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-orange-500/40 border border-orange-500/60" />
            <span className="text-gray-400 text-xs">Blocked</span>
          </div>
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-sm ${CATEGORY_COLORS[cat].bg} border ${CATEGORY_COLORS[cat].border}`} />
              <span className={`text-xs ${CATEGORY_COLORS[cat].text}`}>
                {CATEGORY_COLORS[cat].label} ₹{catPrices[cat]}
              </span>
            </div>
          ))}
        </div>

        {/* ── Seat Map ── */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {Object.entries(groupedByRow).map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-1 sm:gap-2 mb-1.5">
                <div className="w-6 text-gray-500 text-xs font-bold text-right flex-shrink-0">{row}</div>
                <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                  {rowSeats.sort((a, b) => a.col - b.col).map((seat, i) => {
                    const isSelected   = selectedSeats.some(s => s.id === seat.id);
                    const isAisle      = i === Math.floor(rowSeats.length / 2) - 1;
                    const isShowLocked = !!showLockedSeats[seat.id];
                    const seatMate     = mergedSeatMap[seat.id];

                    // A seat is unavailable if locally booked/blocked OR backend says it's taken
                    const isUnavailable = seat.isBooked || seat.isBlocked || isShowLocked || !!seatMate;

                    return (
                      <React.Fragment key={seat.id}>
                        {/* ── Any booked seat → show avatar overlay → click → profile ── */}
                        {seatMate ? (
                          <SeatAvatarOverlay
                            seatId={seat.id}
                            user={seatMate}
                            onViewProfile={seatMate.isMe
                              ? () => navigate('user-dashboard')  // own seat → own dashboard
                              : navigateToProfile                  // other user → their profile
                            }
                            onMessage={openChat}
                          />

                        /* ── Locally booked (seed data) but no real user known ── */
                        ) : seat.isBooked && apiLoaded ? (
                          <AnonSeat category={seat.category} />

                        /* ── Blocked / locked ── */
                        ) : (
                          /* ── Available / selected seat with 👁 hover preview ── */
                          <div style={{ position: 'relative', display: 'inline-block' }}
                               className="group">
                            <button
                              onClick={() => toggleSeat(seat)}
                              disabled={isUnavailable}
                              title={
                                isShowLocked
                                  ? `${seat.id} — 🔒 Locked: ${showLockedSeats[seat.id]}`
                                  : seat.isBlocked
                                  ? `${seat.id} — Blocked: ${seat.blockedReason || 'Unavailable'}`
                                  : seat.isBooked
                                  ? `${seat.id} — Booked`
                                  : `${seat.id} — ${CATEGORY_COLORS[seat.category].label} — ₹${seat.price}`
                              }
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm text-[8px] sm:text-[9px] font-bold transition-all border ${
                                isShowLocked
                                  ? 'bg-yellow-500/20 border-yellow-500/40 cursor-not-allowed opacity-80'
                                  : seat.isBlocked && !seat.isBooked
                                  ? 'bg-orange-500/30 border-orange-500/50 cursor-not-allowed opacity-70'
                                  : seat.isBooked
                                  ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                                  : isSelected
                                  ? 'bg-green-500 border-green-400 scale-110 text-white shadow-lg shadow-green-900/50'
                                  : `${CATEGORY_COLORS[seat.category].bg} ${CATEGORY_COLORS[seat.category].border} hover:scale-110 hover:border-white/60 cursor-pointer`
                              }`}
                            >
                              {isShowLocked ? '🔒' : seat.isBlocked && !seat.isBooked ? '🚫' : isSelected ? '✓' : ''}
                            </button>
                            {/* 👁 mini preview — visible on hover for available seats */}
                            {!isUnavailable && screen && (
                              <button
                                onClick={e => { e.stopPropagation(); setExperienceSeat(seat); }}
                                title={`Preview view from ${seat.id}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                style={{
                                  position: 'absolute', top: -8, right: -8, zIndex: 20,
                                  width: 14, height: 14, borderRadius: '50%',
                                  background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                                  border: 'none', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 7, color: 'white',
                                  boxShadow: '0 2px 8px rgba(99,102,241,0.6)',
                                }}
                              >
                                👁
                              </button>
                            )}
                          </div>
                        )}
                        {isAisle && <div className="w-3 sm:w-4" />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="w-6 text-gray-500 text-xs font-bold flex-shrink-0">{row}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Sticky Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10 shadow-2xl z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {selectedSeats.length === 0 ? (
            <div className="text-center text-gray-400 py-2">Select seats to continue</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSeats.map(s => (
                    <span key={s.id} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg font-medium">
                      {s.id} ({CATEGORY_COLORS[s.category].label})
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} × avg ₹{Math.round(totalAmount / selectedSeats.length)}
                  </span>
                  <span className="text-gray-500">+₹{convenienceFee} fee</span>
                  <span className="text-white font-bold">Total: ₹{totalAmount + convenienceFee}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {selectedSeats.length > 0 && (
                  <button
                    onClick={() => setExperienceSeat(selectedSeats[0])}
                    style={{
                      padding: '10px 20px', borderRadius: 12,
                      background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))',
                      border: '1px solid rgba(168,85,247,0.4)',
                      color: '#a78bfa', fontWeight: 800, fontSize: 13,
                      cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(168,85,247,0.35))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))')}
                  >
                    <span style={{ fontSize: 16 }}>👁</span>
                    <span>View Experience</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('payment')}
                  className="bg-[#e53935] hover:bg-[#c62828] text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-red-900/50 w-full sm:w-auto"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
