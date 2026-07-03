/**
 * middleware/validate.middleware.js
 *
 * Wraps express-validator's validationResult to return a unified error format.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: errors.array(),
    });
  }
  next();
};

module.exports = { validate };
