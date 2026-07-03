const mongoose = require('mongoose');

const theatre3DConfigSchema = new mongoose.Schema({
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  
  // Numerical constraints for generating the ThreeJS layout algorithm
  rows: { type: Number, default: 12 },
  seatsPerRow: { type: Number, default: 20 },
  balcony: { type: Boolean, default: false },
  
  screenWidth: { type: Number, default: 40 },
  screenHeight: { type: Number, default: 20 },
  
  seatSpacing: { type: Number, default: 1.2 },
  rowSpacing: { type: Number, default: 2 },
  
  vipRows: { type: Number, default: 2 },        // The last 2 rows are VIP
  reclinerRows: { type: Number, default: 0 },
  
  aisleIndexes: [{ type: Number }],             // Example: [5, 15] means aisles after seat 5 and 15
  stairs: { type: Boolean, default: true },
  
}, { timestamps: true });

module.exports = mongoose.model('Theatre3DConfig', theatre3DConfigSchema);
