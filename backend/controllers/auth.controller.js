const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'cineconnect_secret_key', { expiresIn: '30d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, city, role, avatar, username, gender, bio, movieInterests, acceptedTerms } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    if (!acceptedTerms) {
      return res.status(400).json({ success: false, message: 'You must accept the Terms and Conditions to register.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name, email, password,
      phone:          phone    || '',
      city:           city     || 'Mumbai',
      role:           ['user','theatre_owner'].includes(role) ? role : 'user',
      avatar:         avatar        || '',
      username:       username      || name,
      gender:         gender        || '',
      bio:            bio           || '',
      movieInterests: movieInterests || [],
      acceptedTerms:  true,
      termsAcceptedAt: new Date(),
      termsVersion:   '1.0'
    });

    res.status(201).json({ success: true, token: signToken(user._id), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // Block deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Gate pending theatre owners
    if (user.role === 'theatre_owner' && user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your registration is under review. Please wait 24–48 hours.',
        code: 'PENDING_APPROVAL',
        approvalStatus: 'pending',
      });
    }

    // Gate theatre owners who have been rejected
    if (user.role === 'theatre_owner' && user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your registration was not approved. Please contact support for details.',
        code: 'REJECTED',
        approvalStatus: 'rejected',
      });
    }

    // Capture retroactive consent if it wasn't tracked before
    if (!user.acceptedTerms) {
      user.acceptedTerms = true;
      user.termsAcceptedAt = new Date();
      user.termsVersion = '1.0';
      await user.save();
    }

    res.json({ success: true, token: signToken(user._id), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, city, avatar, username, gender, bio, movieInterests, isPrivate } = req.body;
    const updateFields = { name, phone, city, avatar, username, gender, bio, movieInterests };

    // Only update isPrivate when it's explicitly sent
    if (typeof isPrivate === 'boolean') updateFields.isPrivate = isPrivate;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/me/avatar  (multipart/form-data, field: avatar)
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Validate size (redundant with multer limit, but belt-and-suspenders)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'Image must be under 2 MB.' });
    }

    // Convert buffer → base64 data URL; stored directly in MongoDB (no disk file)
    const mime     = req.file.mimetype;           // e.g. image/png
    const b64      = req.file.buffer.toString('base64');
    const dataUrl  = `data:${mime};base64,${b64}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: dataUrl } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({
      success : true,
      message : 'Profile photo updated.',
      avatar  : dataUrl,
      user    : user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Security: always return success to avoid email enumeration
    if (!user) return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Save to user (valid for 30 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    // Reset Link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

    // Email delivery (Ethereal test mail)
    let testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await transporter.sendMail({
      from: '"CineConnect Support" <no-reply@cineconnect.com>',
      to: user.email,
      subject: "CineConnect - Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #ec4899;">Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to securely reset your password. This link is valid for 30 minutes.</p>
            <a href="${resetUrl}" style="padding:12px 24px;background:linear-gradient(135deg, #f97316, #ec4899);color:#fff;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;margin:20px 0;">Reset Password</a>
            <p style="font-size: 13px; color: #666;">If you did not request this, please safely ignore this email. Your password will remain unchanged.</p>
        </div>
      `,
    });

    // Log the Ethereal URL so developers/user can actually see the mock email and click the link!
    console.log("-----------------------------------------");
    console.log("Password reset email sent (TEST MODE):");
    const testUrl = nodemailer.getTestMessageUrl(info);
    console.log(testUrl);
    console.log("-----------------------------------------");

    res.json({ 
      success: true, 
      message: 'If this email exists, a reset link has been sent.',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      testUrl: process.env.NODE_ENV === 'development' ? testUrl : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request.' });
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) 
       return res.status(400).json({ success: false, message: 'Token and new password are required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    // Assign new password, clear token fields
    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save(); // UserSchema pre-save will automatically hash the new password!

    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

