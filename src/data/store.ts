export type SeatCategory = 'normal' | 'silver' | 'gold' | 'premium';
export type TheatreType = 'IMAX' | 'PVR' | 'Standard' | '4DX';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ShowFormat = '2D' | '3D' | 'IMAX' | '4DX' | 'Dolby' | '4K';

export const SHOW_FORMATS: ShowFormat[] = ['2D', '3D', 'IMAX', '4DX', 'Dolby', '4K'];
export const SHOW_LANGUAGES = [
  'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam',
  'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Gujarati',
];

// ─── Core types ──────────────────────────────────────────────────────────────

export interface Seat {
  id: string;
  row: string;
  col: number;
  category: SeatCategory;
  isBooked: boolean;
  isBlocked: boolean;   // owner-blocked (maintenance / reserved)
  blockedReason?: string;
  price: number;
}

export interface Screen {
  id: string;
  name: string;
  rows: number;
  cols: number;
  seats: Seat[];
}

export interface ShowTime {
  id: string;
  time: string;           // e.g. "06:30 PM"
  date: string;           // YYYY-MM-DD
  language: string;
  format: ShowFormat;
  availableSeats: number;
  totalSeats: number;
  priceOverride?: {
    normal?: number;
    silver?: number;
    gold?: number;
    premium?: number;
  };
  movieId?: string;
  isOwnerManaged?: boolean;
  isEnded?: boolean;      // Theatre owner manually ended this show
  endedAt?: string;       // ISO timestamp when ended
}

export interface CastMember {
  id?: string;            // generated client-side for add/remove
  name: string;
  role: string;
  image: string;          // base64 or URL
}

export interface Trailer {
  id: string;
  title: string;
  url: string;
  duration: string;
  image?: string;  // custom thumbnail (base64 or URL)
}

export interface UserRating {
  userId: string;
  userName: string;
  rating: number;
  review: string;
  date: string;
}

export interface Movie {
  id: string;
  title: string;
  genre: string[];
  language: string[];
  duration: number;
  rating: number;
  votes: number;
  releaseDate: string;
  isNowShowing: boolean;
  isComingSoon: boolean;
  isTrending: boolean;
  poster: string;
  banner: string;
  description: string;
  cast: string[];
  castMembers: CastMember[];
  director: string;
  certificate: string;
  trailerUrl?: string;      // YouTube / external URL
  trailerFile?: string;     // base64 video uploaded from device
  trailers?: Trailer[];     // multiple trailers (admin-managed)
  userRatings: UserRating[];
}

export interface TheatreApprovalRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  theatreData: Omit<Theatre, 'id' | 'approvalStatus' | 'isActive'>;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  city: string;
  image: string;
  type: TheatreType;
  amenities: string[];
  screens: Screen[];
  showTimes: ShowTime[];
  ownerId: string;
  ownerName?: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  lat?: number;
  lng?: number;
}

