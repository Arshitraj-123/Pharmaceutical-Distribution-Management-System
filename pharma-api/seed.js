require('dotenv').config();
const mongoose = require('mongoose');
const Retailer = require('./models/Retailer');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Company = require('./models/Company');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharma';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear existing
  await Retailer.deleteMany({});
  await Product.deleteMany({});
  await Inventory.deleteMany({});
  await Company.deleteMany({});

  const c1 = await Company.create({ name: 'Cipla' });
  const c2 = await Company.create({ name: "Dr. Reddy's" });
  const c3 = await Company.create({ name: 'Sun Pharma' });

  // Insert Retailers
  const r1 = await Retailer.create({
    name: 'Shree Medicals',
    city: 'Patna',
    licenseExpiry: new Date('2026-12-31'),
    creditLimit: 50000,
    outstandingBalance: 12400,
    status: 'Active'
  });

  const r2 = await Retailer.create({
    name: 'Apollo Pharma Retail',
    city: 'Muzaffarpur',
    licenseExpiry: new Date('2026-10-31'),
    creditLimit: 30000,
    outstandingBalance: 29000, 
    status: 'Active'
  });

  // Insert Products
  const p1 = await Product.create({ tradeName: 'Paracetamol 500mg', companyId: c1._id, sku: 'SKU-001', mrp: 15, ptr: 10 });
  const p2 = await Product.create({ tradeName: 'Amoxicillin 250mg', companyId: c2._id, sku: 'SKU-002', mrp: 55, ptr: 45 });
  const p3 = await Product.create({ tradeName: 'Metformin 500mg', companyId: c3._id, sku: 'SKU-003', mrp: 25, ptr: 18 });

  // Insert Inventory
  await Inventory.create([
    { productId: p1._id, batchNo: 'CP2503A', expiryDate: new Date('2027-03-31'), qtyAvailable: 30, costPrice: 10 },
    { productId: p1._id, batchNo: 'CP2503B', expiryDate: new Date('2027-04-30'), qtyAvailable: 100, costPrice: 10 },
    { productId: p2._id, batchNo: 'DR2411B', expiryDate: new Date('2026-11-30'), qtyAvailable: 340, costPrice: 45 },
    { productId: p3._id, batchNo: 'SP2502C', expiryDate: new Date('2026-07-31'), qtyAvailable: 88, costPrice: 18 },
  ]);

  console.log('Database seeded successfully');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
