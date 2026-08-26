const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Retailer = require('./models/Retailer');

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is missing in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // Check if retailer user already exists
    const existingUser = await User.findOne({ email: 'retailer@adhyapharma.in' });
    if (existingUser) {
      console.log("Retailer user already exists:", existingUser.email);
      mongoose.disconnect();
      return;
    }

    // Find or create Apollo Pharmacy profile
    let retailer = await Retailer.findOne({ name: 'Apollo Pharmacy' });
    if (!retailer) {
      retailer = await Retailer.create({
        name: 'Apollo Pharmacy',
        city: 'Patna',
        creditLimit: 200000,
        outstandingBalance: 0,
        status: 'Active'
      });
      console.log("Created Retailer profile:", retailer.name);
    } else {
      console.log("Found existing Retailer profile:", retailer.name);
    }

    const hashedPassword = await bcrypt.hash('Password123!', 12);
    const newUser = await User.create({
      fullName: 'Apollo Retailer',
      email: 'retailer@adhyapharma.in',
      password: hashedPassword,
      role: 'Retailer',
      status: 'Active',
      retailerId: retailer._id
    });

    console.log("Seeded Retailer User successfully!");
    console.log("Email: retailer@adhyapharma.in");
    console.log("Password: Password123!");
    console.log("OTP Code: 1234");
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
