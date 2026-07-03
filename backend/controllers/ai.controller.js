/**
 * controllers/ai.controller.js
 *
 * Handles:
 *  - AI chat (Gemini API with CineConnect system prompt, smart fallback)
 *  - User context injection (name, last booking, etc.)
 *  - Support ticket CRUD
 *  - Admin: list/update support tickets
 */

const AIChatSession  = require('../models/AIChatSession.model');
const SupportTicket  = require('../models/SupportTicket.model');
const Booking        = require('../models/Booking.model');
const User           = require('../models/User.model');
const Movie          = require('../models/Movie.model');
const crypto         = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
//  CineConnect System Prompt (injected on every Gemini call)
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are CineConnect AI — the official, friendly, knowledgeable support assistant for CineConnect, a premium movie ticket booking platform in India.

PERSONALITY:
- You are a highly intelligent, general-purpose AI assistant like ChatGPT, but you also happen to be the official support AI for CineConnect.
- You can answer ANY question the user asks (general knowledge, coding, math, trivia, etc.) intelligently and accurately.
- When the user asks about movies, bookings, or CineConnect, use the provided knowledge base to help them.
- Warm, helpful, professional, concise.
- Use emojis sparingly to add personality (🎬🎟️✅❌💡).
- Never mention competitor platforms (BookMyShow, PVR app, etc.).

CINECONNECT KNOWLEDGE BASE:

📌 BOOKING TICKETS:
- Browse movies on the Home or Movies page
- Click "Book Tickets" on any movie card
- Select city → theatre → date → show time → seats
- Apply coupon at checkout for discounts
- Pay via Razorpay (UPI, Cards, Net Banking, Wallets)
- Booking confirmation sent via email with QR ticket code

📌 SEAT SELECTION:
- Interactive seat map with colour coding: Normal (grey), Silver (blue), Gold (yellow), Premium (purple)
- Max 10 seats per booking
- 360° theatre view available on supported theatres (click "View Theatre" icon)
- Locked seats shown in red — try a different show or wait a few minutes

📌 CANCELLATION POLICY:
- Cancel anytime before show start on My Bookings page
- Refund eligibility: within 24 hours of booking = 80% refund; after 24 hours but before show = 50% refund; no refund after show starts
- Cancellation by theatre owner = 100% refund
- Refunds credited to original payment method in 5–7 business days

📌 REFUND HELP:
- Go to My Bookings → select booking → click "Cancel & Refund"
- Refund takes 5–7 business days
- If no refund after 7 days, contact support@cineconnect.com
- For Razorpay-specific issues, quote your Transaction ID

📌 PAYMENT ISSUES:
- If payment debited but booking not confirmed: wait 10 mins, check My Bookings. If still missing, contact support with transaction ID
- Failed transactions: retry with different payment method or browser
- Razorpay issues: clear browser cache, try incognito, or use UPI directly
- Contact: support@cineconnect.com or +91 9999999999

📌 OFFERS & COUPONS:
- View current offers on the Offers page
- Apply coupon code at checkout in the "Promo Code" field
- Coupons are single-use per account unless stated otherwise
- Student/bank card offers available seasonally

📌 LOGIN / SIGNUP:
- Sign up with name, email, phone, password
- Role options: User, Theatre Owner (requires admin approval)
- Email OTP verification may be required
- Login at /auth page

📌 FORGOT PASSWORD:
- Click "Forgot Password" on login page
- Enter registered email → receive reset link
- Link expires in 1 hour
- Check spam folder if email not received

📌 ACCOUNT ISSUES:
- Update profile: User Dashboard → Profile section
- Change password: Profile → Security
- Delete account: contact support@cineconnect.com
- Account suspended? Contact support with registered email

📌 BOOKING HISTORY:
- Go to My Bookings page (top navigation)
- Filter by Upcoming, Past, Cancelled
- Download ticket PDF from booking details

