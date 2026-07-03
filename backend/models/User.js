// Re-exports the canonical User model (User.model.js) to avoid OverwriteModelError.
// All code that does require('../models/User') gets the same compiled model.
module.exports = require('./User.model');
