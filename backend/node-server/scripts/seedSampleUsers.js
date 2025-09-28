require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User'); // adjust path

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timetable';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@university.edu';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`⏩ Admin already exists: ${adminEmail}`);
      // Optionally reset password to a known value
      admin.password = 'admin123';
      await admin.save();
      console.log('🔑 Admin password reset to "admin123"');
    } else {
      admin = new User({
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log(`✅ Created admin user: ${adminEmail}`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    mongoose.connection.close();
  }
}

seedAdmin();