📌 DOWNLOAD TICKET:
- My Bookings → select booking → "Download Ticket" button
- Ticket has QR code for scanning at theatre entrance
- Also accessible via confirmation email

📌 FORMATS SUPPORTED:
- 2D, 3D, IMAX, 4DX (availability depends on theatre)
- Languages: Hindi, English, Tamil, Telugu, Kannada, Malayalam, Marathi

📌 MEMBERSHIP PLANS:
- CineConnect Premium: ₹199/month — priority seat selection, 2 free cancellations/month, exclusive offers
- CineConnect Gold: ₹499/month — all Premium benefits + guest tickets, lounge access partner discounts

📌 UPCOMING FEATURES:
- Group booking with friends (social feature)
- AI-powered movie recommendations
- AR seat preview
- In-app food ordering

📌 THEATRE OWNERS:
- Register as Theatre Owner (requires admin approval)
- Manage screens, shows, and seat configurations
- View revenue analytics in Theatre Owner Dashboard

📌 CONTACT SUPPORT:
- Email: support@cineconnect.com
- Phone: +91 9999999999 (Mon–Sat, 9 AM–9 PM IST)
- WhatsApp: +91 9999999999
- Response time: Email within 24 hours, chat instant

RULES:
1. If user seems angry or frustrated, acknowledge their frustration empathetically and offer to escalate to human support
2. Never share personal data of other users
3. Keep responses under 150 words unless a detailed explanation is needed
4. Always end with a helpful follow-up question if appropriate

📌 MOVIE RECOMMENDATIONS:
- You have access to the user's favourite genres (from their profile) and booking history
- When a user asks for movie suggestions, recommendations, or what to watch — proactively recommend movies
- Format recommendations as a JSON block inside your reply using this EXACT format (do not deviate):

[MOVIE_RECOMMENDATIONS]
{"movies": [{"title": "Movie Title", "genre": ["Action", "Thriller"], "rating": 8.5, "description": "One-line compelling description", "reason": "Why this matches the user's taste", "certificate": "UA"}]}
[/MOVIE_RECOMMENDATIONS]

