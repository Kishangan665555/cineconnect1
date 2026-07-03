import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { generateTicketQR } from '../lib/qrcode';
import {
  apiGetUserBookingsAll,
  apiGetUserBookingsStats,
  apiCancelBookingWithRefund,
} from '../services/apiService';
import { UserProfileModal } from '../components/social/UserProfileModal';

// Using consistent icons and layout for glassmorphism
const ICONS = {
  Ticket: '🎫', Wallet: '💳', Cancel: '❌', Star: '⭐', 
  Upcoming: '🎬', Heart: '❤️', Theatre: '🏛️', Movie: '🎥',
  Search: '🔍', Filter: '🎭'
};

const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes scanline {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes orbFloat {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(40px, -60px) scale(1.1); }
      66% { transform: translate(-30px, 40px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.5;
      animation: orbFloat 15s infinite ease-in-out;
    }
    .glass-panel {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
    }
    .holographic-ticket {
      position: relative;
      background: linear-gradient(145deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(139, 92, 246, 0.2);
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .holographic-ticket:hover {
      transform: translateY(-5px) scale(1.01);
      box-shadow: 0 20px 50px -10px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
      border-color: rgba(139, 92, 246, 0.4);
    }
    .status-glow-confirmed {
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }
    .status-glow-cancelled {
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
    }
    .qr-scanner {
      position: absolute;
      width: 100%;
      height: 2px;
      background: rgba(16, 185, 129, 0.8);
      box-shadow: 0 0 10px rgba(16, 185, 129, 1);
      animation: scanline 2.5s infinite linear;
    }
    .tab-active {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05));
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
      color: #c4b5fd;
    }
  `}} />
);

/* ── QR Component ────────────────────────────────────────────────────────────── */
const TicketQR: React.FC<{ booking: any; size?: number }> = ({ booking, size = 150 }) => {
  const [qrUrl, setQrUrl] = useState('');
  useEffect(() => {
    generateTicketQR({
      bookingId: booking._id || booking.id, movieTitle: booking.movieId?.title || booking.movieTitle,
      theatreName: booking.theatreId?.name || booking.theatreName, showDate: booking.showDate,
      showTime: booking.showTime, seats: booking.seats,
      finalAmount: booking.finalAmount, userId: booking.userId,
    }).then(setQrUrl);
  }, [booking]); 
  if (!qrUrl) return (
    <div className="flex items-center justify-center bg-white/5 rounded-2xl animate-pulse" style={{ width: size, height: size }}>
      <span className="text-violet-400/50 text-xs font-bold tracking-widest uppercase">Generating</span>
    </div>
  );
  return (
    <div className="relative p-2 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
      <img src={qrUrl} alt="QR" width={size} height={size} className="rounded-xl" />
      <div className="qr-scanner" />
    </div>
  );
};

/* ── Smart Booking Card ──────────────────────────────────────────────────────── */
const SmartBookingCard: React.FC<{
  booking: any;
  onCancel: (booking: any) => void;
  onRate: (booking: any) => void;
}> = ({ booking, onCancel, onRate }) => {
  const [showQR, setShowQR] = useState(false);
  
  const movie = booking.movieId || {};
  const theatre = booking.theatreId || {};
  const isConfirmed = booking.status === 'confirmed';
  
  const today = new Date().toISOString().split('T')[0];
  const isPast = booking.showDate < today;
  
  return (
    <div className="mb-6 perspective-1000 z-10">
      <div className="holographic-ticket">
        {/* Top Status Gradient Bar */}
        <div style={{
          height: 4, 
          background: isConfirmed && !isPast ? 'linear-gradient(90deg, #10b981, #34d399)' 
                    : isConfirmed && isPast ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' 
                    : 'linear-gradient(90deg, #ef4444, #f87171)'
        }} />
        
        <div className="p-6 flex flex-col md:flex-row gap-8 items-center relative">
          
          {/* subtle background graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />

          {/* Left: Poster & Basic Info */}
          <div className="flex gap-5 w-full md:w-[35%] relative z-10">
            <div className="relative shrink-0 w-24 h-36 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
              <img src={movie.poster || ''} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-white font-extrabold text-2xl line-clamp-2 leading-tight mb-3 drop-shadow-md">{movie.title || booking.movieTitle}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  ID: {booking._id?.slice(0, 8).toUpperCase() || booking.id?.slice(0, 8)}
                </span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Middle: Theatre, Time, Seats */}
          <div className="w-full md:w-[40%] flex flex-col gap-4 py-4 md:py-0 md:px-6 md:border-l border-white/10 relative z-10">
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">🏛️</div>
              <span className="text-base font-semibold">{theatre.name || booking.theatreName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">⏰</div>
              <span className="text-base font-semibold text-violet-200">{new Date(booking.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}<span className="mx-2 text-white/20">|</span>{booking.showTime}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(booking.seats || []).map((seat: string) => (
                <span key={seat} className="text-xs font-black px-3 py-1.5 rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                  {seat}
                </span>
              ))}
            </div>
          </div>
          
          {/* Right: Amounts & Actions */}
          <div className="w-full md:w-[25%] flex flex-col items-start md:items-end md:justify-center md:border-l border-white/10 pl-0 md:pl-6 relative z-10">
            <div className="flex flex-col items-start md:items-end mb-4 w-full">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Paid</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 font-black text-3xl mb-2">₹{booking.finalAmount}</span>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isConfirmed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} ${isConfirmed ? 'status-glow-confirmed' : 'status-glow-cancelled'}`}>
                <div className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse shadow-[0_0_8px_currentColor]`} />
                <span className={`text-xs font-black uppercase tracking-wider ${isConfirmed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {booking.status} {booking.refundStatus && booking.refundStatus !== 'none' && `(${booking.refundStatus})`}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full mt-2">
              {isConfirmed && !isPast && (
                <>
                  <button onClick={() => setShowQR(!showQR)} className={`w-full text-xs font-black px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${showQR ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30'}`}>
                    {showQR ? 'Hide Ticket' : '🎟️ View Ticket'}
                  </button>
                  <button onClick={() => onCancel(booking)} className="w-full text-xs font-bold px-4 py-2.5 rounded-xl transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
                    Cancel Booking
                  </button>
                </>
              )}
              {isConfirmed && isPast && !booking.hasRated && (
                <button onClick={() => onRate(booking)} className="w-full text-xs font-black px-4 py-3 rounded-xl transition-all bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2">
                  ⭐ Rate Experience
                </button>
              )}
            </div>
          </div>

        </div>
        
        {/* Expanded QR Ticket Section */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showQR && isConfirmed && !isPast ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-white/10 bg-black/50 p-8 flex flex-col md:flex-row items-center justify-center gap-8 relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />
            
            <div className="flex flex-col items-center">
              <h4 className="text-gray-400 font-black text-xs tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                <span className="w-8 h-px bg-gray-600" /> SCAN AT ENTRANCE <span className="w-8 h-px bg-gray-600" />
              </h4>
              <TicketQR booking={booking} size={200} />
              <p className="text-emerald-400 font-bold mt-6 text-sm flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Valid Digital Pass
              </p>
            </div>
            
            <div className="hidden md:flex flex-col gap-4 pl-8 border-l border-white/10">
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Admit</p>
                <p className="text-white font-black text-xl">{booking.seats.length} Person(s)</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Ticket Type</p>
                <p className="text-white font-black text-xl">Premium</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Confirmation</p>
                <p className="text-white font-mono text-lg">{booking._id?.slice(-8).toUpperCase() || booking.id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ── Main Bookings Page ──────────────────────────────────────────────────────── */
export const MyBookings: React.FC = () => {
  const { currentUser, navigate, rateMovie } = useApp();
  
  const [stats, setStats] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const [cancelModal, setCancelModal] = useState<{ open: boolean; booking: any | null }>({ open: false, booking: null });
  const [refundMethod, setRefundMethod] = useState<'upi' | 'bank'>('upi');
  const [refundInfo, setRefundInfo] = useState({ upiId: '' });
  const [bankObj, setBankObj] = useState({ accNo: '', ifsc: '', name: '', bank: '' });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, statsRes] = await Promise.all([
        apiGetUserBookingsAll(),
        apiGetUserBookingsStats()
      ]);
      
      if (allRes.ok && allRes.data) setAllBookings(allRes.data.bookings || []);
      if (statsRes.ok && statsRes.data) setStats(statsRes.data.stats || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('auth');
      return;
    }
    fetchDashboardData();
  }, [currentUser, navigate, fetchDashboardData]);

  const handleCancelClick = (booking: any) => {
    setCancelModal({ open: true, booking });
    setRefundMethod('upi');
    setRefundInfo({ upiId: '' });
    setBankObj({ accNo: '', ifsc: '', name: '', bank: '' });
  };

  const submitCancelAndRefund = async () => {
    if (!cancelModal.booking) return;
    const finalBankDetails = refundMethod === 'bank' 
      ? `Acct: ${bankObj.accNo}, IFSC: ${bankObj.ifsc}, Name: ${bankObj.name}, Bank: ${bankObj.bank}`
      : '';
    const finalUpi = refundMethod === 'upi' ? refundInfo.upiId : '';
    
    const res = await apiCancelBookingWithRefund(cancelModal.booking._id || cancelModal.booking.id, {
      upiId: finalUpi,
      bankDetails: finalBankDetails,
      refundAmount: cancelModal.booking.finalAmount
    });
    if (res.ok) {
      setCancelModal({ open: false, booking: null });
      fetchDashboardData();
    } else {
      alert('Failed to cancel booking.');
    }
  };

  const handleRate = (booking: any) => {
    const ratingStr = prompt('Rate out of 10?');
    if (!ratingStr) return;
    const rating = parseInt(ratingStr);
    if (rating > 0 && rating <= 10) {
      if (booking.movieId?._id) {
        rateMovie(booking.movieId._id, rating, 'Great movie', booking._id);
        setTimeout(() => fetchDashboardData(), 1000);
      }
    }
  };

  if (!currentUser) return null;

  // Filter bookings
  const today = new Date().toISOString().split('T')[0];
  const upcoming = allBookings.filter(b => b.status === 'confirmed' && b.showDate >= today);
  const past = allBookings.filter(b => b.status === 'confirmed' && b.showDate < today);
  const cancelled = allBookings.filter(b => b.status === 'cancelled');

  let displayed = [];
  if (activeTab === 'upcoming') displayed = upcoming;
  else if (activeTab === 'past') displayed = past;
  else if (activeTab === 'cancelled') displayed = cancelled;
  else displayed = allBookings;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayed = displayed.filter(b => 
      b.movieTitle?.toLowerCase().includes(q) || 
      b.movieId?.title?.toLowerCase().includes(q) ||
      b.theatreName?.toLowerCase().includes(q) ||
      b.theatreId?.name?.toLowerCase().includes(q)
    );
  }

  const TABS = [
    { key: 'upcoming' as const, label: 'Upcoming Shows', count: upcoming.length, color: '#8b5cf6' },
    { key: 'past' as const, label: 'Past Movies', count: past.length, color: '#3b82f6' },
    { key: 'cancelled' as const, label: 'Cancelled', count: cancelled.length, color: '#ef4444' },
    { key: 'all' as const, label: 'All History', count: allBookings.length, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 relative overflow-hidden" style={{ background: '#05050A', paddingTop: 100 }}>
      <CustomStyles />
      
      {/* Background Orbs */}
      <div className="orb bg-violet-600 top-[-10%] right-[-5%] w-[400px] h-[400px]" />
      <div className="orb bg-blue-600 top-[20%] left-[-10%] w-[300px] h-[300px]" style={{ animationDelay: '2s' }} />
      <div className="orb bg-fuchsia-600 bottom-[10%] right-[10%] w-[350px] h-[350px]" style={{ animationDelay: '5s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="mb-12 glass-panel p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 mb-3 drop-shadow-lg">
              Cinematic Journey
            </h1>
            <p className="text-violet-200/60 font-medium text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa]"></span>
              Welcome to your personal dashboard, <span className="text-white font-bold">{currentUser.name}</span>.
            </p>
          </div>
          <button onClick={fetchDashboardData} className="relative z-10 px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-lg group">
            <span className={`text-lg ${loading ? 'animate-spin' : 'group-hover:-rotate-45 transition-transform'}`}>🔄</span> 
            Sync Data
          </button>
        </div>

        {/* Dynamic Stats Row  */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5 mb-12">
            {[
              { label: 'Visits', value: stats.totalBookings, color: '#8b5cf6', icon: ICONS.Ticket },
              { label: 'Upcoming', value: stats.upcomingShows, color: '#10b981', icon: ICONS.Upcoming },
              { label: 'Watched', value: stats.completedShows, color: '#3b82f6', icon: ICONS.Movie },
              { label: 'Missed', value: stats.cancelledTickets, color: '#ef4444', icon: ICONS.Cancel },
              { label: 'Spent', value: `₹${stats.totalSpent}`, color: '#f59e0b', icon: ICONS.Wallet },
              { label: 'This M.', value: `₹${stats.thisMonthSpent}`, color: '#6366f1', icon: ICONS.Wallet },
              { label: 'Fav T.', value: stats.favTheatre === 'None' ? '-' : stats.favTheatre.split(' ')[0], color: '#ec4899', icon: ICONS.Theatre },
              { label: 'Top Fix', value: stats.favMovie === 'None' ? '-' : stats.favMovie.split(' ')[0], color: '#14b8a6', icon: ICONS.Star }
            ].map((s, i) => (
              <div key={i} className="glass-panel flex flex-col p-5 rounded-2xl items-center justify-center relative transition-transform hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] group cursor-default">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <span className="absolute top-2 right-2 text-sm opacity-20 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0">{s.icon}</span>
                <span className="text-2xl font-black mb-1 drop-shadow-md" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 group-hover:text-gray-300">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controls: Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-10 items-center glass-panel p-3 rounded-2xl">
          
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide snap-x">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`snap-start flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap border ${activeTab === t.key ? 'tab-active' : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'}`}
              >
                {t.label} 
                <span className="text-xs px-2.5 py-1 rounded-md font-black shadow-inner" style={{ background: activeTab === t.key ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400/50">🔍</span>
            <input
              type="text"
              placeholder="Search movie or theatre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-semibold text-white focus:outline-none transition-all placeholder:text-gray-500 bg-black/40 border border-white/10 focus:border-violet-500/50 focus:bg-black/60 focus:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
            />
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="glass-panel text-center py-32 rounded-3xl animate-pulse">
            <span className="text-6xl block mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🎫</span>
            <p className="text-violet-300 font-black tracking-[0.2em] uppercase text-sm">Decoding Records...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="glass-panel text-center py-32 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-7xl block mb-6 filter grayscale opacity-20 group-hover:opacity-40 transition-opacity group-hover:scale-110 duration-500">🍿</span>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">No {activeTab} history</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto font-medium">Your cinematic timeline is empty for this category. Ready for your next adventure?</p>
            <button onClick={() => navigate('movies')} className="relative px-8 py-4 rounded-xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] overflow-hidden">
              <span className="relative z-10">Browse Experiences</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {displayed.map(b => (
              <SmartBookingCard 
                key={b._id || b.id} 
                booking={b} 
                onCancel={handleCancelClick}
                onRate={handleRate} 
              />
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {/* Cancel & Refund Modal */}
      {cancelModal.open && cancelModal.booking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCancelModal({ open: false, booking: null })} />
          <div className="glass-panel rounded-3xl relative z-10 w-full max-w-[480px] flex flex-col box-border overflow-hidden border border-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] animate-[ag-in_0.3s_cubic-bezier(0.22,1,0.36,1)]">
            
            {/* Holographic header */}
            <div className="p-6 pb-5 relative overflow-hidden bg-gradient-to-b from-red-900/20 to-transparent border-b border-white/5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/20 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Cancel Booking</h3>
                <button onClick={() => setCancelModal({ open: false, booking: null })} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">✕</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Summary Card */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 flex gap-4 items-center">
                <div className="w-12 h-16 rounded-lg bg-white/10 overflow-hidden shrink-0">
                  <img src={cancelModal.booking.movieId?.poster || ''} className="w-full h-full object-cover text-[10px] text-gray-600 flex items-center justify-center" alt="" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Refunding</p>
                  <p className="text-white font-black text-lg line-clamp-1">{cancelModal.booking.movieTitle || cancelModal.booking.movieId?.title}</p>
                  <p className="text-amber-400 font-extrabold text-xl mt-1">₹{cancelModal.booking.finalAmount}</p>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Refund Method</p>
              <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl mb-6">
                <button 
                  onClick={() => setRefundMethod('upi')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${refundMethod === 'upi' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  UPI (Instant)
                </button>
                <button 
                  onClick={() => setRefundMethod('bank')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${refundMethod === 'bank' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  Bank Transfer
                </button>
              </div>

              {/* Dynamic Form Area */}
              <div className="space-y-4 mb-2 min-h-[180px]">
                {refundMethod === 'upi' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">UPI ID</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70">⚡</span>
                      <input 
                        type="text" 
                        placeholder="e.g. 9876543210@ybl"
                        value={refundInfo.upiId}
                        onChange={(e) => setRefundInfo({...refundInfo, upiId: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 font-medium hover:border-violet-500/50 focus:border-violet-500 focus:outline-none focus:bg-black/60 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-400/80 mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Funds will be credited instantly to this UPI ID</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter bank account no."
                        value={bankObj.accNo}
                        onChange={(e) => setBankObj({...bankObj, accNo: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 font-medium hover:border-violet-500/50 focus:border-violet-500 focus:outline-none focus:bg-black/60 transition-all"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">IFSC Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. HDFC0001234"
                          value={bankObj.ifsc}
                          onChange={(e) => setBankObj({...bankObj, ifsc: e.target.value.toUpperCase()})}
                          maxLength={11}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 font-medium hover:border-violet-500/50 focus:border-violet-500 focus:outline-none focus:bg-black/60 transition-all uppercase"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bank Name</label>
                        <input 
                          type="text" 
                          placeholder="Bank Name"
                          value={bankObj.bank}
                          onChange={(e) => setBankObj({...bankObj, bank: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 font-medium hover:border-violet-500/50 focus:border-violet-500 focus:outline-none focus:bg-black/60 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Holder Name</label>
                      <input 
                        type="text" 
                        placeholder="Name exactly as per bank records"
                        value={bankObj.name}
                        onChange={(e) => setBankObj({...bankObj, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 font-medium hover:border-violet-500/50 focus:border-violet-500 focus:outline-none focus:bg-black/60 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-amber-400/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Bank transfers take 2-4 business days.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setCancelModal({ open: false, booking: null })}
                className="flex-1 py-3.5 rounded-xl font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={submitCancelAndRefund}
                disabled={(refundMethod === 'upi' && !refundInfo.upiId) || (refundMethod === 'bank' && (!bankObj.accNo || !bankObj.ifsc))}
                className="flex-[1.5] py-3.5 rounded-xl font-black bg-gradient-to-r from-red-600 to-amber-500 text-white hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
