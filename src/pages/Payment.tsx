import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SeatCategory } from '../data/store';
import { openRazorpayCheckout, isRazorpayConfigured, RAZORPAY_KEY_ID } from '../services/razorpayService';
import { generateTicketQR } from '../lib/qrcode';

// ── Types ────────────────────────────────────────────────────────────────────
type PayStep =
  | 'review'
  | 'method'
  | 'upi-select' | 'upi-qr' | 'upi-id'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'razorpay-processing'
  | 'processing'
  | 'success'
  | 'failed';

type UPIApp = 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'amazonpay' | 'custom';
type WalletApp = 'paytm' | 'amazonpay' | 'mobikwik' | 'freecharge';

// ── Constants ────────────────────────────────────────────────────────────────
const UPI_OPTIONS = [
  { id: 'phonepe'  as UPIApp, name: 'PhonePe',     gradient: 'from-[#5f259f] to-[#7b2fff]', icon: '📱', desc: 'Pay with PhonePe UPI',    suffix: '@ybl'    },
  { id: 'gpay'     as UPIApp, name: 'Google Pay',   gradient: 'from-[#4285F4] to-[#34A853]', icon: '🔵', desc: 'Pay with Google Pay',     suffix: '@okaxis' },
  { id: 'paytm'    as UPIApp, name: 'Paytm',        gradient: 'from-[#00BAF2] to-[#0078B4]', icon: '💳', desc: 'Pay with Paytm UPI',     suffix: '@paytm'  },
  { id: 'bhim'     as UPIApp, name: 'BHIM UPI',     gradient: 'from-[#FF671F] to-[#e53935]', icon: '🇮🇳', desc: 'Pay with BHIM',          suffix: '@upi'    },
  { id: 'amazonpay'as UPIApp, name: 'Amazon Pay',   gradient: 'from-[#FF9900] to-[#f26522]', icon: '📦', desc: 'Pay with Amazon Pay UPI', suffix: '@apl'    },
  { id: 'custom'   as UPIApp, name: 'Any UPI App',  gradient: 'from-[#4CAF50] to-[#2E7D32]', icon: '🔗', desc: 'Enter any UPI ID',        suffix: ''        },
];

const WALLET_OPTIONS = [
  { id: 'paytm'     as WalletApp, name: 'Paytm Wallet',  gradient: 'from-[#00BAF2] to-[#0078B4]', icon: '💳', balance: 580  },
  { id: 'amazonpay' as WalletApp, name: 'Amazon Pay',    gradient: 'from-[#FF9900] to-[#f26522]', icon: '📦', balance: 1200 },
  { id: 'mobikwik'  as WalletApp, name: 'MobiKwik',      gradient: 'from-[#e53935] to-[#c62828]', icon: '📲', balance: 230  },
  { id: 'freecharge'as WalletApp, name: 'FreeCharge',    gradient: 'from-[#4CAF50] to-[#2E7D32]', icon: '⚡', balance: 450  },
];

const BANKS = [
  'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank',
  'Kotak Mahindra Bank','Punjab National Bank','Bank of Baroda',
  'Canara Bank','Union Bank of India','IDBI Bank',
];

// ── QR code SVG (fallback visual only) ───────────────────────────────────────
const FallbackQR: React.FC<{ value: string; size?: number }> = ({ value, size = 200 }) => {
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i: number) => ((seed * (i + 1) * 2654435761) & 0xFFFFFFFF) % 100;
  const modules = 25;
  const cells: boolean[][] = [];
  for (let r = 0; r < modules; r++) {
    cells.push([]);
    for (let c = 0; c < modules; c++) {
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);
      const onBorder = (r === 0 || r === 6 || r === modules - 7 || r === modules - 1) || (c === 0 || c === 6 || c === modules - 7 || c === modules - 1);
      cells[r].push(inFinder ? (onBorder || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) : rand(r * modules + c) < 55);
    }
  }
  const cs = size / modules;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl">
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) => row.map((filled, c) => filled ? (
        <rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs} height={cs} fill="#111" />
      ) : null))}
    </svg>
  );
};



// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'white' }) => (
  <div className="rounded-full animate-spin border-2"
    style={{ width: size, height: size, borderColor: `${color}30`, borderTopColor: color }} />
);

