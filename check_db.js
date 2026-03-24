const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/modules/user/user.model');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, 'name email role isBlocked');
    console.log('Current Users in Database:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}] ${u.isBlocked ? 'BLOCKED' : ''}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
