import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Booking, SeatCategory } from '../../data/store';

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface ScanResult {
  valid: boolean;
  booking?: Booking;
  message: string;
  scannedId?: string;
}

interface Props {
  bookings: Booking[];
  theatreId?: string;
  onCancelTicket?: (id: string) => void;
}

/* ── Category style ─────────────────────────────────────────────────────────── */
const CAT: Record<SeatCategory, { bg: string; text: string; border: string }> = {
  normal:  { bg: 'bg-slate-500/30',   text: 'text-slate-300',   border: 'border-slate-400/40' },
  silver:  { bg: 'bg-indigo-500/30',  text: 'text-indigo-300',  border: 'border-indigo-400/40' },
  gold:    { bg: 'bg-amber-500/30',   text: 'text-amber-300',   border: 'border-amber-400/40' },
  premium: { bg: 'bg-rose-500/30',    text: 'text-rose-300',    border: 'border-rose-400/40' },
};

/* ── Mini QR renderer (visual only) ────────────────────────────────────────── */
const MiniQR: React.FC<{ value: string; size?: number }> = ({ value, size = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cells = 21;
    const cellSize = size / cells;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    // Seed deterministic grid from value
    const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (i: number) => Math.sin(seed * 9301 + i * 49297 + 233) * 0.5 + 0.5;
    // Position detection squares (3 corners)
    const drawDetect = (ox: number, oy: number) => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(ox * cellSize, oy * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#fff';
      ctx.fillRect((ox + 1) * cellSize, (oy + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect((ox + 2) * cellSize, (oy + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };
    drawDetect(0, 0); drawDetect(14, 0); drawDetect(0, 14);
    // Data cells
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
        if (rng(r * cells + c) > 0.48) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated' }} />;
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN SCANNER COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const TicketScanner: React.FC<Props> = ({ bookings, theatreId, onCancelTicket }) => {
  const [tab, setTab]                   = useState<'camera' | 'manual' | 'history'>('camera');
  const [scanning, setScanning]         = useState(false);
  const [cameraError, setCameraError]   = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [manualId, setManualId]         = useState('');
  const [result, setResult]             = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory]   = useState<ScanResult[]>([]);
  const [processing, setProcessing]     = useState(false);
  const [scanCount, setScanCount]       = useState(0);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  /* ── Verify a booking ID ─────────────────────────────────────────────────── */
  const verify = useCallback((raw: string) => {
    if (processing) return;
    const id = raw.replace(/^BMS-/i, '').trim();
    if (!id) return;

    setProcessing(true);
    setScanCount(n => n + 1);

    // Simulate a brief processing delay for realism
    setTimeout(() => {
      const booking = bookings.find(b =>
        b.id === id ||
        b.id === raw ||
        `BMS-${b.id}` === raw.toUpperCase()
      );

      let res: ScanResult;
      if (!booking) {
        res = { valid: false, message: 'No booking found for this ID.', scannedId: id };
      } else if (booking.status === 'cancelled') {
        res = { valid: false, booking, message: 'Ticket has been CANCELLED — entry not allowed.', scannedId: id };
      } else if (theatreId && booking.theatreId !== theatreId) {
        res = { valid: false, booking, message: 'This ticket is for a different theatre.', scannedId: id };
      } else {
        res = { valid: true, booking, message: 'Ticket is VALID — Allow Entry ✓', scannedId: id };
      }

      setResult(res);
      setScanHistory(h => [{ ...res, scannedAt: new Date().toLocaleTimeString() } as ScanResult, ...h.slice(0, 19)]);
      setProcessing(false);
    }, 800);
  }, [bookings, theatreId, processing]);

  /* ── Camera ──────────────────────────────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
    setScannerReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setResult(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScannerReady(true);
        setScanning(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, then try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found on this device. Use Manual Entry instead.');
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => { if (tab !== 'camera') stopCamera(); }, [tab, stopCamera]);

  /* ── Stats ───────────────────────────────────────────────────────────────── */
  const myBookings  = theatreId ? bookings.filter(b => b.theatreId === theatreId) : bookings;
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayBks    = myBookings.filter(b => b.showDate === todayStr);
  const validToday  = todayBks.filter(b => b.status === 'confirmed').length;
  const cancelToday = todayBks.filter(b => b.status === 'cancelled').length;

  /* ── Reset ───────────────────────────────────────────────────────────────── */
  const reset = () => { setResult(null); setManualId(''); };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        {/* Glow orbs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #e53935, transparent)' }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #e53935, #c62828)' }}>
                📷
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Ticket Scanner</h1>
                <p className="text-purple-300 text-sm">Entry verification system</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">SYSTEM ONLINE</span>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-xs">{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3">
            {[
              { label: "Today's Shows", val: todayBks.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Valid',         val: validToday,       color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Cancelled',     val: cancelToday,      color: 'text-red-400',  bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Scanned',       val: scanCount,        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map(s => (
              <div key={s.label} className={`text-center px-3 py-2 rounded-2xl border ${s.bg} min-w-[60px]`}>
                <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-white/50 text-[10px] font-medium leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5 border border-white/10">
        {[
          { id: 'camera', icon: '📷', label: 'Camera Scan' },
          { id: 'manual', icon: '⌨️', label: 'Manual Entry' },
          { id: 'history', icon: '📋', label: `History (${scanHistory.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === t.id
                ? 'text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={tab === t.id ? { background: 'linear-gradient(135deg, #e53935, #c62828)' } : {}}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-5 gap-6">

        {/* LEFT PANEL (3 cols) */}
        <div className="xl:col-span-3 space-y-4">

          {/* ══ CAMERA TAB ═══════════════════════════════════════════════════ */}
          {tab === 'camera' && (
            <div className="rounded-3xl overflow-hidden border border-white/10"
              style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f20 100%)' }}>

              {/* Viewfinder */}
              <div className="relative bg-black" style={{ aspectRatio: '16/10' }}>
                {/* Live video */}
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

                {/* Dark overlay with hole */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* top */}
                    <div className="absolute top-0 left-0 right-0 h-[calc(50%-100px)] bg-black/60" />
                    {/* bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-100px)] bg-black/60" />
                    {/* left */}
                    <div className="absolute top-[calc(50%-100px)] left-0 w-[calc(50%-100px)] h-[200px] bg-black/60" />
                    {/* right */}
                    <div className="absolute top-[calc(50%-100px)] right-0 w-[calc(50%-100px)] h-[200px] bg-black/60" />
                  </div>
                )}

                {/* Not scanning — placeholder */}
                {!scanning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}>
                    {/* Animated camera icon */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
                        style={{ background: 'linear-gradient(135deg, rgba(229,57,53,0.2), rgba(124,58,237,0.2))', border: '2px solid rgba(229,57,53,0.3)' }}>
                        📷
                      </div>
                      <div className="absolute -inset-2 rounded-[2rem] animate-ping opacity-20"
                        style={{ border: '2px solid #e53935' }} />
                    </div>
                    <p className="text-white text-lg font-bold mb-1">Ready to Scan</p>
                    <p className="text-gray-400 text-sm text-center px-8 mb-6">
                      Point camera at the QR code on the customer's ticket
                    </p>
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-5"
                      style={{ backgroundImage: 'linear-gradient(rgba(229,57,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(229,57,53,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #2a0a0a 100%)' }}>
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-red-400 font-bold text-center mb-2">Camera Unavailable</p>
                    <p className="text-gray-400 text-sm text-center mb-4">{cameraError}</p>
                    <button onClick={() => { setCameraError(''); startCamera(); }}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #e53935, #c62828)' }}>
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Scanner frame + laser line */}
                {scanning && scannerReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Scanner box */}
                    <div className="relative w-48 h-48">
                      {/* Corner brackets */}
                      {[['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', ''],
                        ['top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', ''],
                        ['bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', ''],
                        ['bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl', '']
                      ].map(([cls], i) => (
                        <div key={i} className={`absolute w-8 h-8 ${cls}`}
                          style={{ borderColor: '#e53935', filter: 'drop-shadow(0 0 6px #e53935)' }} />
                      ))}

                      {/* Laser scan line */}
                      <div ref={scanLineRef} className="absolute left-1 right-1 h-0.5 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #e53935, #ff5252, #e53935, transparent)',
                          boxShadow: '0 0 8px 2px rgba(229,57,53,0.6)',
                          animation: 'scannerLaser 2s ease-in-out infinite',
                          top: '10%',
                        }} />

                      {/* Center crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 opacity-60">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-400" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-red-400" />
                        </div>
                      </div>
                    </div>

                    {/* Status pill */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(229,57,53,0.2)', border: '1px solid rgba(229,57,53,0.4)', color: '#ff5252' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        SCANNING FOR QR CODE
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing overlay */}
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-t-red-500 border-r-purple-500 border-b-blue-500 border-l-transparent animate-spin mx-auto mb-3" />
                      <p className="text-white font-bold">Verifying Ticket…</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera controls */}
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  {!scanning ? (
                    <button onClick={startCamera}
                      className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #e53935, #c62828)', boxShadow: '0 4px 20px rgba(229,57,53,0.4)' }}>
                      <span className="text-lg">📷</span>
                      Start Camera Scanner
                    </button>
                  ) : (
                    <button onClick={stopCamera}
                      className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/15 border border-white/20"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc' }}>
                      <span>⏹</span> Stop Camera
                    </button>
                  )}
                  <button onClick={reset}
                    className="px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-white/10 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                    🔄 Reset
                  </button>
                </div>

                {/* Demo scan buttons */}
                <div>
                  <p className="text-gray-600 text-xs text-center mb-2">⚡ Quick verify (demo bookings)</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {bookings.slice(0, 5).map(b => (
                      <button key={b.id} onClick={() => verify(b.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-white/10 border border-white/10"
                        style={{
                          background: b.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: b.status === 'confirmed' ? '#4ade80' : '#f87171',
                          borderColor: b.status === 'confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        }}>
                        BMS-{b.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MANUAL TAB ═══════════════════════════════════════════════════ */}
          {tab === 'manual' && (
            <div className="rounded-3xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f20 100%)' }}>
              {/* Header decoration */}
              <div className="relative h-32 flex items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #e53935 0%, transparent 60%)' }} />
                <div className="text-center relative z-10">
                  <div className="text-5xl mb-2">🎫</div>
                  <p className="text-white font-bold text-lg">Manual Ticket Verification</p>
                  <p className="text-gray-400 text-xs mt-1">Enter the booking ID from the customer's ticket</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Big input */}
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Booking ID</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">BMS-</span>
                    <input
                      value={manualId}
                      onChange={e => setManualId(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && verify(manualId)}
                      placeholder="b1"
                      className="w-full pl-14 pr-4 py-4 rounded-2xl text-white text-lg font-mono font-bold placeholder-gray-600 border focus:outline-none focus:ring-2 focus:ring-red-500"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>

                {/* Verify button */}
                <button onClick={() => verify(manualId)} disabled={!manualId.trim() || processing}
                  className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #e53935, #c62828)', boxShadow: '0 4px 24px rgba(229,57,53,0.4)' }}>
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <><span>🔍</span> Verify Ticket</>
                  )}
                </button>

                {/* Quick-fill */}
                <div>
                  <p className="text-gray-600 text-xs text-center mb-3">⚡ Quick-fill from existing bookings</p>
                  <div className="grid grid-cols-2 gap-2">
                    {bookings.slice(0, 6).map(b => (
                      <button key={b.id} onClick={() => setManualId(b.id)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all hover:scale-102 border"
                        style={{
                          background: b.status === 'confirmed' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          borderColor: b.status === 'confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          color: b.status === 'confirmed' ? '#4ade80' : '#f87171',
                        }}>
                        <span>{b.status === 'confirmed' ? '✓' : '✗'}</span>
                        <div className="text-left">
                          <div>BMS-{b.id}</div>
                          <div className="text-[10px] font-normal opacity-70 truncate max-w-24">{b.movieTitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="rounded-2xl p-4 border"
                  style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
                  <p className="text-blue-400 font-bold text-xs mb-2 flex items-center gap-2"><span>ℹ️</span> How to use</p>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li className="flex gap-2"><span className="text-blue-400">1.</span> Ask customer to show their ticket (My Bookings)</li>
                    <li className="flex gap-2"><span className="text-blue-400">2.</span> Find the Booking ID (e.g. BMS-b1) on their ticket</li>
                    <li className="flex gap-2"><span className="text-blue-400">3.</span> Enter the ID above and click Verify</li>
                    <li className="flex gap-2"><span className="text-blue-400">4.</span> 🟢 GREEN = allow entry · 🔴 RED = deny entry</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ══ HISTORY TAB ══════════════════════════════════════════════════ */}
          {tab === 'history' && (
            <div className="rounded-3xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f20 100%)' }}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold">Recent Scans</h3>
                {scanHistory.length > 0 && (
                  <button onClick={() => setScanHistory([])}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear</button>
                )}
              </div>
              {scanHistory.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="text-5xl mb-3 opacity-20">📋</div>
                  <p className="text-gray-500 font-medium">No scans yet</p>
                  <p className="text-gray-600 text-sm mt-1">Scanned tickets will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                  {scanHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${h.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {h.valid ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-mono font-bold">BMS-{h.scannedId}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {h.valid ? 'VALID' : 'INVALID'}
                          </span>
                        </div>
                        {h.booking && (
                          <p className="text-gray-500 text-xs truncate">{h.booking.movieTitle} · {h.booking.showTime}</p>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs flex-shrink-0">{(h as ScanResult & { scannedAt?: string }).scannedAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL (2 cols) — Result */}
        <div className="xl:col-span-2 space-y-4">

          {/* ── RESULT CARD ──────────────────────────────────────────────── */}
          {result ? (
            <div className={`rounded-3xl overflow-hidden border transition-all duration-500 ${
              result.valid
                ? 'border-green-500/30'
                : 'border-red-500/30'
            }`}
              style={{
                background: result.valid
                  ? 'linear-gradient(180deg, rgba(34,197,94,0.05) 0%, #0a0a1a 100%)'
                  : 'linear-gradient(180deg, rgba(239,68,68,0.05) 0%, #0a0a1a 100%)',
              }}>

              {/* Status header */}
              <div className="relative p-6 text-center overflow-hidden"
                style={{
                  background: result.valid
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.10))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.10))',
                }}>
                {/* Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-32 h-32 rounded-full blur-3xl opacity-30 ${result.valid ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>

                {/* Big icon with ring animation */}
                <div className="relative inline-block mb-4">
                  <div className={`text-6xl ${result.valid ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.6s', animationIterationCount: 3 }}>
                    {result.valid ? '✅' : '❌'}
                  </div>
                  <div className={`absolute -inset-2 rounded-full animate-ping opacity-30 ${result.valid ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ animationDuration: '1s', animationIterationCount: 2 }} />
                </div>

                {/* Status pill */}
                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm border ${
                  result.valid
                    ? 'bg-green-500/20 text-green-300 border-green-400/40'
                    : 'bg-red-500/20 text-red-300 border-red-400/40'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${result.valid ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {result.valid ? '✓ VALID TICKET — ALLOW ENTRY' : '✗ INVALID — DENY ENTRY'}
                </div>

                <p className={`mt-3 text-sm font-medium ${result.valid ? 'text-green-200' : 'text-red-200'}`}>
                  {result.message}
                </p>
              </div>

              {/* Booking details */}
              {result.booking && (
                <div className="p-5 space-y-4">
                  {/* Movie info */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'rgba(229,57,53,0.2)' }}>🎬</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{result.booking.movieTitle}</p>
                      <p className="text-gray-400 text-xs">{result.booking.theatreName}</p>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: '🆔', label: 'Booking ID', val: `BMS-${result.booking.id}`, mono: true },
                      { icon: '📅', label: 'Show Date',  val: result.booking.showDate },
                      { icon: '🕐', label: 'Show Time',  val: result.booking.showTime },
                      { icon: '💺', label: 'Seats',      val: result.booking.seats.join(', ') },
                      { icon: '💳', label: 'Paid',       val: `₹${result.booking.finalAmount}` },
                      { icon: '📊', label: 'Status',     val: result.booking.status.toUpperCase() },
                    ].map(({ icon, label, val, mono }) => (
                      <div key={label} className="p-3 rounded-xl border border-white/8"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">{icon}</span>
                          <span className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</span>
                        </div>
                        <p className={`text-white text-xs font-bold ${mono ? 'font-mono' : ''} truncate`}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Seat categories */}
                  {result.booking.seatDetails?.length > 0 && (
                    <div className="p-3 rounded-xl border border-white/8"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-2">Seat Details</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.booking.seatDetails.map(s => (
                          <span key={s.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${CAT[s.category]?.bg} ${CAT[s.category]?.text} ${CAT[s.category]?.border}`}>
                            {s.id} · {s.category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QR code display */}
                  <div className="p-4 rounded-2xl border border-white/10 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="rounded-xl overflow-hidden p-2 bg-white flex-shrink-0">
                      <MiniQR value={result.booking.id} size={64} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-1">Ticket QR Code</p>
                      <p className="text-white font-mono text-sm font-bold">BMS-{result.booking.id}</p>
                      <p className="text-gray-500 text-xs mt-1 truncate">{result.booking.bookingDate}</p>
                    </div>
                  </div>

                  {/* Cancellation info */}
                  {result.booking.status === 'cancelled' && (
                    <div className="p-4 rounded-2xl border border-red-500/20"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <p className="text-red-400 text-xs font-bold mb-2 flex items-center gap-1.5"><span>⚠️</span> Cancellation Info</p>
                      {result.booking.cancelledAt && <p className="text-red-300 text-sm">Cancelled: {result.booking.cancelledAt}</p>}
                      {result.booking.refundAmount && <p className="text-red-300 text-sm">Refund: ₹{result.booking.refundAmount}</p>}
                    </div>
                  )}

                  {/* Cancel button (for valid tickets only) */}
                  {result.valid && result.booking.status === 'confirmed' && onCancelTicket && (
                    <>
                      {!cancelConfirm ? (
                        <button onClick={() => setCancelConfirm(true)}
                          className="w-full py-2.5 rounded-2xl text-sm font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                          ❌ Cancel This Ticket
                        </button>
                      ) : (
                        <div className="p-4 rounded-2xl border border-red-500/30"
                          style={{ background: 'rgba(239,68,68,0.08)' }}>
                          <p className="text-red-300 text-sm font-bold text-center mb-3">Cancel and issue full refund?</p>
                          <div className="flex gap-2">
                            <button onClick={() => { onCancelTicket(result.booking!.id); reset(); setCancelConfirm(false); }}
                              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700">
                              Yes, Cancel
                            </button>
                            <button onClick={() => setCancelConfirm(false)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold text-white border border-white/10 hover:bg-white/10">
                              Keep Ticket
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Scan next button */}
                  <button onClick={() => { reset(); setCancelConfirm(false); }}
                    className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:bg-white/10 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>
                    🔄 Scan Next Ticket
                  </button>
                </div>
              )}

              {/* No booking found */}
              {!result.booking && (
                <div className="p-5 space-y-3">
                  <div className="p-4 rounded-2xl border border-red-500/20 text-center"
                    style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <p className="text-red-300 text-sm">
                      No booking found for <span className="font-mono font-bold">BMS-{result.scannedId}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">The booking ID may be incorrect or deleted</p>
                  </div>
                  <button onClick={reset}
                    className="w-full py-2.5 rounded-2xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>
                    🔄 Try Again
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Awaiting scan placeholder */
            <div className="rounded-3xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f20 100%)' }}>
              <div className="p-8 flex flex-col items-center justify-center text-center" style={{ minHeight: 320 }}>
                {/* Pulsing scanner icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
                    🎟️
                  </div>
                  <div className="absolute -inset-3 rounded-[2rem] opacity-20 animate-ping"
                    style={{ border: '2px solid #e53935', animationDuration: '2s' }} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Awaiting Scan</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Scan a QR code with the camera<br />or enter a booking ID manually
                </p>

                {/* Instruction steps */}
                <div className="mt-6 w-full space-y-2 text-left">
                  {[
                    { step: '1', text: 'Start camera or switch to Manual Entry', icon: '📷' },
                    { step: '2', text: 'Point at customer\'s ticket QR code', icon: '🎯' },
                    { step: '3', text: 'Verification result appears instantly', icon: '⚡' },
                  ].map(s => (
                    <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #e53935, #c62828)' }}>{s.step}</div>
                      <span className="text-sm mr-2">{s.icon}</span>
                      <span className="text-gray-400 text-xs">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TODAY'S SHOW SCHEDULE ─────────────────────────────────────── */}
          <div className="rounded-3xl border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f20 100%)' }}>
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Today's Booking Summary
              </h3>
            </div>
            {todayBks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No bookings for today's shows</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                {todayBks.slice(0, 8).map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => { verify(b.id); }}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">{b.movieTitle}</p>
                      <p className="text-gray-500 text-[10px]">{b.showTime} · {b.seats.length} seats</p>
                    </div>
                    <span className="text-gray-600 text-[10px] font-mono">BMS-{b.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scan line animation keyframe (injected via style tag) */}
      <style>{`
        @keyframes scannerLaser {
          0%   { top: 8%;  opacity: 0; }
          10%  { opacity: 1; }
          50%  { top: 85%; opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 8%;  opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TicketScanner;
