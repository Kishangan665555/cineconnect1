const mongoose = require('mongoose');

const theatreMediaSchema = new mongoose.Schema({
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaApproved: { type: Boolean, default: false }, // Controlled by Admin
  
  // Real photos mapped to specific sections of the theatre
  screenViews: {
    frontLeft: { type: String, default: '' },
    frontCenter: { type: String, default: '' },
    frontRight: { type: String, default: '' },
    middleLeft: { type: String, default: '' },
    middleCenter: { type: String, default: '' },
    middleRight: { type: String, default: '' },
    backLeft: { type: String, default: '' },
    backCenter: { type: String, default: '' },
    backRight: { type: String, default: '' },
    balconyLeft: { type: String, default: '' },
    balconyCenter: { type: String, default: '' },
    balconyRight: { type: String, default: '' },
  },

  // 360 Panorama sources
  panoramaViews: {
    hallCenter: { type: String, default: '' },
    lobby: { type: String, default: '' },
    balcony: { type: String, default: '' },
    entrance: { type: String, default: '' },
    frontRow: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('TheatreMedia', theatreMediaSchema);
