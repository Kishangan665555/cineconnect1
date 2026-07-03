import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { validateTicketQR } from '../../lib/qrcode';
import { Booking } from '../../data/store';

interface ScanResult {
  valid: boolean;
  booking?: Booking;
  ticketData?: {
    bookingId: string;
    movieTitle: string;
    theatreName: string;
    showDate: string;
    showTime: string;
    seats: string[];
    finalAmount: number;
    userId: string;
  };
  error?: string;
  rawData?: string;
}

interface QRScannerProps {
  bookings: Booking[];
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ bookings, onClose }) => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning]     = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [tab, setTab]               = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const divId = 'qr-scanner-region';

  // ── Initialize scanner ─────────────────────────────────────────────────────
  const startScanner = useCallback(() => {
    if (scannerRef.current) return;

    try {
      scannerRef.current = new Html5QrcodeScanner(
        divId,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          supportedScanTypes: [],
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false,
      );

      scannerRef.current.render(
        // onSuccess
        (decodedText) => {
          handleScan(decodedText);
          // Stop scanner after first successful scan
          scannerRef.current?.clear().catch(() => {});
          scannerRef.current = null;
        },
        // onError — ignore frame decode errors
        () => {},
      );

      setScanning(true);
    } catch (err) {
      console.error('Scanner init failed:', err);
    }
  }, []); // eslint-disable-line

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (tab === 'camera') {
      // Small delay to let the DOM element render
      const t = setTimeout(startScanner, 300);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [tab]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => stopScanner(), []); // eslint-disable-line

  // ── Process scanned data ───────────────────────────────────────────────────
  const handleScan = useCallback((rawData: string) => {
    const validation = validateTicketQR(rawData);

    if (!validation.valid || !validation.data) {
      setScanResult({ valid: false, error: validation.error || 'Invalid QR code', rawData });
      return;
    }

    const td = validation.data;
    // Look up the booking in our records
    const booking = bookings.find(b => b.id === td.bookingId);

    if (!booking) {
      setScanResult({
        valid: false,
        error: `Booking ID "${td.bookingId}" not found in the system.`,
        ticketData: td,
        rawData,
      });
      return;
    }

    if (booking.status === 'cancelled') {
      setScanResult({
        valid: false,
        booking,
        ticketData: td,
        error: 'This ticket has been CANCELLED. Entry denied.',
        rawData,
      });
      return;
    }

    setScanResult({ valid: true, booking, ticketData: td, rawData });
  }, [bookings]);

  // ── Manual entry ───────────────────────────────────────────────────────────
  const handleManualScan = () => {
    if (!manualInput.trim()) return;
    handleScan(manualInput.trim());
  };

  const resetScan = () => {
    setScanResult(null);
    setManualInput('');
    if (tab === 'camera') {
      setTimeout(startScanner, 300);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
        {([
          { key: 'camera', label: '📷 Camera Scan' },
          { key: 'manual', label: '⌨️ Manual Input' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => { setScanResult(null); setTab(t.key); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-[#e53935] text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Camera tab ── */}
      {tab === 'camera' && !scanResult && (
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-400 text-xs">
              📷 Allow camera access when prompted. Point the camera at the customer's QR code on their ticket (from the CineConnect app or My Bookings page).
            </p>
          </div>
          {/* html5-qrcode mounts the UI inside this div */}
          <div id={divId} className="rounded-xl overflow-hidden [&_#qr-shaded-region]:rounded-xl [&_video]:rounded-xl" />
          {scanning && (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Scanner active — waiting for QR code…
            </div>
          )}
        </div>
      )}

      {/* ── Manual tab ── */}
      {tab === 'manual' && !scanResult && (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <label className="text-gray-400 text-xs mb-2 block font-medium">Paste QR data or Booking ID</label>
            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder='Paste the raw QR code JSON string here, e.g: {"bid":"b_12345","mov":"Stree 2",...}'
              rows={5}
              className="w-full bg-white/10 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e53935] resize-none font-mono"
            />
            <button
              onClick={handleManualScan}
              disabled={!manualInput.trim()}
              className="mt-3 w-full bg-[#e53935] text-white font-bold py-3 rounded-xl hover:bg-[#c62828] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔍 Validate Ticket
            </button>
          </div>

          {/* Quick search by booking ID */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <label className="text-gray-400 text-xs mb-2 block font-medium">Or search by Booking ID directly</label>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="e.g. b_1234567890"
                className="flex-1 bg-white/10 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e53935] font-mono"
              />
              <button
                onClick={() => {
                  // Direct booking ID lookup
                  const booking = bookings.find(b =>
                    b.id === manualInput.trim() ||
                    b.id.toLowerCase().includes(manualInput.trim().toLowerCase())
                  );
                  if (booking) {
                    setScanResult({
                      valid: booking.status === 'confirmed',
                      booking,
                      error: booking.status === 'cancelled' ? 'Ticket is CANCELLED. Entry denied.' : undefined,
                    });
                  } else {
                    setScanResult({ valid: false, error: `No booking found with ID: ${manualInput}` });
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Lookup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan Result ── */}
      {scanResult && (
        <div className="space-y-4">
          {/* Valid / Invalid banner */}
          <div className={`rounded-2xl p-5 border text-center ${
            scanResult.valid
              ? 'bg-green-500/15 border-green-500/40'
              : 'bg-red-500/15 border-red-500/40'
          }`}>
            <div className="text-5xl mb-2">{scanResult.valid ? '✅' : '❌'}</div>
            <h3 className={`text-xl font-black mb-1 ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {scanResult.valid ? 'VALID TICKET — ALLOW ENTRY' : 'INVALID TICKET — DENY ENTRY'}
            </h3>
            {!scanResult.valid && scanResult.error && (
              <p className="text-red-300 text-sm mt-1">{scanResult.error}</p>
            )}
          </div>

          {/* Booking details */}
          {scanResult.booking && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/10 pb-3">
                Booking Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Booking ID', value: scanResult.booking.id.slice(0, 16).toUpperCase(), mono: true },
                  { label: 'Status', value: scanResult.booking.status.toUpperCase(), color: scanResult.booking.status === 'confirmed' ? 'text-green-400' : 'text-red-400' },
                  { label: 'Movie', value: scanResult.booking.movieTitle },
                  { label: 'Theatre', value: scanResult.booking.theatreName },
                  { label: 'Show Date', value: scanResult.booking.showDate },
                  { label: 'Show Time', value: scanResult.booking.showTime },
                  { label: 'Seats', value: scanResult.booking.seats.join(', ') },
                  { label: 'Amount', value: `₹${scanResult.booking.finalAmount}` },
                  { label: 'Payment', value: scanResult.booking.paymentMethod },
                  { label: 'Booked On', value: scanResult.booking.bookingDate },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-xs font-bold ${item.color || 'text-white'} ${item.mono ? 'font-mono' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Seat details */}
              {scanResult.booking.seatDetails.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Seat Details</p>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.booking.seatDetails.map(s => (
                      <div key={s.id} className="bg-white/10 rounded-lg px-2.5 py-1.5 text-center border border-white/10">
                        <p className="text-white font-bold text-sm font-mono">{s.id}</p>
                        <p className="text-gray-500 text-xs capitalize">{s.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No booking found but QR was valid crypto-format */}
          {!scanResult.booking && scanResult.ticketData && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
              <p className="text-yellow-400 text-sm font-bold mb-2">⚠️ QR Format Valid but Booking Not in System</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Booking ID', value: scanResult.ticketData.bookingId },
                  { label: 'Movie',      value: scanResult.ticketData.movieTitle },
                  { label: 'Date',       value: scanResult.ticketData.showDate },
                  { label: 'Amount',     value: `₹${scanResult.ticketData.finalAmount}` },
                ].map(item => (
                  <div key={item.label}>
                    <span className="text-gray-500">{item.label}: </span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={resetScan}
              className="flex-1 bg-[#e53935] text-white font-bold py-3 rounded-xl hover:bg-[#c62828] transition-colors">
              🔄 Scan Next Ticket
            </button>
            <button onClick={onClose}
              className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
