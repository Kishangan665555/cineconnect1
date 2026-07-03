/**
 * seed-admin.js — Seeds the Admin collection (separate from User collection)
 * Run: node seed-admin.js
 */
const path    = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cineconnect';

// Load the real Admin model (has matchPassword, incLoginAttempts, etc.)
const Admin = require(path.join(__dirname, 'models', 'Admin.model.js'));

const ADMINS = [
  {
    name:         'Super Admin',
    email:        'admin@cineconnect.com',
    password:     'admin123',
    adminRole:    'super_admin',
    isSuperAdmin: true,
    phone:        '9999999999',
    isActive:     true,
    permissions: {
      manageMovies:   true, manageTheatres: true, manageBookings: true,
      manageCoupons:  true, manageUsers:    true, manageAdmins:   true,
      viewReports:    true,
    },
  },
  {
    name:         'Super Admin',
    email:        'superadmin@cineconnect.com',
    password:     'Admin@123456',
    adminRole:    'super_admin',
    isSuperAdmin: true,
    phone:        '9999999998',
    isActive:     true,
    permissions: {
      manageMovies:   true, manageTheatres: true, manageBookings: true,
      manageCoupons:  true, manageUsers:    true, manageAdmins:   true,
      viewReports:    true,
    },
  },
  {
    name:         'Content Manager',
    email:        'manager@cineconnect.com',
    password:     'Manager@123',
    adminRole:    'manager',
    isSuperAdmin: false,
    phone:        '9999999997',
    isActive:     true,
    permissions: {
      manageMovies:   true, manageTheatres: true, manageBookings: true,
      manageCoupons:  true, manageUsers:    false, manageAdmins:  false,
      viewReports:    true,
    },
  },
  {
    name:         'Moderator',
    email:        'moderator@cineconnect.com',
    password:     'Moderator@123',
    adminRole:    'moderator',
    isSuperAdmin: false,
    phone:        '9999999996',
    isActive:     true,
    permissions: {
      manageMovies:   false, manageTheatres: false, manageBookings: false,
      manageCoupons:  false, manageUsers:    false, manageAdmins:   false,
      viewReports:    true,
    },
  },
];

mongoose.connect(URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    for (const a of ADMINS) {
      // Delete existing to reset password properly
      await Admin.deleteOne({ email: a.email });

      // Create fresh (model pre-save hook will hash password)
      await Admin.create({
        name:         a.name,
        email:        a.email,
        password:     a.password,   // hashed by pre-save hook
        adminRole:    a.adminRole,
        isSuperAdmin: a.isSuperAdmin,
        phone:        a.phone,
        isActive:     a.isActive,
        permissions:  a.permissions,
        loginAttempts: 0,
      });
      console.log(`  ✔ Created admin: ${a.email}  (role: ${a.adminRole})`);
    }

    console.log('\n🎉 Admin seed complete!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  Admin Portal Login:');
    console.log('  ─────────────────────────────────────────────');
    console.log('  Super Admin  │ admin@cineconnect.com  │ admin123');
    console.log('  Manager      │ manager@cineconnect.com│ Manager@123');
    console.log('  Moderator    │ moderator@cineconnect.com│ Moderator@123');
    console.log('═══════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
