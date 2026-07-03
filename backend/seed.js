/**
 * seed.js — run with: node seed.js
 * Resets all seed users + admin passwords in MongoDB
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cineconnect';

const UserSchema = new mongoose.Schema({
  name:    String,
  email:   String,
  password:String,
  phone:   String,
  city:    String,
  role:    { type: String, enum: ['user','admin','theatre_owner'], default: 'user' },
  isActive:{ type: Boolean, default: true },
  joinDate:String,
  avatar:  String,
  bio:     String,
  username:String,
  followers:[String],
  following:[String],
  followRequests:[String],
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const SEED_USERS = [
  { name:'Super Admin',     email:'admin@cineconnect.com',      password:'admin123',      role:'admin',         phone:'9999999999', city:'Mumbai'    },
  { name:'Super Admin 2',   email:'superadmin@cineconnect.com', password:'Admin@123456',  role:'admin',         phone:'9999999998', city:'Mumbai'    },
  { name:'Content Manager', email:'manager@cineconnect.com',    password:'Manager@123',   role:'admin',         phone:'9999999997', city:'Mumbai'    },
  { name:'Moderator',       email:'moderator@cineconnect.com',  password:'Moderator@123', role:'admin',         phone:'9999999996', city:'Mumbai'    },
  { name:'Theatre Owner 1', email:'owner1@theatre.com',         password:'owner123',      role:'theatre_owner', phone:'8888888881', city:'Lucknow'   },
  { name:'Theatre Owner 2', email:'owner2@theatre.com',         password:'owner123',      role:'theatre_owner', phone:'8888888882', city:'Delhi'     },
  { name:'Theatre Owner 3', email:'owner3@theatre.com',         password:'owner123',      role:'theatre_owner', phone:'8888888883', city:'Hyderabad' },
  { name:'Rahul Sharma',    email:'rahul@example.com',          password:'user123',       role:'user',          phone:'9876543210', city:'Mumbai'    },
];

mongoose.connect(URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB:', URI);

    for (const u of SEED_USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      const result = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            name:     u.name,
            password: hashed,
            role:     u.role,
            phone:    u.phone,
            city:     u.city,
            isActive: true,
            joinDate: new Date().toISOString().split('T')[0],
          },
        },
        { upsert: true, new: true }
      );
      console.log(`  ✔ ${result.email}  →  role: ${result.role}`);
    }

    console.log('\n🎉 Seed complete! All users created/reset.\n');
    console.log('─────────────────────────────────────────────');
    console.log(' Admin Login:');
    console.log('   Email:    admin@cineconnect.com');
    console.log('   Password: admin123');
    console.log('');
    console.log(' Theatre Owner 1:');
    console.log('   Email:    owner1@theatre.com');
    console.log('   Password: owner123');
    console.log('');
    console.log(' Regular User:');
    console.log('   Email:    rahul@example.com');
    console.log('   Password: user123');
    console.log('─────────────────────────────────────────────\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
