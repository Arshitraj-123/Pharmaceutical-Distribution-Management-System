const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read products.ts to parse categories and sampleNames
const productsTsPath = path.join(__dirname, '../pharma-retailer/src/data/products.ts');
const content = fs.readFileSync(productsTsPath, 'utf8');

// Categories will be derived directly from sampleNames keys
let categories = [];

// Parse sampleNames
const sampleMatch = content.match(/const sampleNames:\s*Record<string,\s*string\[\]>\s*=\s*({[\s\S]*?^};)/m);
let sampleNames = {};
if (sampleMatch) {
  const lines = sampleMatch[1].split('\n');
  let currentCat = null;
  for (const line of lines) {
    const catHeader = line.match(/"([^"]+)":\s*\[/);
    if (catHeader) {
      currentCat = catHeader[1];
      sampleNames[currentCat] = [];
      continue;
    }
    const itemMatch = line.match(/"([^"]+)"/);
    if (itemMatch && currentCat) {
      sampleNames[currentCat].push(itemMatch[1]);
    }
  }
}

console.log('Categories found:', categories.length);
console.log('Category keys in sampleNames:', Object.keys(sampleNames).length);
let totalCount = 0;
for (const k of Object.keys(sampleNames)) {
  totalCount += sampleNames[k].length;
}
console.log('Total product names:', totalCount);

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharma';

const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Company = require('./models/Company');

const companyNames = [
  'Aadya Medicine Agencies',
  'Cipla',
  'Sun Pharma',
  "Dr. Reddy's",
  'Lupin',
  'Zydus',
  'Mankind',
  'Torrent',
  'Dabur',
  'Himalaya',
  'Abbott'
];

async function runSeed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Ensure companies exist
  const companyMap = new Map();
  for (const name of companyNames) {
    let comp = await Company.findOne({ name });
    if (!comp) {
      comp = await Company.create({ name, creditDays: 30 });
    }
    companyMap.set(name, comp._id);
  }
  console.log('Companies verified:', companyMap.size);

  let idCounter = 1;
  const productsToUpsert = [];
  const now = new Date();

  const categorySlugs = Object.keys(sampleNames);
  for (const slug of categorySlugs) {
    const names = sampleNames[slug] || [];
    names.forEach((name, i) => {
      const id = idCounter++;
      const sku = `SKU-${String(id).padStart(3, '0')}`;
      const mrp = 80 + ((id * 37) % 900);
      const ptr = Math.round(mrp * 0.82);
      const companyName = companyNames[(id + i) % companyNames.length];
      const companyId = companyMap.get(companyName);

      const packing =
        slug === "health-drinks"
          ? "200g Pack"
          : slug === "medical-devices"
          ? "1 Unit"
          : slug === "drops"
          ? "10ml Bottle"
          : slug === "inhaler" || slug === "respules"
          ? "1 Inhaler"
          : slug === "ointment" || slug === "cream" || slug === "gel"
          ? "30g Tube"
          : slug === "syrup" || slug === "baby-drops"
          ? "60ml Bottle"
          : "10 Tabs";

      // Mark the first 6 products as new launches for the slideshow banner
      const isNewLaunch = id <= 6 || id % 40 === 0;

      productsToUpsert.push({
        sku,
        tradeName: name,
        genericName: name,
        companyId,
        category: slug,
        mrp,
        ptr,
        packing,
        description: `Premium quality healthcare product available at Aadya Medicine Agencies. Manufactured under strict quality standards.`,
        isNewLaunch,
        announcedAt: isNewLaunch ? new Date(now.getTime() - (id * 3600000)) : new Date('2026-01-01')
      });
    });
  }

  console.log(`Prepared ${productsToUpsert.length} products to seed...`);

  let insertedCount = 0;
  let updatedCount = 0;
  let inventoryCount = 0;

  for (const p of productsToUpsert) {
    let existing = await Product.findOne({ sku: p.sku });
    let productDoc;
    if (existing) {
      Object.assign(existing, p);
      productDoc = await existing.save();
      updatedCount++;
    } else {
      productDoc = await Product.create(p);
      insertedCount++;
    }

    // Ensure inventory exists for this product
    let inv = await Inventory.findOne({ productId: productDoc._id });
    if (!inv) {
      await Inventory.create({
        productId: productDoc._id,
        batchNo: `BAT26-${String(productDoc.sku).replace('SKU-', '')}`,
        expiryDate: new Date('2028-06-30'),
        qtyAvailable: 150 + ((idCounter * 17) % 350),
        costPrice: Math.round(productDoc.ptr * 0.85)
      });
      inventoryCount++;
    }
  }

  console.log(`Done! Products created: ${insertedCount}, updated: ${updatedCount}`);
  console.log(`Inventory batches created: ${inventoryCount}`);
  const totalProductsInDb = await Product.countDocuments();
  const totalInventoryInDb = await Inventory.countDocuments();
  console.log(`Total Products in DB: ${totalProductsInDb}`);
  console.log(`Total Inventory in DB: ${totalInventoryInDb}`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected cleanly');
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