- Always include 2-4 movie recommendations when relevant
- Only recommend movies that are mentioned in the AVAILABLE MOVIES context (if provided)
- If no movies context is given, recommend based on genres the user mentions
- Be enthusiastic and personal: explain WHY you picked each movie for THEM specifically
- After the JSON block, add a friendly text summary of your recommendations`;

// ─────────────────────────────────────────────────────────────────────────────
//  Smart Fallback (rule-based, works without Gemini API key)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_RESPONSES = {
  booking: `🎬 **How to book tickets on CineConnect:**\n\n1. Browse movies on Home or Movies page\n2. Click **"Book Tickets"** on any movie\n3. Select your city → theatre → date → show time\n4. Pick your seats on the interactive seat map\n5. Apply a coupon (optional) → Pay via Razorpay\n\nYour e-ticket with QR code will be emailed instantly! Is there a specific step you need help with?`,
  cancel: `🎟️ **To cancel your booking:**\n\n1. Go to **My Bookings** page\n2. Click on the booking you want to cancel\n3. Click **"Cancel & Refund"**\n\n**Refund Policy:**\n- Within 24hrs of booking: 80% refund\n- After 24hrs but before show: 50% refund\n- After show starts: No refund\n\nRefunds credit in 5–7 business days. Need more help?`,
  refund: `💰 **Refund Information:**\n\nRefunds take **5–7 business days** to credit back to your original payment method.\n\n- Cancel via My Bookings page\n- If no refund after 7 days, email **support@cineconnect.com** with your booking ID and transaction ID\n- Razorpay refunds appear in your bank statement as "RAZORPAY"\n\nShall I help you initiate a cancellation?`,
  payment: `💳 **Payment Issue Help:**\n\nIf payment was deducted but no booking confirmed:\n1. Wait 10 minutes and check **My Bookings**\n2. If still missing, email **support@cineconnect.com** with your **Transaction ID**\n\nFor failed payments:\n- Try a different payment method or browser\n- Clear cache or use incognito mode\n- Try UPI directly\n\nNeed to speak with our team? Call **+91 9999999999**`,
  login: `🔐 **Login/Signup Help:**\n\n- **Sign up** with your name, email, phone & password at the Auth page\n- **Forgot password?** Click "Forgot Password" on the login form → check your email for a reset link (valid 1 hour)\n- **Email not received?** Check your spam folder\n- **Account locked?** Contact support@cineconnect.com\n\nWhat specific issue are you facing?`,
  seats: `🪑 **Seat Selection Guide:**\n\n- **Normal** (grey) — Standard seats\n- **Silver** (blue) — Mid-tier comfort\n- **Gold** (yellow) — Premium comfort\n- **Premium** (purple) — Best seats, extra legroom\n\n- Maximum **10 seats** per booking\n- Red seats = already booked\n- Some theatres offer **360° theatre view** — click the 3D icon!\n\nNeed help with a specific seat type?`,
  offers: `🎁 **Current Offers & Coupons:**\n\nCheck the **Offers page** for the latest deals!\n\nPopular discounts:\n- **FIRST10** — 10% off your first booking\n- Bank card offers (HDFC, ICICI, SBI)\n- Student discounts on weekdays\n- CineConnect Premium members get exclusive monthly offers\n\nApply your coupon code at checkout in the "Promo Code" field. Need the full offers list?`,
  download: `📥 **Download Your Ticket:**\n\n1. Go to **My Bookings** page\n2. Click on your confirmed booking\n3. Click **"Download Ticket"** — saves as PDF\n\nYour ticket includes:\n- QR code for theatre entry\n- Seat details, show time, theatre address\n\nAlso check your registered email — the ticket is sent automatically after booking!`,
  membership: `⭐ **CineConnect Membership Plans:**\n\n**Premium — ₹199/month**\n- Priority seat selection\n- 2 free cancellations/month\n- Exclusive member offers\n\n**Gold — ₹499/month**\n- All Premium benefits\n- Guest tickets\n- Lounge access partner discounts\n\nContact support to activate: support@cineconnect.com`,
  formats: `🎥 **Movie Formats Available:**\n\n- **2D** — Standard\n- **3D** — Immersive with glasses\n- **IMAX** — Largest screen, best audio\n- **4DX** — Motion seats + environmental effects\n\nFormat availability depends on the theatre. Check show details page for your theatre's available formats!`,
  recommend: `🎬 **Movie Recommendations for You!**\n\nI'd love to recommend movies based on your taste! To give you the best picks, could you tell me:\n\n- What **genres** do you enjoy? (Action, Romance, Thriller, Comedy, Horror, Drama...)\n- Any **favourite actors or directors**?\n- Are you in the mood for something **light-hearted** or **intense**?\n- **Language preference** — Hindi, English, Tamil, Telugu?\n\nOr just say something like *"suggest me a good thriller"* and I'll pick the best ones for you! 🍿`,
  human: `👤 **Connecting you to human support...**\n\nYou can reach our team via:\n- 📧 Email: **support@cineconnect.com**\n- 📞 Phone: **+91 9999999999** (Mon–Sat, 9AM–9PM IST)\n- 💬 WhatsApp: **+91 9999999999**\n\nOr use the **Contact Us** tab in this chat to send a message directly. Average response time: **under 2 hours** during business hours. 🙏`,
  default: `Hello! I'm CineConnect AI 🎬\n\nI can help you with:\n- **Booking tickets** 🎟️\n- **Cancellations & refunds** 💰\n- **Payment issues** 💳\n- **Movie formats & seat selection** 🪑\n- **Offers & coupons** 🎁\n- **Account help** 🔐\n\nWhat do you need help with today?`,
};