// ── Main Payment Component ────────────────────────────────────────────────────
export const Payment: React.FC = () => {
  const {
    selectedMovie: appSelectedMovie, selectedTheatre, selectedShowTime, selectedDate,
    selectedSeats, currentUser, addBooking, navigate, applyCoupon, showToast,
    confirmBookingSeats, bookTickets,
  } = useApp() as any;

  // State & Data extraction with ultra safe fallbacks so NO crashes occur
  const selectedMovie = appSelectedMovie || (bookTickets && bookTickets.movie) || { id: 'fallback', title: 'Unknown Movie', poster: '' };

  const [step, setStep]               = useState<PayStep>('review');
  const [couponCode, setCouponCode]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount: number; code: string } | null>(null);
  const [bookingId, setBookingId]     = useState('');
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');

  // UPI
  const [selectedUPI, setSelectedUPI] = useState<UPIApp | null>(null);
  const [upiId, setUpiId]             = useState('');
  const [upiError, setUpiError]       = useState('');
  const [qrTimer, setQrTimer]         = useState(300);
  const [qrExpired, setQrExpired]     = useState(false);

  // Card
  const [cardNo, setCardNo]           = useState('');
  const [cardName, setCardName]       = useState('');
  const [cardExpiry, setCardExpiry]   = useState('');
  const [cardCvv, setCardCvv]         = useState('');
  const [cardError, setCardError]     = useState('');
  const [showCvv, setShowCvv]         = useState(false);
  const [otp, setOtp]                 = useState('');
  const [otpSent, setOtpSent]         = useState(false);
  const [otpTimer, setOtpTimer]       = useState(30);
  const [otpError, setOtpError]       = useState('');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('');
  const [bankQuery, setBankQuery]       = useState('');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState<WalletApp | null>(null);
  const [walletPin, setWalletPin]           = useState('');
  const [walletPinError, setWalletPinError] = useState('');

  // Processing
  const [processingMsg, setProcessingMsg] = useState('Initiating payment...');
  const [processingPct, setProcessingPct] = useState(0);
  const [failReason, setFailReason]       = useState('');

  // Ticket QR data URL (generated after success)
  const [ticketQrUrl, setTicketQrUrl]     = useState('');

  // ── Derived values ─────────────────────────────────────────────────────────
  const show        = (selectedTheatre?.showTimes || []).find((s: any) => String(s.id || s._id) === String(selectedShowTime)) || { id: selectedShowTime, time: 'Unknown Time', language: 'Unknown', format: '2D' };
  const totalAmount = selectedSeats?.reduce?.((sum: any, s: any) => sum + s.price, 0) || 0;
  const convFee     = Math.round(totalAmount * 0.05);
  const subtotal    = totalAmount + convFee;
  const discount    = appliedCoupon?.discount ?? 0;
  const finalAmount = Math.max(0, subtotal - discount);
  const upiAppInfo  = UPI_OPTIONS.find(u => u.id === selectedUPI);
  const razorpayReady = isRazorpayConfigured();

  // ── Timers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'upi-qr') return;
    setQrTimer(300); setQrExpired(false);
    const t = setInterval(() => setQrTimer(v => { if (v <= 1) { clearInterval(t); setQrExpired(true); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (!otpSent) return;
    setOtpTimer(30);
    const t = setInterval(() => setOtpTimer(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [otpSent]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!selectedTheatre || !selectedSeats || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <p className="text-white text-xl mb-2 font-bold">No booking in progress</p>
          <p className="text-gray-400 text-sm mb-6">Please select a movie and seats first.</p>
          <button onClick={() => navigate('home')} className="bg-[#e53935] text-white px-8 py-3 rounded-xl font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim(), subtotal);
    if (result) {
      setAppliedCoupon({ discount: result.discount, code: result.coupon.code });
      showToast(`✅ Coupon applied! You save ₹${result.discount}`, 'success');
    } else {
      showToast('Invalid or expired coupon code', 'error');
    }
  };

  // ── Confirm booking ────────────────────────────────────────────────────────
  const confirmBooking = useCallback(async (method: string, rzpPaymentId = ''): Promise<string> => {
    const booking = await addBooking({
      userId: currentUser!.id,
      movieId: selectedMovie.id,
      theatreId: selectedTheatre.id,
      showTimeId: selectedShowTime!,   // kept for local store compatibility
      showId: selectedShowTime!,        // matches Booking model field for backend queries
      // seats: use the canonical seatId (what the Booking model and seat-locker expect)
      seats: selectedSeats.map(s => s.seatId || s.id),
      totalAmount, discount, finalAmount,
      couponCode: appliedCoupon?.code,
      paymentMethod: method,
      status: 'confirmed',
      bookingDate: new Date().toISOString().split('T')[0],
      showDate: selectedDate!,
      showTime: show.time,
      showLanguage: show.language ?? '',
      showFormat:   show.format   ?? '2D',
      movieTitle:  selectedMovie.title,
      theatreName: selectedTheatre.name,
      moviePoster: selectedMovie.poster || '',   // ← FIX: persist poster so My Bookings renders it
      // FIX: seatDetails must use 'seatId' — that is the required field in Booking.model.js
      seatDetails: selectedSeats.map(s => ({
        seatId:   s.seatId || s.id,              // ← was 'id' → broke DB validation → empty seatDetails
        row:      s.row,
        col:      s.col,
        category: s.category as SeatCategory,
      })),
      hasRated: false,
      ...(rzpPaymentId ? { razorpayPaymentId: rzpPaymentId } : {}),
    });
    const id = (booking as any)?._id ?? (booking as any)?.id ?? String(Date.now());
    const screenId = selectedTheatre.screens[0]?.id ?? '';
    if (screenId) confirmBookingSeats(selectedTheatre.id, screenId, selectedSeats.map(s => s.id));
    return id;
  }, [addBooking, confirmBookingSeats, currentUser, selectedMovie, selectedTheatre, selectedShowTime,
      selectedSeats, selectedDate, show, totalAmount, discount, finalAmount, appliedCoupon]);

  // ── Generate ticket QR after confirming ───────────────────────────────────
  const generateAndSetQR = useCallback(async (bid: string) => {
    const url = await generateTicketQR({
      bookingId:   bid,
      movieTitle:  selectedMovie.title,
      theatreName: selectedTheatre.name,
      showDate:    selectedDate!,
      showTime:    show.time,
      seats:       selectedSeats.map(s => s.id),
      finalAmount,
      userId:      currentUser!.id,
    });
    setTicketQrUrl(url);
  }, [selectedMovie, selectedTheatre, selectedDate, show, selectedSeats, finalAmount, currentUser]);

  // ── Razorpay flow ──────────────────────────────────────────────────────────
  const handleRazorpayPay = useCallback(() => {
    if (!currentUser) { showToast('Sign in to continue', 'error'); return; }
    setStep('razorpay-processing');

    openRazorpayCheckout({
      amount:    finalAmount,
      bookingId: `BMS_${Date.now()}`,
      movieTitle: selectedMovie.title,
      userName:  currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone || '9999999999',
      onSuccess: async (paymentId) => {
        setRazorpayPaymentId(paymentId);
        const bid = await confirmBooking(`Razorpay — ${paymentId.slice(0, 16)}`, paymentId);
        setBookingId(bid);
        await generateAndSetQR(bid);
        setStep('success');
        showToast('🎉 Payment successful! Booking confirmed.', 'success');
      },
      onFailure: (err) => {
        setFailReason(err);
        setStep('failed');
      },
      onDismiss: () => {
        // User closed the popup — go back to method selection
        setStep('method');
        showToast('Payment cancelled. Choose a payment method to try again.', 'info');
      },
    });
  }, [currentUser, finalAmount, selectedMovie, confirmBooking, generateAndSetQR, showToast]);

  // ── Simulated processing (for demo / non-Razorpay methods) ────────────────
  const runProcessing = useCallback(async (method: string, shouldFail = false) => {
    setStep('processing');
    setProcessingPct(0);
    const msgs = [
      'Initiating secure connection…',
      'Verifying payment details…',
      'Contacting your bank…',
      'Authorizing transaction…',
      'Confirming with payment gateway…',
      shouldFail ? 'Transaction declined by bank' : 'Payment successful!',
    ];
    for (let i = 0; i < msgs.length; i++) {
      await new Promise(r => setTimeout(r, 550 + Math.random() * 350));
      setProcessingMsg(msgs[i]);
      setProcessingPct(Math.round(((i + 1) / msgs.length) * 100));
    }
    await new Promise(r => setTimeout(r, 300));
    if (shouldFail) {
      setFailReason('Payment was declined by your bank. Please try again or use a different payment method.');
      setStep('failed');
    } else {
      const bid = await confirmBooking(method);
      setBookingId(bid);
      await generateAndSetQR(bid);
      setStep('success');
    }
  }, [confirmBooking, generateAndSetQR]);

  // ── UPI ────────────────────────────────────────────────────────────────────
  const validateUpiId = (id: string) => /^[\w.\-]{2,}@[\w]{2,}$/.test(id.trim());
  const handleUpiIdPay = () => {
    if (!validateUpiId(upiId)) { setUpiError('Please enter a valid UPI ID (e.g. name@upi)'); return; }
    setUpiError('');
    runProcessing(`UPI — ${upiId}`);
  };

  // ── Card ───────────────────────────────────────────────────────────────────
  const formatCardNo  = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry  = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const handleSendOtp = () => {
    if (!cardNo.replace(/\s/g, '').match(/^\d{16}$/)) { setCardError('Enter valid 16-digit card number'); return; }
    if (!cardName.trim()) { setCardError('Enter cardholder name'); return; }
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) { setCardError('Enter valid expiry (MM/YY)'); return; }
    if (!cardCvv.match(/^\d{3,4}$/)) { setCardError('Enter valid CVV'); return; }
    setCardError(''); setOtpSent(true);
    showToast('OTP sent to registered mobile number', 'info');
  };

  const handleCardPay = () => {
    if (!otp.match(/^\d{6}$/)) { setOtpError('Enter valid 6-digit OTP'); return; }
    setOtpError('');
    const ct = cardNo.startsWith('4') ? 'Visa' : cardNo.startsWith('5') ? 'Mastercard' : 'RuPay';
    runProcessing(`${ct} Card ····${cardNo.replace(/\s/g, '').slice(-4)}`);
  };

  // ── Net Banking ────────────────────────────────────────────────────────────
  const handleNetBanking = () => {
    if (!selectedBank) { showToast('Please select a bank', 'error'); return; }
    runProcessing(`Net Banking — ${selectedBank}`);
  };

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const handleWalletPay = () => {
    const w = WALLET_OPTIONS.find(x => x.id === selectedWallet);
    if (!w) { showToast('Please select a wallet', 'error'); return; }
    if (w.balance < finalAmount) { showToast(`Insufficient balance in ${w.name}`, 'error'); return; }
    if (walletPin.length < 4) { setWalletPinError('Enter valid 4-digit wallet PIN'); return; }
    setWalletPinError('');
    runProcessing(`${w.name} Wallet`);
  };

  // ── QR Pay ────────────────────────────────────────────────────────────────
  const handleQrPaid = () => {
    if (qrExpired) { showToast('QR code expired. Please refresh.', 'error'); return; }
    runProcessing(`${upiAppInfo?.name} UPI — QR Code`);
  };

  const fmtTimer = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

  // ── UPI string for QR ──────────────────────────────────────────────────────
  const upiQrString = `upi://pay?pa=cineconnect@icici&pn=CineConnect&am=${finalAmount}&cu=INR&tn=Movie+Ticket`;

  // ── Order Summary ──────────────────────────────────────────────────────────
  const OrderSummary = () => (
    <div style={{
      background: 'linear-gradient(145deg,rgba(26,10,46,0.95),rgba(10,0,30,0.98))',
      borderRadius: 20, overflow: 'hidden', position: 'relative',
      border: '1px solid rgba(255,100,50,0.18)',
      boxShadow: '0 0 40px rgba(229,57,53,0.08), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Glow top edge */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#e53935,#ff6f00,transparent)' }} />

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#e53935,#ff6f00)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎟</div>
        <span style={{ color:'white', fontWeight:800, fontSize:13, letterSpacing:'1px', textTransform:'uppercase' as const }}>Order Summary</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(229,57,53,0.9)', background:'rgba(229,57,53,0.12)', border:'1px solid rgba(229,57,53,0.3)', borderRadius:100, padding:'2px 10px', fontWeight:700 }}>CONFIRMED</span>
      </div>

      <div style={{ padding:'16px 20px' }}>
        {/* Movie info */}
        <div style={{ display:'flex', gap:14, marginBottom:16 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <img src={selectedMovie.poster} alt="" style={{ width:60, height:88, borderRadius:12, objectFit:'cover', boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }} />
            <div style={{ position:'absolute', inset:0, borderRadius:12, border:'1px solid rgba(255,255,255,0.12)' }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h4 style={{ color:'white', fontWeight:800, fontSize:14, lineHeight:1.3, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{selectedMovie.title}</h4>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:3 }}>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11 }}>📍 {selectedTheatre.name}</span>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11 }}>📅 {selectedDate}</span>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11 }}>🕐 {show.time} · {show.language} · <span style={{ color:'#ff6f00', fontWeight:700 }}>{show.format}</span></span>
            </div>
          </div>
        </div>

        {/* Seat chips */}
        <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginBottom:16, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.5px', width:'100%', marginBottom:4 }}>SEATS</span>
          {selectedSeats.map(s => (
            <span key={s.id} style={{ fontSize:11, background:'rgba(229,57,53,0.15)', color:'#ff8a80', padding:'3px 10px', borderRadius:8, fontFamily:'monospace', fontWeight:700, border:'1px solid rgba(229,57,53,0.25)' }}>{s.id}</span>
          ))}
        </div>

        {/* Price breakdown */}
        <div style={{ display:'flex', flexDirection:'column' as const, gap:8, fontSize:13 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'rgba(255,255,255,0.4)' }}>{selectedSeats.length} × Ticket{selectedSeats.length > 1 ? 's' : ''}</span>
            <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:600 }}>₹{totalAmount}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'rgba(255,255,255,0.4)' }}>Convenience Fee (5%)</span>
            <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:600 }}>₹{convFee}</span>
          </div>
          {discount > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#4ade80' }}>🎉 Discount ({appliedCoupon?.code})</span>
              <span style={{ color:'#4ade80', fontWeight:700 }}>-₹{discount}</span>
            </div>
          )}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:700, fontSize:14 }}>Total Payable</span>
            <span style={{ color:'#ff6f00', fontWeight:900, fontSize:20, textShadow:'0 0 20px rgba(229,57,53,0.5)' }}>₹{finalAmount}</span>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ marginTop:14, display:'flex', gap:6, flexWrap:'wrap' as const }}>
          {['🔐 SSL Secured','✅ Instant Ticket','💯 100% Refund'].map(b => (
            <span key={b} style={{ fontSize:9, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:100, padding:'3px 8px', fontWeight:600 }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // STEP: REVIEW — Premium UI
  if (step === 'review') {
    const COUPONS_LIST = ['FIRST50', 'WEEKEND100', 'PAYTM200', 'IMAX20'];
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0a0015 0%,#0f0020 40%,#080010 100%)', padding:'32px 0', position:'relative', overflow:'hidden' }}>
        {/* Ambient glows */}
        <div style={{ position:'fixed', top:'20%', left:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(229,57,53,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'fixed', bottom:'10%', right:'-5%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,111,0,0.05) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 20px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
            <button onClick={() => navigate('seat-selection')} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'rgba(255,255,255,0.6)', padding:'8px 16px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.06)')}
            >← Back</button>
            <div>
              <h1 style={{ color:'white', fontWeight:900, fontSize:26, fontFamily:'Outfit,sans-serif', margin:0 }}>Review & Pay</h1>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, margin:0, marginTop:2 }}>Confirm your booking details</p>
            </div>
            <div style={{ marginLeft:'auto', background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.25)', borderRadius:100, padding:'6px 16px', fontSize:12, color:'#ff8a80', fontWeight:700 }}>🔐 Secure Checkout</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }}>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:20 }}>

              {/* ── Coupon Card ── */}
              <div style={{ background:'linear-gradient(145deg,rgba(30,10,50,0.9),rgba(15,5,30,0.95))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:24, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:'30%', right:'30%', height:1, background:'linear-gradient(90deg,transparent,rgba(229,57,53,0.4),transparent)' }} />
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,rgba(229,57,53,0.3),rgba(255,111,0,0.3))', border:'1px solid rgba(229,57,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎁</div>
                  <div>
                    <div style={{ color:'white', fontWeight:800, fontSize:14 }}>Apply Coupon</div>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>Save more on your booking</div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code…"
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'13px 16px', color:'white', fontSize:14, outline:'none', fontFamily:'Inter,sans-serif', letterSpacing:'1px', fontWeight:600 }}
                    onFocus={e => e.target.style.borderColor='rgba(229,57,53,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                  <button
                    onClick={handleApplyCoupon} disabled={!!appliedCoupon}
                    style={{ padding:'13px 22px', background:appliedCoupon?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#e53935,#ff6f00)', border:'none', borderRadius:12, color:'white', fontWeight:800, fontSize:13, cursor:appliedCoupon?'default':'pointer', opacity:appliedCoupon?0.5:1, transition:'all 0.2s', boxShadow:appliedCoupon?'none':'0 4px 20px rgba(229,57,53,0.3)' }}
                  >Apply</button>
                </div>

                {appliedCoupon && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, padding:'10px 16px', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:18 }}>✅</span>
                      <div>
                        <div style={{ color:'#4ade80', fontWeight:800, fontSize:13 }}>{appliedCoupon.code}</div>
                        <div style={{ color:'rgba(74,222,128,0.7)', fontSize:11 }}>You saved ₹{appliedCoupon.discount}!</div>
                      </div>
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16 }}>✕</button>
                  </div>
                )}

                <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8 }}>
                  {COUPONS_LIST.map(c => (
                    <button key={c} onClick={() => setCouponCode(c)}
                      style={{ padding:'6px 14px', borderRadius:100, fontSize:11, fontFamily:'monospace', fontWeight:700, cursor:'pointer', background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.2)', color:'#ff8a80', transition:'all 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background='rgba(229,57,53,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background='rgba(229,57,53,0.1)')}
                    >{c}</button>
                  ))}
                </div>
              </div>

              {/* ── Payment Status ── */}
              <div style={{ background: razorpayReady ? 'rgba(34,197,94,0.07)' : 'rgba(59,130,246,0.07)', border:`1px solid ${razorpayReady?'rgba(34,197,94,0.25)':'rgba(59,130,246,0.2)'}`, borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
                <span style={{ fontSize:24, flexShrink:0 }}>{razorpayReady ? '✅' : 'ℹ️'}</span>
                <div>
                  <div style={{ color:razorpayReady?'#4ade80':'#60a5fa', fontWeight:700, fontSize:13, marginBottom:4 }}>{razorpayReady ? 'Razorpay Live Payments Active' : 'Demo Mode — Simulated Payment'}</div>
                  <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{razorpayReady ? 'All payments are processed securely via Razorpay.' : 'Choose any payment method below — the booking will be confirmed and saved to the database.'}</div>
                </div>
              </div>

              {/* ── CTA Button ── */}
              <button
                onClick={() => setStep('method')}
                style={{ width:'100%', padding:'18px', background:'linear-gradient(135deg,#e53935 0%,#ff4f00 50%,#ff6f00 100%)', border:'none', borderRadius:18, color:'white', fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, cursor:'pointer', position:'relative' as const, overflow:'hidden', boxShadow:'0 6px 0 rgba(139,0,0,0.5),0 0 40px rgba(229,57,53,0.35)', letterSpacing:'0.3px', transition:'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 0 rgba(139,0,0,0.5),0 0 60px rgba(229,57,53,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 6px 0 rgba(139,0,0,0.5),0 0 40px rgba(229,57,53,0.35)'; }}
              >
                <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Proceed to Pay ₹{finalAmount}
                  <span style={{ fontSize:20 }}>→</span>
                </span>
                <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', animation:'shimmer 2s ease infinite', animationDelay:'0.5s' }} />
              </button>

              <style>{`@keyframes shimmer { 0%{left:-100%} 100%{left:150%} }`}</style>

            </div>

            {/* Order Summary sidebar */}
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: METHOD SELECTION
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'method') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('review')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-2xl font-black text-white">Choose Payment Method</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* ── Razorpay (real payment) */}
              <div className={`rounded-2xl overflow-hidden border ${razorpayReady ? 'border-green-500/40' : 'border-white/10'}`}>
                <div className={`p-4 border-b ${razorpayReady ? 'bg-green-500/15 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{razorpayReady ? '🔥' : '💳'}</span>
                    <span className="text-white font-bold text-sm">{razorpayReady ? 'Pay with Razorpay (Real Payment)' : 'Razorpay (Configure to Enable)'}</span>
                    {razorpayReady && <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">LIVE</span>}
                  </div>
                </div>
                <div className="p-4 bg-white/3">
                  <p className="text-gray-400 text-xs mb-4">
                    {razorpayReady
                      ? 'Pay securely via Razorpay — supports UPI, Cards, Net Banking, Wallets & more. Money is collected in real.'
                      : `Set RAZORPAY_KEY_ID in src/services/razorpayService.ts to enable real payments. Current key: "${RAZORPAY_KEY_ID.slice(0, 16)}…"`}
                  </p>
                  <button
                    onClick={handleRazorpayPay}
                    className={`w-full font-black py-3 rounded-xl text-white transition-all ${razorpayReady ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:opacity-90' : 'bg-white/10 border border-white/20 hover:bg-white/15'}`}
                  >
                    {razorpayReady ? `💳 Pay ₹${finalAmount} via Razorpay` : `🔧 Open Razorpay Demo (₹${finalAmount})`}
                  </button>
                </div>
              </div>

              {/* ── UPI */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    <span className="text-white font-bold text-sm">UPI Apps</span>
                    <span className="ml-auto text-xs text-gray-500">Demo mode</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {UPI_OPTIONS.map(u => (
                    <button key={u.id}
                      onClick={() => { setSelectedUPI(u.id); setStep('upi-select'); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${u.gradient} flex items-center justify-center text-xl shadow-lg`}>{u.icon}</div>
                      <span className="text-white text-xs font-medium text-center">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Other methods */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: '💳', label: 'Credit / Debit Card', tag: 'Demo', action: () => setStep('card') },
                  { icon: '🏦', label: 'Net Banking',          tag: 'Demo', action: () => setStep('netbanking') },
                  { icon: '👜', label: 'Wallets',              tag: 'Demo', action: () => setStep('wallet') },
                ].map(m => (
                  <button key={m.label} onClick={m.action}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/8 transition-all text-left">
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm block">{m.label}</span>
                      <span className="text-gray-500 text-xs">{m.tag}</span>
                    </div>
                    <span className="text-gray-500 text-sm">›</span>
                  </button>
                ))}
              </div>
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: UPI SELECT (Scan QR / Enter ID)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'upi-select') {
    const app = UPI_OPTIONS.find(u => u.id === selectedUPI)!;
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('method')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center text-lg`}>{app.icon}</div>
            <h1 className="text-2xl font-black text-white">{app.name}</h1>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <button onClick={() => setStep('upi-qr')}
                className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-[#e53935]/50 hover:bg-[#e53935]/5 transition-all group text-left">
                <div className="w-14 h-14 rounded-2xl bg-[#e53935]/10 border border-[#e53935]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📷</div>
                <div className="flex-1">
                  <p className="text-white font-bold">Scan QR Code</p>
                  <p className="text-gray-400 text-sm">Open {app.name} and scan this QR</p>
                </div>
                <span className="text-gray-500">›</span>
              </button>
              <button onClick={() => setStep('upi-id')}
                className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-left">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✏️</div>
                <div className="flex-1">
                  <p className="text-white font-bold">Enter UPI ID</p>
                  <p className="text-gray-400 text-sm">Type your UPI ID manually</p>
                </div>
                <span className="text-gray-500">›</span>
              </button>
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: UPI QR
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'upi-qr') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('upi-select')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-2xl font-black text-white">Scan QR to Pay</h1>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <p className="text-gray-400 text-sm mb-5">Open <span className="text-white font-bold">{upiAppInfo?.name}</span> and scan this QR code to pay <span className="text-[#e53935] font-black text-lg">₹{finalAmount}</span></p>
                <div className="inline-block bg-white rounded-2xl p-4 mb-4 shadow-2xl">
                  <FallbackQR value={upiQrString} size={200} />
                </div>
                <p className="text-gray-500 text-xs mb-1 font-mono">{upiQrString.slice(0, 60)}…</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-3 ${qrExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {qrExpired ? '⏰ QR Expired' : `⏱ Expires in ${fmtTimer(qrTimer)}`}
                </div>
                {qrExpired ? (
                  <div className="mt-5">
                    <button onClick={() => { setQrTimer(300); setQrExpired(false); }} className="bg-[#e53935] text-white px-6 py-3 rounded-xl font-bold text-sm">🔄 Refresh QR</button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    <p className="text-gray-500 text-xs">After paying in your app, click the button below</p>
                    <button onClick={handleQrPaid}
                      className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-4 rounded-xl hover:opacity-90 transition-opacity">
                      ✅ I have paid ₹{finalAmount}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: UPI ID
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'upi-id') {
    const isValid = validateUpiId(upiId);
    const upiAppDisplay = upiAppInfo ?? { name: 'UPI', gradient: 'from-[#6366f1] to-[#a855f7]', icon: '📱' };
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#06000f 0%,#0d0022 50%,#050010 100%)', padding: '32px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient orbs */}
        <div style={{ position: 'fixed', top: '10%', left: '-15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '5%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button onClick={() => setStep(selectedUPI ? 'upi-select' : 'method')}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'rgba(255,255,255,0.6)', padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
              ← Back
            </button>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${upiAppDisplay.gradient.replace('from-[','').replace('] to-[',',').replace(']','')})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {upiAppDisplay.icon}
            </div>
            <div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: 'Outfit,sans-serif', margin: 0 }}>Pay via UPI ID</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>Enter your registered UPI address</p>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 11, color: '#a5b4fc', fontWeight: 700 }}>
              🔐 256-bit Encrypted
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 18 }}>

              {/* Main UPI Card */}
              <div style={{ background: 'linear-gradient(145deg,rgba(20,8,45,0.95),rgba(10,0,25,0.98))', borderRadius: 24, border: '1px solid rgba(99,102,241,0.2)', overflow: 'hidden', position: 'relative' }}>
                {/* Top glow bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#6366f1,#a855f7,transparent)' }} />

                {/* Header band */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.25))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    ✏️
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>Enter Your UPI ID</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, marginTop: 2 }}>Linked to any bank or UPI app</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: isValid ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isValid ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isValid ? '#22c55e' : '#374151', transition: 'background 0.3s' }} />
                    <span style={{ color: isValid ? '#4ade80' : '#6b7280', fontSize: 11, fontWeight: 700 }}>{isValid ? 'Valid ID' : 'Not verified'}</span>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Input field */}
                  <div style={{ position: 'relative', marginBottom: 18 }}>
                    <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontSize: 18, pointerEvents: 'none' }}>@</div>
                    <input
                      value={upiId}
                      onChange={e => { setUpiId(e.target.value); setUpiError(''); }}
                      placeholder="yourname@upi"
                      inputMode="email"
                      style={{
                        width: '100%', padding: '16px 16px 16px 44px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: 'white',
                        background: 'rgba(99,102,241,0.08)', border: `2px solid ${upiError ? 'rgba(239,68,68,0.6)' : isValid ? 'rgba(34,197,94,0.5)' : 'rgba(99,102,241,0.25)'}`,
                        outline: 'none', fontFamily: 'monospace', letterSpacing: '0.04em', boxSizing: 'border-box' as const,
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                        boxShadow: isValid ? '0 0 20px rgba(34,197,94,0.12)' : upiError ? '0 0 20px rgba(239,68,68,0.1)' : 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.20)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = upiError ? 'rgba(239,68,68,0.6)' : isValid ? 'rgba(34,197,94,0.5)' : 'rgba(99,102,241,0.25)'; e.currentTarget.style.boxShadow = isValid ? '0 0 20px rgba(34,197,94,0.12)' : 'none'; }}
                    />
                    {isValid && (
                      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: 20 }}>✓</div>
                    )}
                  </div>

                  {/* Error / success messages */}
                  {upiError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <p style={{ color: '#f87171', fontSize: 12, fontWeight: 600, margin: 0 }}>{upiError}</p>
                    </div>
                  )}
                  {isValid && !upiError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 16 }}>
                      <span style={{ fontSize: 14 }}>✅</span>
                      <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, margin: 0 }}>UPI ID format looks correct</p>
                    </div>
                  )}

                  {/* Quick suffix chips */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Suffix</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                      {[
                        { suffix: '@ybl',    label: 'PhonePe', color: '#7b2fff' },
                        { suffix: '@okaxis', label: 'GPay',    color: '#4285F4' },
                        { suffix: '@paytm',  label: 'Paytm',   color: '#00BAF2' },
                        { suffix: '@upi',    label: 'BHIM',    color: '#FF671F' },
                        { suffix: '@oksbi',  label: 'SBI',     color: '#2563eb' },
                        { suffix: '@apl',    label: 'Amazon',  color: '#FF9900' },
                        { suffix: '@ibl',    label: 'ICICI',   color: '#f59e0b' },
                      ].map(({ suffix, label, color }) => (
                        <button key={suffix}
                          onClick={() => { const base = upiId.split('@')[0] || 'name'; setUpiId(`${base}${suffix}`); setUpiError(''); }}
                          style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', background: `${color}18`, border: `1px solid ${color}40`, color, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}30`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}18`; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                          <span style={{ fontSize: 9 }}>{suffix}</span>
                          <span style={{ background: `${color}25`, padding: '1px 5px', borderRadius: 4, fontSize: 9 }}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handleUpiIdPay}
                    disabled={!upiId.trim()}
                    style={{
                      width: '100%', padding: '18px', borderRadius: 16, fontFamily: 'Outfit,sans-serif', fontSize: 17, fontWeight: 900,
                      color: 'white', cursor: upiId.trim() ? 'pointer' : 'not-allowed', position: 'relative' as const, overflow: 'hidden',
                      background: upiId.trim() ? 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)' : 'rgba(255,255,255,0.06)',
                      border: upiId.trim() ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: upiId.trim() ? '0 6px 0 rgba(67,56,202,0.6),0 0 40px rgba(99,102,241,0.35)' : 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => { if (upiId.trim()) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 0 rgba(67,56,202,0.6),0 0 60px rgba(99,102,241,0.5)'; }}}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = upiId.trim() ? '0 6px 0 rgba(67,56,202,0.6),0 0 40px rgba(99,102,241,0.35)' : 'none'; }}
                  >
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>💸</span>
                      Pay ₹{finalAmount} via UPI
                      <span style={{ fontSize: 18 }}>→</span>
                    </span>
                    {upiId.trim() && (
                      <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)', animation: 'shimmer 2s ease infinite' }} />
                    )}
                  </button>

                  {/* Security note */}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    {['🔒 SSL Secured', '🏦 Bank Verified', '⚡ Instant'].map(badge => (
                      <span key={badge} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{badge}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* UPI info box */}
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>ℹ️</span>
                <div>
                  <p style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>How it works</p>
                  <p style={{ color: 'rgba(165,180,252,0.6)', fontSize: 12, lineHeight: 1.6 }}>
                    Enter your UPI ID (e.g. <span style={{ fontFamily: 'monospace', color: '#c4b5fd' }}>yourname@ybl</span>). After submitting, you'll receive a payment request in your UPI app. Approve it to complete the booking.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary sidebar */}
            <div><OrderSummary /></div>
          </div>
        </div>
        <style>{`@keyframes shimmer { 0%{left:-100%} 100%{left:150%} }`}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: CARD
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'card') {
    const cardType = cardNo.startsWith('4') ? 'VISA' : cardNo.startsWith('5') ? 'MC' : cardNo.startsWith('6') ? 'RuPay' : '';
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('method')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-2xl font-black text-white">Credit / Debit Card</h1>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Card preview */}
              <div className="relative h-48 bg-gradient-to-br from-[#1a1a3e] via-[#2d1b4e] to-[#0d1b4a] rounded-2xl p-6 overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                  {[...Array(4)].map((_, i) => <div key={i} className="absolute w-32 h-32 rounded-full border border-white" style={{ top: `${i * 30 - 10}%`, right: `${i * 20 - 10}%` }} />)}
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md" />
                    {cardType && <span className="text-white font-black text-lg tracking-widest">{cardType}</span>}
                  </div>
                  <div>
                    <p className="text-white font-mono text-xl tracking-widest mb-2">
                      {(cardNo || '•••• •••• •••• ••••').padEnd(19, '•')}
                    </p>
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-sm">{cardName || 'CARD HOLDER'}</p>
                      <p className="text-gray-400 text-sm">{cardExpiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
                {cardError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">⚠ {cardError}</div>}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Card Number</label>
                  <input value={cardNo} onChange={e => setCardNo(formatCardNo(e.target.value))}
                    placeholder="1234 5678 9012 3456" inputMode="numeric" maxLength={19}
                    className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935] font-mono" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Cardholder Name</label>
                  <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
                    placeholder="AS ON CARD"
                    className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Expiry</label>
                    <input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY" maxLength={5} inputMode="numeric"
                      className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935]" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">CVV</label>
                    <div className="relative">
                      <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        type={showCvv ? 'text' : 'password'} placeholder="•••" maxLength={4} inputMode="numeric"
                        className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-10 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935]" />
                      <button onClick={() => setShowCvv(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                        {showCvv ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                </div>

                {!otpSent ? (
                  <button onClick={handleSendOtp}
                    className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-4 rounded-xl hover:opacity-90 transition-opacity">
                    Get OTP & Pay ₹{finalAmount}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-sm font-medium">OTP sent to registered mobile!</p>
                      <p className="text-gray-400 text-xs">Enter the 6-digit OTP below</p>
                    </div>
                    {otpError && <p className="text-red-400 text-xs">⚠ {otpError}</p>}
                    <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP" inputMode="numeric" maxLength={6}
                      className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935] text-center text-xl font-mono tracking-widest" />
                    <button onClick={handleCardPay}
                      className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-4 rounded-xl hover:opacity-90">
                      ✅ Confirm Payment ₹{finalAmount}
                    </button>
                    <p className="text-center text-gray-500 text-xs">
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : <button onClick={() => setOtpSent(false)} className="text-[#e53935] hover:underline">Resend OTP</button>}
                    </p>
                    <p className="text-center text-gray-600 text-xs">Demo: enter any 6 digits as OTP</p>
                  </div>
                )}
              </div>
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: NET BANKING
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'netbanking') {
    const filtered = BANKS.filter(b => b.toLowerCase().includes(bankQuery.toLowerCase()));
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('method')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-2xl font-black text-white">Net Banking</h1>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <input value={bankQuery} onChange={e => setBankQuery(e.target.value)}
                  placeholder="🔍 Search your bank…"
                  className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935] mb-4" />
                <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
                  {filtered.map(bank => (
                    <label key={bank} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedBank === bank ? 'bg-[#e53935]/10 border-[#e53935]/40' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                      <input type="radio" name="bank" checked={selectedBank === bank} onChange={() => setSelectedBank(bank)} className="accent-[#e53935]" />
                      <span className="text-2xl">🏦</span>
                      <span className="text-white text-sm font-medium">{bank}</span>
                      {selectedBank === bank && <span className="ml-auto text-[#e53935]">✓</span>}
                    </label>
                  ))}
                </div>
                <button onClick={handleNetBanking} disabled={!selectedBank}
                  className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-4 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                  🏦 Pay ₹{finalAmount} via Net Banking
                </button>
              </div>
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: WALLET
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'wallet') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('method')} className="text-gray-400 hover:text-white text-sm">← Back</button>
            <h1 className="text-2xl font-black text-white">Pay via Wallet</h1>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {WALLET_OPTIONS.map(w => (
                <button key={w.id} onClick={() => setSelectedWallet(w.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedWallet === w.id ? 'border-[#e53935]/50 bg-[#e53935]/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${w.gradient} flex items-center justify-center text-xl shadow-lg`}>{w.icon}</div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{w.name}</p>
                    <p className={`text-sm ${w.balance >= finalAmount ? 'text-green-400' : 'text-red-400'}`}>
                      Balance: ₹{w.balance}{w.balance < finalAmount ? ' (Insufficient)' : ''}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedWallet === w.id ? 'border-[#e53935] bg-[#e53935]' : 'border-white/30'}`}>
                    {selectedWallet === w.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}

              {selectedWallet && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 block">Wallet PIN</label>
                  <div className="flex gap-2 mb-4">
                    {[0,1,2,3].map(i => (
                      <input key={i} id={`wpin-${i}`} type="password" maxLength={1}
                        value={walletPin[i] || ''}
                        onChange={e => {
                          const d = e.target.value.replace(/\D/g, '');
                          const p = walletPin.split(''); p[i] = d; setWalletPin(p.join(''));
                          setWalletPinError('');
                          if (d && i < 3) (document.getElementById(`wpin-${i+1}`) as HTMLInputElement)?.focus();
                        }}
                        className="w-14 h-14 bg-white/10 text-white text-center text-2xl font-bold rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e53935]" />
                    ))}
                  </div>
                  {walletPinError && <p className="text-red-400 text-xs mb-3">⚠ {walletPinError}</p>}
                  <button onClick={handleWalletPay}
                    className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-4 rounded-xl hover:opacity-90">
                    👜 Pay ₹{finalAmount} from Wallet
                  </button>
                  <p className="text-center text-gray-500 text-xs mt-2">Demo: enter any 4 digits as PIN</p>
                </div>
              )}
            </div>
            <div><OrderSummary /></div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: RAZORPAY PROCESSING (waiting for popup)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'razorpay-processing') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-blue-500/30 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <Spinner size={56} color="#4285F4" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </div>
          <h2 className="text-white text-2xl font-black mb-2">Razorpay Checkout</h2>
          <p className="text-gray-400 text-sm mb-4">Complete your payment in the Razorpay popup window.</p>
          <p className="text-gray-500 text-xs">If the popup was blocked, allow popups for this site and try again.</p>
          <button onClick={() => setStep('method')} className="mt-6 text-gray-500 hover:text-white text-sm underline">
            ← Back to payment methods
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: PROCESSING (demo methods)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-[#e53935]/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-[#e53935]/30 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <Spinner size={56} color="#e53935" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
          </div>
          <h2 className="text-white text-2xl font-black mb-2">Processing Payment</h2>
          <p className="text-gray-400 text-sm mb-8">{processingMsg}</p>
          <div className="bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] rounded-full transition-all duration-500" style={{ width: `${processingPct}%` }} />
          </div>
          <p className="text-gray-500 text-xs">{processingPct}% complete</p>
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-xs">
            <span>🔐</span><span>Do not close this window or press back button</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: FAILED
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a2e] rounded-3xl overflow-hidden border border-red-500/30 shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-center">
              <div className="text-5xl mb-2">❌</div>
              <h2 className="text-white text-2xl font-black">Payment Failed</h2>
              <p className="text-red-200 text-sm mt-1">Transaction could not be completed</p>
            </div>
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">{failReason}</p>
              </div>
              <p className="text-gray-400 text-xs mb-6">Your money has NOT been deducted. Try again with a different payment method.</p>
              <div className="space-y-3">
                <button onClick={() => setStep('method')}
                  className="w-full bg-gradient-to-r from-[#e53935] to-[#ff6f00] text-white font-black py-3 rounded-xl hover:opacity-90">
                  🔄 Try Another Method
                </button>
                <button onClick={() => navigate('home')} className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20">
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: SUCCESS — Full 3D Booking Confirmed Experience
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'success') {
    const safeBookingId = bookingId || `CC${Date.now()}`;
    const barcodeWidths = safeBookingId.split('').map((c, i) => ((c.charCodeAt(0) + i) % 3) + 1);
    const confettiItems = ['🎉','🎊','🎬','🍿','⭐','✨','🎭','🎦','🌟','🏆','🎵','🎶'];

    return (
      <div className="min-h-screen confirmed-bg flex flex-col items-center justify-start py-6 px-4 overflow-x-hidden">

        {/* ── Full-screen confetti rain ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {confettiItems.map((emoji, i) => (
            <div key={i}
              className="absolute text-2xl select-none"
              style={{
                left: `${(i * 8.5) % 100}%`,
                top: '-40px',
                animation: `confettiDrop ${2 + i * 0.4}s ease-in ${i * 0.25}s infinite`,
                fontSize: `${1.2 + (i % 3) * 0.4}rem`,
              }}>
              {emoji}
            </div>
          ))}
        </div>

        {/* ── Green success glow orb ── */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.20) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
          animation: 'glowPulseGreen 3s ease-in-out infinite',
        }} />

        <div className="relative z-10 w-full max-w-lg">

          {/* ── Celebration header ── */}
          <div className="text-center mb-6">
            {/* Spinning checkmark badge */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full success-pulse" style={{
                width: 100, height: 100,
                background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
              }} />
              <div className="w-24 h-24 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
                  boxShadow: '0 0 40px rgba(34,197,94,0.5), 0 8px 32px rgba(0,0,0,0.5)',
                  animation: 'ticketReveal 0.8s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                <span style={{ fontSize: '2.8rem' }}>✅</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1"
              style={{ textShadow: '0 0 30px rgba(34,197,94,0.5)', animation: 'ticketReveal 0.8s 0.1s both' }}>
              Booking Confirmed!
            </h1>
            <p className="text-green-400 font-medium" style={{ animation: 'ticketReveal 0.8s 0.2s both' }}>
              🍿 Get ready for an amazing experience!
            </p>
            {razorpayPaymentId && (
              <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs"
                style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac', animation: 'ticketReveal 0.8s 0.3s both' }}>
                <span>💳</span>
                <span className="font-mono">Razorpay: {razorpayPaymentId.slice(0, 18)}…</span>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              3D FLOATING TICKET CARD
          ══════════════════════════════════════════════════════════════════ */}
          <div className="ticket-3d ticket-float" style={{ animationDelay: '0.4s' }}>
            <div style={{
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 8px 16px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.8), 0 40px 100px rgba(34,197,94,0.15), 0 0 0 1px rgba(255,255,255,0.08)',
              position: 'relative',
            }}>

              {/* ── Ticket top band ── */}
              <div className="relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #065f46 0%, #16a34a 40%, #22c55e 70%, #4ade80 100%)',
                padding: '24px 24px 20px',
              }}>
                {/* Decorative circles */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute rounded-full border border-white/10" style={{
                    width: 60 + i * 30, height: 60 + i * 30,
                    top: '50%', right: -20 + i * (-15),
                    transform: 'translateY(-50%)',
                  }} />
                ))}
                {/* Film reel pattern */}
                <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,255,255,0.3) 18px, rgba(255,255,255,0.3) 22px)',
                }} />

                <div className="relative z-10 flex items-center gap-4">
                  {/* Movie poster thumbnail */}
                  <div style={{
                    width: 70, height: 100, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.15)',
                  }}>
                    <img src={selectedMovie.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-black text-xl leading-tight mb-1">{selectedMovie.title}</h2>
                    <p className="text-green-100 text-sm font-medium">{selectedTheatre.name}</p>
                    <p className="text-green-200 text-xs mt-1">📅 {selectedDate} &nbsp;·&nbsp; ⏰ {show.time}</p>
                    <p className="text-green-200 text-xs">🌐 {show.language} &nbsp;·&nbsp; 📽️ {show.format}</p>
                  </div>
                  {/* Confirmed stamp */}
                  <div className="flex-shrink-0 relative">
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.5)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(-15deg)',
                      background: 'rgba(255,255,255,0.10)',
                    }}>
                      <span style={{ fontSize: '1.4rem' }}>✓</span>
                      <span style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: 1, color: 'white', marginTop: -2 }}>CONFIRMED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Perforated tear line ── */}
              <div style={{ position: 'relative', height: 24, background: '#0f0f1a', overflow: 'hidden' }}>
                {/* Left notch */}
                <div style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: '#05050f' }} />
                {/* Right notch */}
                <div style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: '#05050f' }} />
                {/* Dashed perforation */}
                <div style={{
                  position: 'absolute', top: '50%', left: 20, right: 20,
                  borderTop: '2px dashed rgba(255,255,255,0.12)',
                  transform: 'translateY(-50%)',
                }} />
                {/* Scissors icon */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'rgba(255,255,255,0.20)', fontSize: 14 }}>✂</div>
              </div>

              {/* ── Ticket body ── */}
              <div style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a18 100%)', padding: 24 }}>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: '🎫', label: 'BOOKING ID', value: safeBookingId.slice(2, 14).toUpperCase(), mono: true },
                    { icon: '💺', label: 'SEATS',      value: selectedSeats.map(s => s.id).join(', '), mono: true },
                    { icon: '💰', label: 'AMOUNT PAID', value: `₹${finalAmount}`, green: true },
                    { icon: '📲', label: 'PAYMENT',    value: 'Confirmed', pulse: true },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span style={{ fontSize: 13 }}>{item.icon}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em' }}>{item.label}</span>
                      </div>
                      {item.pulse ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.85rem' }}>{item.value}</span>
                        </div>
                      ) : (
                        <p style={{
                          color: item.green ? '#4ade80' : 'white',
                          fontWeight: item.green ? 900 : 700,
                          fontSize: item.green ? '1.2rem' : '0.82rem',
                          fontFamily: item.mono ? 'monospace' : 'inherit',
                          lineHeight: 1.2,
                        }}>{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Seat category chips */}
                {selectedSeats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {selectedSeats.map(s => (
                      <span key={s.id} style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: s.category === 'premium' ? 'rgba(168,85,247,0.15)' :
                                    s.category === 'gold'    ? 'rgba(251,191,36,0.15)' :
                                    s.category === 'silver'  ? 'rgba(156,163,175,0.15)' :
                                                               'rgba(255,255,255,0.08)',
                        color:      s.category === 'premium' ? '#c084fc' :
                                    s.category === 'gold'    ? '#fbbf24' :
                                    s.category === 'silver'  ? '#9ca3af' : '#d1d5db',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        {s.id} · {s.category}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Real QR Code ── */}
                <div style={{
                  background: 'white', borderRadius: 20, padding: 16, marginBottom: 16, textAlign: 'center',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.20)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* QR scan bar animation */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.8), transparent)',
                    animation: 'scanBarAnim 2.5s ease-in-out infinite',
                    zIndex: 10,
                  }} />
                  <p style={{ color: '#374151', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>
                    🔍 SCAN AT THEATRE ENTRANCE
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    {ticketQrUrl
                      ? <img src={ticketQrUrl} alt="Ticket QR" width={180} height={180} style={{ borderRadius: 12 }} />
                      : <FallbackQR value={safeBookingId} size={180} />
                    }
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700 }}>
                    {safeBookingId.slice(2, 18).toUpperCase()}
                  </p>
                  <div style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(34,197,94,0.08)', borderRadius: 20, padding: '4px 12px',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulseGlow 2s infinite' }} />
                    <span style={{ color: '#16a34a', fontSize: '0.65rem', fontWeight: 700 }}>VALID TICKET</span>
                  </div>
                </div>

                {/* ── Barcode ── */}
                <div style={{
                  background: 'white', borderRadius: 16, padding: '12px 16px 8px', marginBottom: 20,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginBottom: 6 }}>
                    {barcodeWidths.concat(barcodeWidths).slice(0, 60).map((w, i) => (
                      <div key={i} style={{ background: '#111', width: w, height: 44 }} />
                    ))}
                  </div>
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 700 }}>
                    {safeBookingId.slice(2, 18).toUpperCase()}
                  </p>
                </div>

                {/* Note */}
                <div style={{
                  background: 'rgba(34,197,94,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 20,
                  border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>📱</span>
                  <p style={{ color: '#86efac', fontSize: '0.72rem', lineHeight: 1.5 }}>
                    Show this QR code at the theatre entrance. The theatre owner can scan it to verify your booking instantly.
                  </p>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-3">
                  <button onClick={() => navigate('my-bookings')}
                    className="flex-1 font-black py-3.5 rounded-2xl text-white transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      boxShadow: '0 4px 0 #14532d, 0 8px 24px rgba(34,197,94,0.35)',
                    }}>
                    📋 My Bookings
                  </button>
                  <button onClick={() => navigate('home')}
                    className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all hover:bg-white/15"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    🏠 Home
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-12" />
        </div>
      </div>
    );
  }

  return null;
};
