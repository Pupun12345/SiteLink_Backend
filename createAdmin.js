const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    // Admin credentials
    const adminData = {
      name: 'Admin',
      phone: '9999999999', // Change this to your phone
      email: 'admin@sitelink.in', // Change this to your email
      password: 'password', // Change this to a secure password
      role: 'admin',
      userType: 'admin',
      isVerified: true,
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ Admin user already exists with this email!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Check if phone exists
    const existingPhone = await User.findOne({ phone: adminData.phone });
    if (existingPhone) {
      console.log('❌ User already exists with this phone number!');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);

    console.log('✅ Admin user created successfully!');
    console.log('=====================================');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', admin.role);
    console.log('=====================================');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
