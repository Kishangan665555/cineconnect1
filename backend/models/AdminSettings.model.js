/**
 * models/AdminSettings.model.js
 * Global settings for the platform (singleton document).
 */

const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'STATIC_GLOBAL_SETTINGS', unique: true },
  adminCommissionPercentage: { type: Number, default: 10 },
  siteMaintenance: { type: Boolean, default: false },
  upiEnabled: { type: Boolean, default: true },
  minimumPayoutAmount: { type: Number, default: 1000 },
}, { timestamps: true });

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonKey: 'STATIC_GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
