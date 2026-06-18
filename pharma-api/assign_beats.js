const mongoose = require('mongoose');
const Retailer = require('./models/Retailer');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharma';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const res = await Retailer.updateMany({ city: /patna/i, beat: { $exists: false } }, { $set: { beat: 'Patna Central' } });
    console.log(`Updated ${res.modifiedCount} Patna retailers to Patna Central`);

    const res2 = await Retailer.updateMany({ city: /gaya/i, beat: { $exists: false } }, { $set: { beat: 'Gaya' } });
    console.log(`Updated ${res2.modifiedCount} Gaya retailers to Gaya`);

    const res3 = await Retailer.updateMany({ city: /muzaffarpur/i, beat: { $exists: false } }, { $set: { beat: 'Muzaffarpur' } });
    console.log(`Updated ${res3.modifiedCount} Muzaffarpur retailers to Muzaffarpur`);
    
    const all = await Retailer.updateMany({ beat: null }, { $set: { beat: 'Patna Central' } });
    console.log(`Updated remaining null beats: ${all.modifiedCount}`);

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