function getFallbackResponse(message) {
  const msg = message.toLowerCase();
  if (msg.match(/recommend|suggest|what (to|should i) watch|good movie|best movie|movie for|similar to|like \w+ movies|what.*watch|suggest.*movie|movie suggestion|which movie|pick a movie|find.*movie/i)) return FALLBACK_RESPONSES.recommend;
  if (msg.match(/book|ticket|show|seat|select|screen|theatre|cinema|watch/))    return FALLBACK_RESPONSES.booking;
  if (msg.match(/cancel|cancell/))                                               return FALLBACK_RESPONSES.cancel;
  if (msg.match(/refund|money back|credit/))                                     return FALLBACK_RESPONSES.refund;
  if (msg.match(/payment|pay|failed|debit|charged|razorpay|upi|transaction/))   return FALLBACK_RESPONSES.payment;
  if (msg.match(/login|sign.?in|sign.?up|register|password|forgot|otp|email/)) return FALLBACK_RESPONSES.login;
  if (msg.match(/seat|row|gold|silver|premium|normal|map/))                     return FALLBACK_RESPONSES.seats;
  if (msg.match(/offer|coupon|promo|discount|deal|code/))                       return FALLBACK_RESPONSES.offers;
  if (msg.match(/download|pdf|ticket|qr|print/))                                return FALLBACK_RESPONSES.download;
  if (msg.match(/membership|plan|premium|gold|subscribe/))                       return FALLBACK_RESPONSES.membership;
  if (msg.match(/format|imax|3d|4dx|2d|quality/))                               return FALLBACK_RESPONSES.formats;
  if (msg.match(/human|agent|person|speak|call|support|help.?desk/))            return FALLBACK_RESPONSES.human;
  return FALLBACK_RESPONSES.default;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Simple sentiment detection
// ─────────────────────────────────────────────────────────────────────────────
function detectSentiment(text) {
  const t = text.toLowerCase();
  if (t.match(/angry|furious|worst|terrible|horrible|cheat|fraud|scam|disgusting|pathetic|useless/)) return 'angry';
  if (t.match(/bad|poor|disappoint|issue|problem|complaint|wrong|not working|broken|slow|fail/))       return 'negative';
  if (t.match(/good|great|love|excellent|amazing|happy|thank|perfect|awesome|wonderful/))              return 'positive';
  return 'neutral';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Gemini API call
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiAPI(messages, userContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null; // fallback mode
  }

  // Build the conversation for Gemini
  const contextAddition = userContext
    ? `\n\nCURRENT USER CONTEXT:\n- Name: ${userContext.name}\n- Last Booking: ${userContext.lastBooking || 'None'}\n- Favourite Genres: ${userContext.favouriteGenres || 'Not set'}\n- Member Since: ${userContext.joinDate || 'Recently'}\n\nPersonalize your response using this context when relevant. If the user asks for movie recommendations, suggest movies matching their favourite genres: ${userContext.favouriteGenres || 'any genre'}.`
    : '';

  // Inject real available movies from DB
  const availableMoviesContext = userContext?.availableMovies?.length
    ? `\n\nAVAILABLE MOVIES ON CINECONNECT (currently showing/coming soon):\n${userContext.availableMovies.map(m => `- "${m.title}" | Genres: ${m.genre?.join(', ')} | Rating: ${m.rating}/10 | Certificate: ${m.certificate || 'UA'} | ${m.description ? m.description.slice(0, 80) + '...' : ''}`).join('\n')}\n\nWhen recommending, ONLY pick from this list and use the exact titles as listed.`
    : '';

  const systemInstruction = SYSTEM_PROMPT + contextAddition + availableMoviesContext;

  // Convert messages to Gemini format
  const geminiContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 512,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000), // 15s timeout
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Gemini] API error:', err);
    return null;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokens = data?.usageMetadata?.totalTokenCount || 0;

  return { text: text || null, tokens };
}