export interface Booking {
  id: string;
  userId: string;
  movieId: string;
  theatreId: string;
  showTimeId: string;
  showId?: string;           // backend field name (same value as showTimeId)
  showLanguage?: string;
  showFormat?: string;
  seats: string[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  couponCode?: string;
  paymentMethod: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  bookingDate: string;
  showDate: string;
  showTime: string;
  movieTitle: string;
  theatreName: string;
  seatDetails: { id: string; row: string; col: number; category: SeatCategory }[];
  hasRated: boolean;
  cancelledAt?: string;
  cancelledBy?: 'user' | 'theatre_owner' | 'admin';
  refundAmount?: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'flat';
  maxDiscount?: number;
  minAmount: number;
  validTill: string;
  isActive: boolean;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  role: 'user' | 'admin' | 'theatre_owner';
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  avatar?: string;          // base64 profile picture
  username?: string;        // display handle
  gender?: 'Male' | 'Female' | 'Other';
  bio?: string;
  movieInterests?: string[]; // selected genre chips
  joinDate: string;
  bookings: string[];
}

export interface TheatreOwnerRegistration {
  // Step 1
  name: string;
  email: string;
  password: string;
  phone: string;
  // Step 2
  avatar?: string;
  theatreName: string;
  theatreLocation: string;
  theatreCity: string;
  aadhaarNumber: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  // Step 3
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: string;
  validTill: string;
  code: string;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const generateSeats = (rows: number, cols: number): Seat[] => {
  const seats: Seat[] = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const pricing: Record<SeatCategory, number> = {
    normal: 120, silver: 180, gold: 250, premium: 350,
  };
  for (let r = 0; r < rows; r++) {
    const row = rowLetters[r] ?? String(r);
    let cat: SeatCategory = 'normal';
    if (r >= Math.floor(rows * 0.7)) cat = 'premium';
    else if (r >= Math.floor(rows * 0.4)) cat = 'gold';
    else if (r >= 2) cat = 'silver';
    for (let c = 1; c <= cols; c++) {
      seats.push({
        id: `${row}${c}`,
        row, col: c, category: cat,
        isBooked: Math.random() < 0.18,
        isBlocked: false,
        price: pricing[cat],
      });
    }
  }
  return seats;
};

// Generate dates starting from today
const buildDates = (): string[] => {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
};

// ─── Showtime generator ───────────────────────────────────────────────────────
// Each theatre gets showtimes for every day in the 7-day window,
// with multiple languages so the language-picker has data to display.

const TIMES_FULL = [
  '09:30 AM', '12:00 PM', '03:00 PM', '06:30 PM', '09:30 PM', '11:59 PM',
];

const LANG_SETS: Record<TheatreType, string[][]> = {
  IMAX: [['Hindi', 'IMAX'], ['English', 'IMAX'], ['Telugu', 'IMAX']],
  PVR: [['Hindi', '3D'], ['English', '2D'], ['Tamil', '2D'], ['Kannada', '3D']],
  Standard: [['Hindi', '2D'], ['Telugu', '2D'], ['Kannada', '2D'], ['Tamil', '3D'], ['English', '2D']],
  '4DX': [['Hindi', '4DX'], ['English', '4DX'], ['Telugu', '4DX']],
};

const genShowTimes = (type: TheatreType, movieIds: string[]): ShowTime[] => {
  const dates = buildDates();
  const shows: ShowTime[] = [];
  const langSet = LANG_SETS[type] ?? LANG_SETS['Standard'];

  dates.forEach((date, di) => {
    const timesForDay = di === 0
      ? TIMES_FULL.filter((_, ti) => {
        // On today, only show future times (rough check: skip 09:30 AM if after noon)
        const now = new Date();
        const hour = now.getHours();
        if (ti === 0 && hour >= 12) return false;
        if (ti === 1 && hour >= 13) return false;
        return true;
      })
      : TIMES_FULL;

    timesForDay.forEach((time, ti) => {
      const [lang, fmt] = langSet[ti % langSet.length];
      const total = 100 + Math.floor(Math.random() * 100);
      const booked = Math.floor(Math.random() * total * 0.5);
      shows.push({
        id: `st_${type}_${date}_${ti}`,
        time,
        date,
        language: lang,
        format: fmt as ShowFormat,
        availableSeats: total - booked,
        totalSeats: total,
        movieId: movieIds[ti % movieIds.length],
        isOwnerManaged: false,
        priceOverride: {
          normal: type === 'IMAX' ? 300 : type === '4DX' ? 400 : 120,
          silver: type === 'IMAX' ? 400 : type === '4DX' ? 500 : 180,
          gold: type === 'IMAX' ? 500 : type === '4DX' ? 600 : 250,
          premium: type === 'IMAX' ? 700 : type === '4DX' ? 800 : 350,
        },
      });
    });
  });
  return shows;
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────

export const MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Kalki 2898 AD',
    genre: ['Action', 'Sci-Fi', 'Drama'],
    language: ['Telugu', 'Hindi', 'Tamil'],
    duration: 181, rating: 8.4, votes: 245600,
    releaseDate: '2024-06-27',
    isNowShowing: true, isComingSoon: false, isTrending: true,
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&h=450&fit=crop',
    description: 'In a dystopian future, a warrior rises to fulfil an ancient prophecy that could save or destroy humanity. A stunning visual spectacle that blends mythology with science fiction.',
    cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan', 'Kamal Haasan'],
    castMembers: [
      { name: 'Prabhas', role: 'Kalki / Bhairava', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { name: 'Deepika Padukone', role: 'Sumathi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
      { name: 'Amitabh Bachchan', role: 'Ashwatthama', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Kamal Haasan', role: 'Supreme Yaskin', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Nag Ashwin', certificate: 'UA',
    trailerUrl: 'https://www.youtube.com/watch?v=sOEg_YZQsTI',
    trailers: [
      { id: 'tr1', title: 'Official Trailer', url: 'https://www.youtube.com/watch?v=sOEg_YZQsTI', duration: '2:45' },
      { id: 'tr2', title: 'Teaser', url: 'https://www.youtube.com/watch?v=sOEg_YZQsTI', duration: '1:30' },
      { id: 'tr3', title: 'Behind the Scenes', url: 'https://www.youtube.com/watch?v=sOEg_YZQsTI', duration: '4:12' },
    ],
    userRatings: [],
  },
  {
    id: 'm2',
    title: 'Stree 2',
    genre: ['Horror', 'Comedy', 'Thriller'],
    language: ['Hindi'],
    duration: 150, rating: 8.8, votes: 312000,
    releaseDate: '2024-08-15',
    isNowShowing: true, isComingSoon: false, isTrending: true,
    poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&h=450&fit=crop',
    description: 'The terror of Stree returns to Chanderi, but this time she has new victims in mind. A perfect blend of horror and comedy.',
    cast: ['Rajkummar Rao', 'Shraddha Kapoor', 'Pankaj Tripathi'],
    castMembers: [
      { name: 'Rajkummar Rao', role: 'Vicky', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Shraddha Kapoor', role: 'Stree', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
      { name: 'Pankaj Tripathi', role: 'Rudra', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Amar Kaushik', certificate: 'UA',
    trailerUrl: 'https://www.youtube.com/watch?v=uTFRiKk_t-o',
    trailers: [
      { id: 'tr4', title: 'Official Trailer', url: 'https://www.youtube.com/watch?v=uTFRiKk_t-o', duration: '2:30' },
      { id: 'tr5', title: 'Teaser', url: 'https://www.youtube.com/watch?v=uTFRiKk_t-o', duration: '1:15' },
    ],
    userRatings: [],
  },
  {
    id: 'm3',
    title: 'Pushpa 2: The Rule',
    genre: ['Action', 'Crime', 'Drama'],
    language: ['Telugu', 'Hindi'],
    duration: 190, rating: 7.9, votes: 198000,
    releaseDate: '2024-12-05',
    isNowShowing: true, isComingSoon: false, isTrending: true,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=450&fit=crop',
    description: 'Pushpa Raj expands his red sandalwood smuggling empire while facing a determined officer.',
    cast: ['Allu Arjun', 'Rashmika Mandanna', 'Fahadh Faasil'],
    castMembers: [
      { name: 'Allu Arjun', role: 'Pushpa Raj', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
      { name: 'Rashmika Mandanna', role: 'Srivalli', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
      { name: 'Fahadh Faasil', role: 'Bhanwar Singh', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Sukumar', certificate: 'A',
    trailerUrl: 'https://www.youtube.com/watch?v=lyNVVNpWfKs',
    trailers: [
      { id: 'tr6', title: 'Official Trailer', url: 'https://www.youtube.com/watch?v=lyNVVNpWfKs', duration: '3:10' },
      { id: 'tr7', title: 'Making of Pushpa 2', url: 'https://www.youtube.com/watch?v=lyNVVNpWfKs', duration: '5:20' },
    ],
    userRatings: [],
  },
  {
    id: 'm4',
    title: 'Devara',
    genre: ['Action', 'Drama', 'Thriller'],
    language: ['Telugu', 'Hindi', 'Tamil'],
    duration: 173, rating: 7.5, votes: 143000,
    releaseDate: '2024-09-27',
    isNowShowing: true, isComingSoon: false, isTrending: false,
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=1200&h=450&fit=crop',
    description: "A feared sea-lord's legacy of terror and the son who must reclaim it in a time of rising threats.",
    cast: ['Jr. NTR', 'Janhvi Kapoor', 'Saif Ali Khan'],
    castMembers: [
      { name: 'Jr. NTR', role: 'Devara / Vara', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
      { name: 'Janhvi Kapoor', role: 'Thangam', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Koratala Siva', certificate: 'UA', userRatings: [],
  },
  {
    id: 'm5',
    title: 'Mufasa: The Lion King',
    genre: ['Animation', 'Adventure', 'Drama'],
    language: ['English', 'Hindi'],
    duration: 118, rating: 7.6, votes: 89000,
    releaseDate: '2024-12-20',
    isNowShowing: true, isComingSoon: false, isTrending: false,
    poster: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1597466765702-99b10c729a86?w=1200&h=450&fit=crop',
    description: 'The origin story of Mufasa — his journey from orphaned cub to legendary King of Pride Rock.',
    cast: ['Aaron Pierre', 'Kelvin Harrison Jr.', 'Seth Rogen'],
    castMembers: [],
    director: 'Barry Jenkins', certificate: 'U',
    trailerUrl: 'https://www.youtube.com/watch?v=YBbRYokRfBM',
    trailers: [
      { id: 'tr8', title: 'Official Trailer', url: 'https://www.youtube.com/watch?v=YBbRYokRfBM', duration: '2:15' },
    ],
    userRatings: [],
  },
  {
    id: 'm6',
    title: 'Fighter',
    genre: ['Action', 'Drama'],
    language: ['Hindi'],
    duration: 166, rating: 6.8, votes: 89000,
    releaseDate: '2025-06-25',
    isNowShowing: false, isComingSoon: true, isTrending: false,
    poster: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1200&h=450&fit=crop',
    description: "India's first aerial action franchise follows an Air Force squadron against a deadly terrorist org.",
    cast: ['Hrithik Roshan', 'Deepika Padukone', 'Anil Kapoor'],
    castMembers: [
      { name: 'Hrithik Roshan', role: 'Patty', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Siddharth Anand', certificate: 'UA', userRatings: [],
  },
  {
    id: 'm7',
    title: 'Singham Returns',
    genre: ['Action', 'Crime'],
    language: ['Hindi', 'Tamil', 'Telugu'],
    duration: 155, rating: 7.2, votes: 124000,
    releaseDate: '2025-08-15',
    isNowShowing: false, isComingSoon: true, isTrending: false,
    poster: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=450&fit=crop',
    description: 'The iconic cop Bajirao Singham returns with a new mission to dismantle a crime syndicate.',
    cast: ['Ajay Devgn', 'Kareena Kapoor', 'Ranveer Singh'],
    castMembers: [],
    director: 'Rohit Shetty', certificate: 'UA', userRatings: [],
  },
  {
    id: 'm8',
    title: 'Animal Park',
    genre: ['Action', 'Thriller', 'Drama'],
    language: ['Hindi'],
    duration: 175, rating: 8.1, votes: 167000,
    releaseDate: '2025-09-14',
    isNowShowing: false, isComingSoon: true, isTrending: true,
    poster: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=560&fit=crop',
    banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=450&fit=crop',
    description: 'The sequel to Animal takes raw intensity to new heights as Ranvijay faces new threats.',
    cast: ['Ranbir Kapoor', 'Rashmika Mandanna', 'Bobby Deol'],
    castMembers: [
      { name: 'Ranbir Kapoor', role: 'Ranvijay', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    ],
    director: 'Sandeep Reddy Vanga', certificate: 'A', userRatings: [],
  },
];

const NOW_IDS = MOVIES.filter(m => m.isNowShowing).map(m => m.id);

export const THEATRES: Theatre[] = [
  {
    id: 't1', name: 'PVR IMAX Cinemas',
    location: 'Phoenix Palassio Mall, Lucknow', city: 'Lucknow',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=300&fit=crop',
    type: 'IMAX',
    amenities: ['Parking', 'Food Court', 'IMAX Screen', 'Dolby Atmos', 'Recliner Seats'],
    screens: [
      { id: 's1', name: 'Screen 1 – IMAX', rows: 14, cols: 20, seats: generateSeats(14, 20) },
      { id: 's2', name: 'Screen 2', rows: 10, cols: 16, seats: generateSeats(10, 16) },
    ],
    showTimes: genShowTimes('IMAX', NOW_IDS),
    ownerId: 'owner1', ownerName: 'Theatre Owner 1',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't2', name: 'Cinepolis Grand',
    location: 'Pacific Mall, Delhi', city: 'Delhi',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=300&fit=crop',
    type: 'PVR',
    amenities: ['Parking', 'Food Court', '4K Projection', 'Dolby Sound'],
    screens: [
      { id: 's3', name: 'Screen 1', rows: 12, cols: 18, seats: generateSeats(12, 18) },
      { id: 's4', name: 'Screen 2 PVR', rows: 10, cols: 15, seats: generateSeats(10, 15) },
    ],
    showTimes: genShowTimes('PVR', NOW_IDS),
    ownerId: 'owner2', ownerName: 'Theatre Owner 2',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't3', name: 'Inox Multiplex',
    location: 'Forum Mall, Bengaluru', city: 'Bengaluru',
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&h=300&fit=crop',
    type: 'Standard',
    amenities: ['Parking', 'Café', '2D/3D Screens'],
    screens: [{ id: 's5', name: 'Screen 1', rows: 10, cols: 14, seats: generateSeats(10, 14) }],
    showTimes: genShowTimes('Standard', NOW_IDS),
    ownerId: 'owner1', ownerName: 'Theatre Owner 1',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't4', name: '4DX Experience Center',
    location: 'Nexus Mall, Mumbai', city: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=300&fit=crop',
    type: '4DX',
    amenities: ['4DX Motion Seats', 'Wind Effects', 'Water Mist', 'Scent System', 'Parking'],
    screens: [{ id: 's6', name: 'Screen 1 – 4DX', rows: 8, cols: 12, seats: generateSeats(8, 12) }],
    showTimes: genShowTimes('4DX', NOW_IDS),
    ownerId: 'owner2', ownerName: 'Theatre Owner 2',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't5', name: 'Miraj Cinemas',
    location: 'City Center Mall, Hyderabad', city: 'Hyderabad',
    image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=600&h=300&fit=crop',
    type: 'Standard',
    amenities: ['Parking', 'Food Court', 'Standard Screens'],
    screens: [
      { id: 's7', name: 'Screen 1', rows: 12, cols: 16, seats: generateSeats(12, 16) },
      { id: 's8', name: 'Screen 2', rows: 10, cols: 14, seats: generateSeats(10, 14) },
    ],
    showTimes: genShowTimes('Standard', NOW_IDS),
    ownerId: 'owner3', ownerName: 'Theatre Owner 3',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't6', name: 'Carnival Cinemas',
    location: 'Oberoi Mall, Mumbai', city: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&h=300&fit=crop',
    type: 'Standard',
    amenities: ['Parking', 'Food Court', 'Dolby Sound'],
    screens: [
      { id: 's9', name: 'Screen 1', rows: 12, cols: 18, seats: generateSeats(12, 18) },
      { id: 's10', name: 'Screen 2', rows: 10, cols: 15, seats: generateSeats(10, 15) },
    ],
    showTimes: genShowTimes('Standard', NOW_IDS),
    ownerId: 'owner3', ownerName: 'Theatre Owner 3',
    approvalStatus: 'approved', isActive: true,
  },
  {
    id: 't7', name: 'SPI Cinemas',
    location: 'Express Avenue Mall, Chennai', city: 'Chennai',
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&h=300&fit=crop',
    type: 'PVR',
    amenities: ['Parking', 'Food Court', '4K Projection', 'Recliner Seats'],
    screens: [
      { id: 's11', name: 'Screen 1', rows: 12, cols: 18, seats: generateSeats(12, 18) },
    ],
    showTimes: genShowTimes('PVR', NOW_IDS),
    ownerId: 'owner2', ownerName: 'Theatre Owner 2',
    approvalStatus: 'approved', isActive: true,
  },
];

export const APPROVAL_REQUESTS: TheatreApprovalRequest[] = [
  {
    id: 'req1', ownerId: 'owner4', ownerName: 'New Owner Demo',
    ownerEmail: 'newowner@theatre.com',
    theatreData: {
      name: 'Galaxy Multiplex', location: 'Andheri West, Mumbai', city: 'Mumbai',
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=300&fit=crop',
      type: 'Standard', amenities: ['Parking', 'Food Court'],
      screens: [{ id: 'demo_s1', name: 'Screen 1', rows: 10, cols: 15, seats: [] }],
      showTimes: [], ownerId: 'owner4', ownerName: 'New Owner Demo',
    },
    status: 'pending',
    submittedAt: new Date().toISOString().split('T')[0],
  },
];

export const COUPONS: Coupon[] = [
  { id: 'c1', code: 'FIRST50', discount: 50, discountType: 'percentage', maxDiscount: 150, minAmount: 200, validTill: '2025-12-31', isActive: true, description: '50% off on your first booking (max ₹150)' },
  { id: 'c2', code: 'WEEKEND100', discount: 100, discountType: 'flat', minAmount: 300, validTill: '2025-12-31', isActive: true, description: 'Flat ₹100 off on weekend bookings' },
  { id: 'c3', code: 'PAYTM200', discount: 200, discountType: 'flat', minAmount: 500, validTill: '2025-12-31', isActive: true, description: 'Flat ₹200 off with Paytm payment' },
  { id: 'c4', code: 'IMAX20', discount: 20, discountType: 'percentage', maxDiscount: 300, minAmount: 400, validTill: '2025-12-31', isActive: true, description: '20% off on IMAX screenings' },
  { id: 'c5', code: 'BLOCKBUSTER', discount: 30, discountType: 'percentage', maxDiscount: 500, minAmount: 600, validTill: '2025-06-30', isActive: false, description: '30% off on blockbuster movies' },
];

export const OFFERS: Offer[] = [
  { id: 'o1', title: 'Cine Connect SuperStar', description: 'Get 50% cashback up to ₹150 on your first booking', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=300&fit=crop', discount: '50% OFF', validTill: '2025-12-31', code: 'FIRST50', category: 'Movies' },
  { id: 'o2', title: 'HDFC Bank Offer', description: 'Use HDFC Debit/Credit card and get ₹200 off', image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=300&fit=crop', discount: '₹200 OFF', validTill: '2025-06-30', code: 'HDFC200', category: 'Bank Offer' },
  { id: 'o3', title: 'IMAX Weekend Special', description: 'Enjoy 20% off on all IMAX screenings this weekend', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&h=300&fit=crop', discount: '20% OFF', validTill: '2025-03-31', code: 'IMAX20', category: 'Premium' },
  { id: 'o4', title: 'Student Discount', description: 'Show your student ID and get 25% off on weekdays', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=300&fit=crop', discount: '25% OFF', validTill: '2025-12-31', code: 'STUDENT25', category: 'Special' },
  { id: 'o5', title: 'Paytm Cashback', description: 'Pay via Paytm and get flat ₹200 cashback', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=300&fit=crop', discount: '₹200 Cashback', validTill: '2025-09-30', code: 'PAYTM200', category: 'Wallet' },
  { id: 'o6', title: 'Group Booking', description: 'Book 5+ tickets and get ₹300 off instantly', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=300&fit=crop', discount: '₹300 OFF', validTill: '2025-12-31', code: 'GROUP300', category: 'Group' },
];

export const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Kochi', 'Surat', 'Nagpur', 'Indore',
];

export const USERS: User[] = [
  { id: 'admin1', name: 'Super Admin', email: 'admin@cineconnect.com', password: 'admin123', phone: '9999999999', city: 'Mumbai', role: 'admin', joinDate: '2023-01-01', bookings: [] },
  { id: 'owner1', name: 'Theatre Owner 1', email: 'owner1@theatre.com', password: 'owner123', phone: '8888888881', city: 'Lucknow', role: 'theatre_owner', joinDate: '2023-02-15', bookings: [] },
  { id: 'owner2', name: 'Theatre Owner 2', email: 'owner2@theatre.com', password: 'owner123', phone: '8888888882', city: 'Delhi', role: 'theatre_owner', joinDate: '2023-03-01', bookings: [] },
  { id: 'owner3', name: 'Theatre Owner 3', email: 'owner3@theatre.com', password: 'owner123', phone: '8888888883', city: 'Hyderabad', role: 'theatre_owner', joinDate: '2023-04-10', bookings: [] },
  { id: 'user1', name: 'Rahul Sharma', email: 'rahul@example.com', password: 'user123', phone: '9876543210', city: 'Mumbai', role: 'user', joinDate: '2024-01-15', bookings: ['b1', 'b2'] },
];

const TODAY = new Date().toISOString().split('T')[0];
export const BOOKINGS: Booking[] = [
  {
    id: 'b1', userId: 'user1', movieId: 'm1', theatreId: 't1',
    showTimeId: `st_IMAX_${TODAY}_3`,
    seats: ['H5', 'H6'], totalAmount: 1000, discount: 150, finalAmount: 850,
    couponCode: 'FIRST50', paymentMethod: 'UPI', status: 'confirmed',
    bookingDate: TODAY, showDate: TODAY,
    showTime: '06:30 PM', movieTitle: 'Kalki 2898 AD', theatreName: 'PVR IMAX Cinemas',
    seatDetails: [
      { id: 'H5', row: 'H', col: 5, category: 'gold' },
      { id: 'H6', row: 'H', col: 6, category: 'gold' },
    ],
    hasRated: false,
  },
  {
    id: 'b2', userId: 'user1', movieId: 'm2', theatreId: 't2',
    showTimeId: `st_PVR_${TODAY}_2`,
    seats: ['E8', 'E9', 'E10'], totalAmount: 540, discount: 0, finalAmount: 540,
    paymentMethod: 'Credit Card', status: 'confirmed',
    bookingDate: TODAY, showDate: TODAY,
    showTime: '09:30 PM', movieTitle: 'Stree 2', theatreName: 'Cinepolis Grand',
    seatDetails: [
      { id: 'E8', row: 'E', col: 8, category: 'silver' },
      { id: 'E9', row: 'E', col: 9, category: 'silver' },
      { id: 'E10', row: 'E', col: 10, category: 'silver' },
    ],
    hasRated: true,
  },
];
