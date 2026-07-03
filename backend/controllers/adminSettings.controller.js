/**
 * controllers/adminSettings.controller.js
 */
const AdminSettings = require('../models/AdminSettings.model');

exports.getSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { adminCommissionPercentage } = req.body;
    const settings = await AdminSettings.getSettings();
    
    if (adminCommissionPercentage !== undefined) {
      settings.adminCommissionPercentage = adminCommissionPercentage;
    }
    
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