// ─────────────────────────────────────────────────────────────────────────────
//  @POST /api/ai/chat
// ─────────────────────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { message, sessionId: clientSessionId, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 1000 chars).' });
    }

    // Generate or reuse session ID
    const sessionId = clientSessionId || crypto.randomUUID();

    // Get or create session document — gracefully skip if MongoDB is down
    let recentMessages = [];
    try {
      const session = await AIChatSession.findOne({ sessionId }).lean();
      recentMessages = session?.messages?.slice(-10) || [];
    } catch (dbErr) {
      console.warn('[AI Chat] Could not load session (DB may be offline):', dbErr.message);
    }

    // Build messages array for AI
    const conversationMessages = [
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];


    // Get user context if logged in
    let userContext = null;
    if (req.user) {
      try {
        const lastBooking = await Booking.findOne({ userId: req.user._id, status: 'confirmed' })
          .sort({ createdAt: -1 })
          .select('movieTitle theatreName showDate showTime')
          .lean();

        userContext = {
          name: req.user.name,
          lastBooking: lastBooking
            ? `${lastBooking.movieTitle} at ${lastBooking.theatreName} on ${lastBooking.showDate}`
            : null,
          favouriteGenres: (req.user.movieInterests || []).join(', ') || null,
          joinDate: req.user.createdAt ? new Date(req.user.createdAt).getFullYear() : null,
        };

        // Fetch real movies matching user's interests for context injection
        const genres = req.user.movieInterests || [];
        const movieQuery = {
          isActive: true,
          $or: [{ isNowShowing: true }, { isComingSoon: true }],
          ...(genres.length ? { genre: { $in: genres } } : {}),
        };
        const availableMovies = await Movie.find(movieQuery)
          .select('title genre rating description certificate')
          .sort({ rating: -1 })
          .limit(12)
          .lean();
        // Also fetch top-rated if not enough genre matches
        if (availableMovies.length < 6) {
          const topMovies = await Movie.find({ isActive: true, $or: [{ isNowShowing: true }, { isComingSoon: true }] })
            .select('title genre rating description certificate')
            .sort({ rating: -1 })
            .limit(8)
            .lean();
          const seen = new Set(availableMovies.map(m => m._id?.toString()));
          topMovies.forEach(m => { if (!seen.has(m._id?.toString())) availableMovies.push(m); });
        }
        userContext.availableMovies = availableMovies;
      } catch { /* ignore context errors */ }
    }

    // Try Gemini, fall back to rule-based
    let aiText = null;
    let tokenCount = 0;
    let usingAI = false;

    const geminiResult = await callGeminiAPI(conversationMessages, userContext);
    if (geminiResult?.text) {
      aiText = geminiResult.text;
      tokenCount = geminiResult.tokens;
      usingAI = true;
    } else {
      aiText = getFallbackResponse(message);
    }

    // Personalize fallback greeting with user name
    if (!usingAI && userContext?.name && aiText.startsWith('Hello!')) {
      aiText = aiText.replace('Hello!', `Hello, ${userContext.name}! 👋`);
      if (userContext.lastBooking) {
        aiText = `Hi **${userContext.name}**! 🎬 I see your last booking was for *${userContext.lastBooking}*.\n\n${aiText}`;
      }
    }

    // Detect sentiment for escalation logic
    const sentiment = detectSentiment(message);
    const shouldEscalate = sentiment === 'angry';

    if (shouldEscalate) {
      aiText += '\n\n---\n⚠️ I can sense this is frustrating. I\'m flagging your session for priority human support. You can also reach us directly at **support@cineconnect.com** or **+91 9999999999**.';
    }

    // Persist to DB (upsert session)
    try {
      const newMessages = [
        { role: 'user',      content: message.trim(), timestamp: new Date() },
        { role: 'assistant', content: aiText,          timestamp: new Date(), tokens: tokenCount },
      ];

      await AIChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: {
            sessionId,
            userId: req.user?._id || null,
            language,
            page: req.body.page || '',
          },
          $push: { messages: { $each: newMessages } },
          $inc:  { totalTokens: tokenCount },
          $set:  {
            overallSentiment: sentiment,
            escalatedToHuman: shouldEscalate,
            ...(shouldEscalate ? { escalatedAt: new Date() } : {}),
          },
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error('[AI Chat] Session save error (non-fatal):', dbErr.message);
    }

    return res.json({
      success: true,
      reply: aiText,
      sessionId,
      sentiment,
      escalated: shouldEscalate,
      usingAI,
    });

  } catch (err) {
    console.error('[AI Chat] Error:', err);
    res.status(500).json({
      success: true, // still send a response so UI doesn't break
      reply: "I'm having a small technical hiccup 😅 Please try again in a moment, or contact us at support@cineconnect.com",
      sessionId: req.body?.sessionId || crypto.randomUUID(),
      sentiment: 'neutral',
      escalated: false,
      usingAI: false,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @GET /api/ai/context  (protected)
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserContext = async (req, res) => {
  try {
    const user = req.user;

    const lastBooking = await Booking.findOne({ userId: user._id, status: 'confirmed' })
      .sort({ createdAt: -1 })
      .select('movieTitle theatreName showDate showTime finalAmount status')
      .lean();

    const bookingCount = await Booking.countDocuments({ userId: user._id });

    res.json({
      success: true,
      context: {
        name:            user.name,
        email:           user.email,
        joinDate:        user.createdAt,
        favouriteGenres: user.movieInterests || [],
        bookingCount,
        lastBooking: lastBooking ? {
          movieTitle:  lastBooking.movieTitle,
          theatreName: lastBooking.theatreName,
          showDate:    lastBooking.showDate,
          showTime:    lastBooking.showTime,
          finalAmount: lastBooking.finalAmount,
          status:      lastBooking.status,
        } : null,
      },
    });
  } catch (err) {
    console.error('[AI Context]', err);
    res.status(500).json({ success: false, message: 'Could not fetch user context.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @POST /api/support/ticket   (public)
// ─────────────────────────────────────────────────────────────────────────────
exports.createSupportTicket = async (req, res) => {
  try {
    const { name, email, issueType, subject, message, page } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    const sentiment = detectSentiment(message);
    const priority  = sentiment === 'angry' ? 'urgent' : sentiment === 'negative' ? 'high' : 'medium';

    const ticket = await SupportTicket.create({
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      issueType: issueType || 'other',
      subject:   subject?.trim() || '',
      message:   message.trim(),
      userId:    req.user?._id || null,
      sentiment,
      priority,
      userAgent: req.headers['user-agent'] || '',
      page:      page || '',
    });

    res.status(201).json({
      success: true,
      message: "Your message has been received! We'll respond within 24 hours. 🙏",
      ticketId: ticket._id,
      priority,
    });
  } catch (err) {
    console.error('[Support Ticket]', err);
    res.status(500).json({ success: false, message: 'Failed to submit ticket. Please email support@cineconnect.com directly.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @GET /api/admin/support/tickets   (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdminSupportTickets = async (req, res) => {
  try {
    const {
      status, priority, issueType, sentiment,
      page = 1, limit = 20,
      search,
    } = req.query;

    const filter = {};
    if (status)    filter.status    = status;
    if (priority)  filter.priority  = priority;
    if (issueType) filter.issueType = issueType;
    if (sentiment) filter.sentiment = sentiment;
    if (search)    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email avatar')
      .lean();

    // Stats
    const stats = await SupportTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statMap = { open: 0, in_progress: 0, resolved: 0, escalated: 0, closed: 0 };
    stats.forEach(s => { if (s._id) statMap[s._id] = s.count; });

    res.json({
      success: true,
      tickets,
      stats: statMap,
      pagination: {
        total,
        page:    parseInt(page),
        limit:   parseInt(limit),
        pages:   Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[Admin Support Tickets]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @PATCH /api/admin/support/tickets/:id   (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply, priority } = req.body;

    const update = {};
    if (status)     update.status     = status;
    if (adminReply) update.adminReply = adminReply.trim();
    if (priority)   update.priority   = priority;
    if (status === 'resolved') {
      update.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(id, update, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('[Update Ticket]', err);
    res.status(500).json({ success: false, message: 'Failed to update ticket.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @GET /api/admin/support/chat-sessions  (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdminChatSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, sentiment } = req.query;
    const filter = {};
    if (sentiment) filter.overallSentiment = sentiment;

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const total  = await AIChatSession.countDocuments(filter);
    const sessions = await AIChatSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('sessionId userId language overallSentiment escalatedToHuman totalTokens createdAt messages')
      .populate('userId', 'name email')
      .lean();

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        ...s,
        messageCount: s.messages?.length || 0,
        messages: undefined, // don't send full messages in list
      })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('[Admin Chat Sessions]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
};

// @GET /api/admin/support/chat-sessions/:sessionId
exports.getAdminChatSession = async (req, res) => {
  try {
    const session = await AIChatSession.findOne({ sessionId: req.params.sessionId })
      .populate('userId', 'name email avatar')
      .lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch session.' });
  }
};


// @GET /api/ai/status
exports.getAIStatus = async (_req, res) => {
  const hasKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    success: true,
    aiEnabled: hasKey,
    mode: hasKey ? 'gemini' : 'fallback',
    model: hasKey ? 'gemini-1.5-flash' : 'rule-based',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  @GET /api/ai/recommendations  (optional auth — better with token)
//  Returns movie recommendations personalized to the user's interests
// ─────────────────────────────────────────────────────────────────────────────
exports.getMovieRecommendations = async (req, res) => {
  try {
    const { genres: queryGenres, limit = 6 } = req.query;

    // Start with user's saved interests
    let genres = [];
    if (req.user?.movieInterests?.length) {
      genres = req.user.movieInterests;
    } else if (queryGenres) {
      genres = queryGenres.split(',').map(g => g.trim()).filter(Boolean);
    }

    let movies = [];

    // 1. Try genre-matched movies (now showing or coming soon)
    if (genres.length) {
      movies = await Movie.find({
        isActive: true,
        genre: { $in: genres },
        $or: [{ isNowShowing: true }, { isComingSoon: true }],
      })
        .select('title genre rating description certificate poster isTrending isNowShowing isComingSoon director duration')
        .sort({ rating: -1, isTrending: -1 })
        .limit(parseInt(limit))
        .lean();
    }

    // 2. Fall back to trending + top-rated if not enough
    if (movies.length < 3) {
      const fallback = await Movie.find({
        isActive: true,
        $or: [{ isNowShowing: true }, { isTrending: true }],
      })
        .select('title genre rating description certificate poster isTrending isNowShowing isComingSoon director duration')
        .sort({ isTrending: -1, rating: -1 })
        .limit(parseInt(limit))
        .lean();

      const seen = new Set(movies.map(m => m._id.toString()));
      fallback.forEach(m => {
        if (!seen.has(m._id.toString())) movies.push(m);
      });
      movies = movies.slice(0, parseInt(limit));
    }

    // Attach reason text based on match
    const enriched = movies.map(m => ({
      ...m,
      reason: genres.length && m.genre?.some(g => genres.includes(g))
        ? `Matches your interest in ${m.genre.filter(g => genres.includes(g)).join(' & ')}`
        : m.isTrending ? 'Trending on CineConnect right now 🔥'
        : 'Highly rated — a crowd favourite ⭐',
    }));

    res.json({ success: true, movies: enriched, basedOn: genres });
  } catch (err) {
    console.error('[AI Recommendations]', err);
    res.status(500).json({ success: false, message: 'Could not fetch recommendations.' });
  }
};

