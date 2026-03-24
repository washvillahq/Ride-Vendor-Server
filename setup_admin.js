const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/modules/user/user.model');
const bcrypt = require('bcryptjs');

async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@ridevendor.com';
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    let user = await User.findOne({ email });

    if (user) {
      console.log('User exists, updating role and password...');
      user.role = 'admin';
      user.password = password; // The pre-save hook will hash it again if we save, but wait...
      // Let's just update directly to avoid hooks if we want, or use save().
      await user.save(); 
      console.log('User updated successfully.');
    } else {
      console.log('User does not exist, creating new admin...');
      await User.create({
        name: 'Admin Test User',
        email,
        password,
        phone: '08123456789',
        role: 'admin'
      });
      console.log('Admin created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
