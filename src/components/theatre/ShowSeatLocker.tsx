/**
 * ShowSeatLocker — Theatre owner can lock/unlock specific seats for a particular show.
 * Locked seats appear as 🔒 in the seat map and are blocked for that show only.
 */
import React, { useState, useMemo } from 'react';
import { ShowTime, Theatre } from '../../data/store';
import { useApp } from '../../context/AppContext';

interface Props {
  show: ShowTime;
  theatre: Theatre;
  onClose: () => void;
}

const SEAT_COLORS = {
  normal:  { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.40)', text: '#94a3b8' },
  silver:  { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.40)', text: '#cbd5e1' },
  gold:    { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.40)',   text: '#fde047' },
  premium: { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.40)',  text: '#d8b4fe' },
};

type SeatCategory = keyof typeof SEAT_COLORS;

const LOCK_REASONS = [
  'Maintenance', 'VIP Reserved', 'Press Reserved',
  'Damaged', 'Social Distancing', 'Staff Use',
];

const ShowSeatLocker: React.FC<Props> = ({ show, theatre, onClose }) => {
  const { updateShowTime } = useApp();

  // Locked seats are stored on the showtime: show.lockedSeats = { seatId: reason }
  const lockedSeats: Record<string, string> = (show as any).lockedSeats ?? {};

  // Find the screen for this show
  const screen = useMemo(
    () => theatre.screens.find(sc => (show as any).screenId === sc.id) ?? theatre.screens[0],
    [theatre, show]
  );

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [lockReason, setLockReason]     = useState(LOCK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [filterCat, setFilterCat]       = useState<'all' | SeatCategory>('all');
  const [search, setSearch]             = useState('');
  const [bulkMode, setBulkMode]         = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const seats = screen?.seats ?? [];

  const visible = useMemo(() => seats.filter(s => {
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    if (search && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [seats, filterCat, search]);

  // Group rows
  const rows = useMemo(() => {
    const map: Record<string, typeof seats> = {};
    for (const s of visible) {
      const row = s.id[0];
      if (!map[row]) map[row] = [];
      map[row].push(s);
    }
    return map;
  }, [visible]);

  const isLocked = (id: string) => id in lockedSeats;

  const save = (newLocked: Record<string, string>) => {
    updateShowTime(theatre.id, { ...show, lockedSeats: newLocked } as any);
  };

  const lockSeat = (seatId: string, reason: string) => {
    save({ ...lockedSeats, [seatId]: reason });
    setSelectedSeat(null);
    setBulkSelected(new Set());
  };

  const unlockSeat = (seatId: string) => {
    const next = { ...lockedSeats };
    delete next[seatId];
    save(next);
  };

  const unlockAll = () => save({});

  const lockBulk = () => {
    const next = { ...lockedSeats };
    const reason = customReason || lockReason;
    bulkSelected.forEach(id => { next[id] = reason; });
    save(next);
    setBulkSelected(new Set());
  };

  const toggleBulk = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const lockedCount  = Object.keys(lockedSeats).length;
  const bookedCount  = seats.filter(s => s.isBooked).length;
  const availCount   = seats.length - lockedCount - bookedCount;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 900,
        maxHeight: '92vh',
        background: '#0d0d22',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -20px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(90deg,rgba(229,57,53,0.08),transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(229,57,53,0.15)', border: '1px solid rgba(229,57,53,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.8" width="18" height="18">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>
                  Lock Seats — {show.time} · {show.language}
                </h3>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
                  {screen?.name ?? 'Screen'} · {show.date}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Stats pills */}
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)', fontWeight: 700 }}>
              ✓ {availCount} free
            </span>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700 }}>
              🔒 {lockedCount} locked
            </span>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.30)', fontWeight: 700 }}>
              ✕ {bookedCount} booked
            </span>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.01)',
        }}>
          {/* Search */}
          <input
            placeholder="Search seat (A1, B2…)"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              color: 'white', borderRadius: 10, padding: '6px 12px', fontSize: 12, outline: 'none', width: 160,
            }}
          />
          {/* Category filter */}
          {(['all', 'normal', 'silver', 'gold', 'premium'] as const).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid',
              background: filterCat === cat ? 'rgba(229,57,53,0.20)' : 'rgba(255,255,255,0.04)',
              borderColor: filterCat === cat ? 'rgba(229,57,53,0.50)' : 'rgba(255,255,255,0.10)',
              color: filterCat === cat ? '#fca5a5' : '#6b7280',
              textTransform: 'capitalize',
            }}>{cat}</button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Bulk mode toggle */}
          <button onClick={() => { setBulkMode(v => !v); setBulkSelected(new Set()); }} style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: bulkMode ? 'rgba(245,158,11,0.20)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${bulkMode ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.10)'}`,
            color: bulkMode ? '#fcd34d' : '#6b7280',
          }}>
            {bulkMode ? `✓ Bulk (${bulkSelected.size} selected)` : '⊞ Bulk Select'}
          </button>
          {lockedCount > 0 && (
            <button onClick={unlockAll} style={{
              padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
            }}>
              🔓 Unlock All ({lockedCount})
            </button>
          )}
        </div>

        {/* Main content: seat map + lock panel side by side */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Seat Map */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {/* Screen label */}
            <div style={{
              textAlign: 'center', marginBottom: 20,
              color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase',
            }}>
              <div style={{ height: 4, borderRadius: 2, background: 'linear-gradient(90deg,transparent,rgba(229,57,53,0.5),transparent)', marginBottom: 6 }} />
              SCREEN
            </div>

            {Object.entries(rows).map(([row, rowSeats]) => (
              <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#4b5563', fontSize: 11, fontWeight: 700, width: 18, textAlign: 'center', flexShrink: 0 }}>{row}</span>
                {rowSeats.map(seat => {
                  const locked = isLocked(seat.id);
                  const booked = seat.isBooked;
                  const selBulk = bulkSelected.has(seat.id);
                  const sel = selectedSeat === seat.id;
                  const cat = (seat.category ?? 'normal') as SeatCategory;
                  const colors = SEAT_COLORS[cat] ?? SEAT_COLORS.normal;

                  let bg = colors.bg, border = colors.border, color = colors.text;
                  let cursor = 'pointer';
                  let icon = '';

                  if (booked) {
                    bg = 'rgba(55,65,81,0.25)'; border = 'rgba(55,65,81,0.40)'; color = '#374151';
                    cursor = 'not-allowed'; icon = '✕';
                  } else if (locked) {
                    bg = 'rgba(239,68,68,0.18)'; border = 'rgba(239,68,68,0.45)'; color = '#fca5a5';
                    icon = '🔒';
                  } else if (selBulk) {
                    bg = 'rgba(245,158,11,0.25)'; border = 'rgba(245,158,11,0.55)'; color = '#fcd34d';
                  } else if (sel) {
                    bg = 'rgba(229,57,53,0.25)'; border = 'rgba(229,57,53,0.60)'; color = 'white';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={booked}
                      title={locked ? `Locked: ${lockedSeats[seat.id]}` : seat.id}
                      onClick={() => {
                        if (booked) return;
                        if (bulkMode) { toggleBulk(seat.id); return; }
                        if (locked) { unlockSeat(seat.id); return; }
                        setSelectedSeat(sel ? null : seat.id);
                      }}
                      style={{
                        width: 34, height: 34, borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: bg, border: `1.5px solid ${border}`, color,
                        cursor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {icon || seat.id.slice(1)}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                { icon: '✕', color: '#374151', label: 'Booked' },
                { icon: '🔒', color: '#fca5a5', label: 'Locked by you' },
                { icon: '■', color: '#94a3b8', label: 'Normal' },
                { icon: '■', color: '#cbd5e1', label: 'Silver' },
                { icon: '■', color: '#fde047', label: 'Gold' },
                { icon: '■', color: '#d8b4fe', label: 'Premium' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: l.color, fontSize: 12 }}>{l.icon}</span>
                  <span style={{ color: '#4b5563', fontSize: 11 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Panel (right sidebar) */}
          <div style={{
            width: 260, flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            padding: '20px 16px',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.01)',
          }}>
            {/* Bulk lock */}
            {bulkMode && bulkSelected.size > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#fcd34d', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                  Lock {bulkSelected.size} selected seats
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {LOCK_REASONS.map(r => (
                    <button key={r} onClick={() => setLockReason(r)} style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                      background: lockReason === r ? 'rgba(229,57,53,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${lockReason === r ? 'rgba(229,57,53,0.40)' : 'rgba(255,255,255,0.08)'}`,
                      color: lockReason === r ? '#fca5a5' : '#6b7280',
                    }}>{r}</button>
                  ))}
                </div>
                <input
                  placeholder="Custom reason…"
                  value={customReason} onChange={e => setCustomReason(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 8, padding: '7px 10px', fontSize: 11, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                />
                <button onClick={lockBulk} style={{
                  width: '100%', padding: '9px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  background: 'linear-gradient(135deg,#e53935,#b71c1c)', color: 'white', border: 'none',
                  boxShadow: '0 4px 16px rgba(229,57,53,0.35)',
                }}>
                  🔒 Lock {bulkSelected.size} Seats
                </button>
              </div>
            )}

            {/* Single seat lock */}
            {selectedSeat && !bulkMode && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Selected seat</p>
                  <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>{selectedSeat}</p>
                  <p style={{ color: '#6b7280', fontSize: 11, textTransform: 'capitalize' }}>
                    {seats.find(s => s.id === selectedSeat)?.category ?? 'normal'} category
                  </p>
                </div>
                <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Lock reason</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {LOCK_REASONS.map(r => (
                    <button key={r} onClick={() => setLockReason(r)} style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                      background: lockReason === r ? 'rgba(229,57,53,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${lockReason === r ? 'rgba(229,57,53,0.40)' : 'rgba(255,255,255,0.08)'}`,
                      color: lockReason === r ? '#fca5a5' : '#6b7280',
                    }}>{r}</button>
                  ))}
                </div>
                <input
                  placeholder="Or type custom reason…"
                  value={customReason} onChange={e => setCustomReason(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 8, padding: '7px 10px', fontSize: 11, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                />
                <button onClick={() => lockSeat(selectedSeat, customReason || lockReason)} style={{
                  width: '100%', padding: '10px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  background: 'linear-gradient(135deg,#e53935,#b71c1c)', color: 'white', border: 'none',
                  boxShadow: '0 4px 16px rgba(229,57,53,0.35)',
                }}>
                  🔒 Lock Seat {selectedSeat}
                </button>
              </div>
            )}

            {/* Locked seats list */}
            {lockedCount > 0 && (
              <div style={{ marginTop: selectedSeat || (bulkMode && bulkSelected.size > 0) ? 20 : 0 }}>
                <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Locked Seats ({lockedCount})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(lockedSeats).map(([id, reason]) => (
                    <div key={id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)',
                    }}>
                      <div>
                        <span style={{ color: '#fca5a5', fontWeight: 800, fontSize: 12 }}>{id}</span>
                        <p style={{ color: '#6b7280', fontSize: 10, margin: 0 }}>{reason}</p>
                      </div>
                      <button onClick={() => unlockSeat(id)} style={{
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                        color: '#4ade80', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Unlock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!selectedSeat && lockedCount === 0 && !(bulkMode && bulkSelected.size > 0) && (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#374151' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>No seats locked</p>
                <p style={{ fontSize: 11 }}>Click any seat in the map to lock it for this show only.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowSeatLocker;
