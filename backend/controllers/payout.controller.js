/**
 * controllers/payout.controller.js
 */
const Payout = require('../models/Payout.model');
const Booking = require('../models/Booking.model');
const Notification = require('../models/Notification.model');
const TheatreOwnerRequest = require('../models/TheatreOwnerRequest.model');
const User = require('../models/User.model');
const Theatre = require('../models/Theatre.model');

// Generate a payout for a specific theatre owner (calculates unpaid bookings)
exports.generatePayout = async (req, res) => {
  try {
    const { ownerId } = req.body;
    const { amount, theatreId, periodStart, periodEnd, paymentMethod, transactionId, adminNote } = req.body;
    
    if (!ownerId || !amount) {
      return res.status(400).json({ success: false, message: 'OwnerID and Amount are required' });
    }

    const payout = await Payout.create({
      theatreOwnerId: ownerId,
      theatreId: theatreId || null,
      amount,
      status: 'paid',
      paymentMethod: paymentMethod || 'Bank Transfer',
      transactionId: transactionId || '',
      periodStart: periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: periodEnd || new Date(),
      paidAt: new Date(),
      adminNote: adminNote || '',
    });

    try {
       await Notification.create({
          userId: ownerId,
          title: 'Payout Processed',
          message: `A payout of ₹${amount} has been processed via ${paymentMethod}.`,
          type: 'alert',
          target: 'specific_user',
          isRead: false
       });
    } catch(e) {}

    res.status(201).json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('theatreOwnerId', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOwnerPayouts = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const payouts = await Payout.find({ theatreOwnerId: ownerId })
      .sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── NEW: Admin Full Payout Summary ──────────────────────────────────────────
exports.getAdminPayoutSummary = async (req, res) => {
  try {
    const owners = await TheatreOwnerRequest.find({ status: 'approved' }).populate('userId', 'name email phone avatar');
    const theatres = await Theatre.find({});
    
    const allBookings = await Booking.find({ status: 'confirmed' });
    const allPayouts = await Payout.find({ status: 'paid' });

    const summary = owners.map(o => {
       const user = o.userId || {};
       const ownerTheatres = theatres.filter(t => [user._id, user, o._id].some(id => id && t.ownerId && id.toString() === t.ownerId.toString()));
       const theatreIds = ownerTheatres.map(t => t._id.toString());
       
       const oBookings = allBookings.filter(b => b.theatreId && theatreIds.includes(b.theatreId.toString()));
       
       const totalBookings = oBookings.length;
       const totalGross = oBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
       const totalAdminCommission = oBookings.reduce((sum, b) => sum + (b.adminCommission || (b.totalAmount * 0.05)), 0);
       const totalNetPayable = oBookings.reduce((sum, b) => sum + (b.ownerPayout || (b.totalAmount * 0.95)), 0);
       
       const oPayouts = allPayouts.filter(p => p.theatreOwnerId && p.theatreOwnerId.toString() === user._id?.toString());
       const alreadyPaid = oPayouts.reduce((sum, p) => sum + p.amount, 0);
       
       const pendingBalance = totalNetPayable - alreadyPaid;

       const showWiseMap = {};
       for (const b of oBookings) {
          const key = `${b.showDate}_${b.showTime}`;
          if (!showWiseMap[key]) showWiseMap[key] = {
             movieName: b.movieTitle,
             date: b.showDate,
             time: b.showTime,
             seatsSold: 0,
             ticketPrice: b.seats?.length ? (b.totalAmount / b.seats.length) : 0,
             grossAmount: 0,
             commission: 0,
             netEarnings: 0
          };
          showWiseMap[key].seatsSold += (b.seats ? b.seats.length : 0);
          showWiseMap[key].grossAmount += (b.totalAmount || 0);
          showWiseMap[key].commission += (b.adminCommission || ((b.totalAmount || 0) * 0.05));
          showWiseMap[key].netEarnings += (b.ownerPayout || ((b.totalAmount || 0) * 0.95));
       }

       return {
         ownerId: user._id,
         ownerName: o.name || user.name,
         ownerAvatar: user.avatar || o.avatar,
         theatreName: o.theatreName,
         totalShowsAdded: oBookings.length, 
         totalTicketsSold: oBookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0),
         totalGross,
         totalAdminCommission,
         totalNetPayable,
         alreadyPaid,
         pendingBalance,
         showWiseReport: Object.values(showWiseMap),
         bankDetails: {
           holder: o.bankAccountHolder,
           bank: o.bankName,
           account: o.bankAccountNumber,
           ifsc: o.bankIfsc,
           branch: o.bankBranch,
           upi: o.upiId
         }
       };
    });

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── NEW: Theatre Owner Earnings Report ──────────────────────────────────────
exports.getTheatreOwnerEarnings = async (req, res) => {
  try {
     const ownerId = req.user._id;
     const ownerTheatres = await Theatre.find({ createdBy: ownerId });
     const theatreIds = ownerTheatres.map(t => t._id.toString());
     
     const bookings = await Booking.find({ 
       theatreId: { $in: theatreIds },
       status: 'confirmed' 
     });
     
     const totalTicketsSold = bookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);
     const totalGrossRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
     const adminCommissionDeducted = bookings.reduce((sum, b) => sum + (b.adminCommission || (b.totalAmount * 0.05)), 0);
     const netAmountReceivable = bookings.reduce((sum, b) => sum + (b.ownerPayout || (b.totalAmount * 0.95)), 0);
     
     const todayStr = new Date().toISOString().split('T')[0];
     const todayTicketsSold = bookings.filter(b => b.bookingDate?.toISOString().startsWith(todayStr)).reduce((sum,b) => sum + (b.seats?b.seats.length:0), 0);

     const payouts = await Payout.find({ theatreOwnerId: ownerId, status: 'paid' });
     const paidPayoutHistory = payouts.reduce((sum, p) => sum + p.amount, 0);
     const pendingPayout = netAmountReceivable - paidPayoutHistory;
     
     const showWiseMap = {};
     for(const b of bookings) {
        const key = `${b.showDate}_${b.showTime}`;
        if (!showWiseMap[key]) showWiseMap[key] = {
           movieName: b.movieTitle,
           date: b.showDate,
           time: b.showTime,
           seatsSold: 0,
           ticketPrice: (b.totalAmount / (b.seats.length || 1)),
           grossAmount: 0,
           commission: 0,
           netEarnings: 0
        };
        showWiseMap[key].seatsSold += (b.seats ? b.seats.length : 0);
        showWiseMap[key].grossAmount += (b.totalAmount || 0);
        showWiseMap[key].commission += (b.adminCommission || (b.totalAmount * 0.05));
        showWiseMap[key].netEarnings += (b.ownerPayout || (b.totalAmount * 0.95));
     }
     
     res.json({
        success: true,
        report: {
           totalTicketsSold,
           todayTicketsSold,
           weeklySales: totalTicketsSold, // Placeholder
           monthlySales: totalTicketsSold, // Placeholder
           totalGrossRevenue,
           adminCommissionDeducted,
           netAmountReceivable,
           pendingPayout,
           paidPayoutHistory,
           showWiseReport: Object.values(showWiseMap)
        }
     });
  } catch (err) {
     res.status(500).json({ success: false, message: err.message });
  }
};
