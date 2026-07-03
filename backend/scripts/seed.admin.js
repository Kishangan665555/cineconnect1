/**
 * scripts/seed.admin.js
 *
 * Seeds the default Super Admin account into MongoDB.
 * Run: node scripts/seed.admin.js
 *
 * Creates:
 *  - 1 Super Admin (full access)
 *  - 1 Manager    (movies, theatres, bookings, coupons)
 *  - 1 Moderator  (read-only + approvals)
 */

require('dotenv').config({ path: '../.env' });
// Try root .env too
require('dotenv').config();

const mongoose = require('mongoose');
const Admin    = require('../models/Admin.model');

const ADMINS = [
  {
    name:         'Super Admin',
    email:        'superadmin@cineconnect.com',
    password:     'Admin@123456',
    phone:        '9000000001',
    adminRole:    'super_admin',
    isSuperAdmin: true,
    permissions: {
      manageMovies:   true,
      manageTheatres: true,
      manageBookings: true,
      manageCoupons:  true,
      manageUsers:    true,
      manageAdmins:   true,
      viewReports:    true,
    },
  },
  {
    name:         'Content Manager',
    email:        'manager@cineconnect.com',
    password:     'Manager@123',
    phone:        '9000000002',
    adminRole:    'manager',
    isSuperAdmin: false,
    permissions: {
      manageMovies:   true,
      manageTheatres: true,
      manageBookings: true,
      manageCoupons:  true,
      manageUsers:    false,
      manageAdmins:   false,
      viewReports:    true,
    },
  },
  {
    name:         'Moderator',
    email:        'moderator@cineconnect.com',
    password:     'Moderator@123',
    phone:        '9000000003',
    adminRole:    'moderator',
    isSuperAdmin: false,
    permissions: {
      manageMovies:   false,
      manageTheatres: false,
      manageBookings: false,
      manageCoupons:  false,
      manageUsers:    false,
      manageAdmins:   false,
      viewReports:    true,
    },
  },
];

const seed = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cineconnect';

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to:', mongoose.connection.host);

    let created = 0;
    let skipped = 0;

    for (const adminData of ADMINS) {
      const exists = await Admin.findOne({ email: adminData.email });
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${adminData.email}`);
        skipped++;
        continue;
      }

      await Admin.create(adminData);
      console.log(`✅ Created admin: ${adminData.email} [${adminData.adminRole}]`);
      created++;
    }

    console.log('\n══════════════════════════════════════════════════════');
    console.log('  Admin Seed Complete');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  ✅ Created : ${created}`);
    console.log(`  ⏭️  Skipped : ${skipped}`);
    console.log('\n  Default Credentials:');
    console.log('  ┌─────────────────────────────────────────────────┐');
    console.log('  │  Super Admin                                     │');
    console.log('  │  Email   : superadmin@cineconnect.com            │');
    console.log('  │  Password: Admin@123456                          │');
    console.log('  ├─────────────────────────────────────────────────┤');
    console.log('  │  Manager                                         │');
    console.log('  │  Email   : manager@cineconnect.com               │');
    console.log('  │  Password: Manager@123                           │');
    console.log('  ├─────────────────────────────────────────────────┤');
    console.log('  │  Moderator                                       │');
    console.log('  │  Email   : moderator@cineconnect.com             │');
    console.log('  │  Password: Moderator@123                         │');
    console.log('  └─────────────────────────────────────────────────┘');
    console.log('\n  Login at: POST /api/admin/auth/login');
    console.log('══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

seed();
