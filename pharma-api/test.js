const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/pharma');
    const user = await User.findOne({ email: 'admin@adhyapharma.in' });
    const token = require('jsonwebtoken').sign({ id: user._id, role: user.role, branch: user.branch }, 'aadhya_pharmex_super_secret_key_2026', { expiresIn: '8h' });
    
    try {
        const retRes = await fetch('http://localhost:3000/api/retailers', { headers: { Authorization: `Bearer ${token}` }});
        const retData = await retRes.json();
        console.log("Retailers status:", retRes.status);
        console.log("Retailers data length/keys:", Array.isArray(retData) ? retData.length : Object.keys(retData));
        if(retRes.status >= 400) console.log("Retailers data:", retData);
    } catch(err) {
        console.error("Retailers Error:", err.message);
    }

    try {
        const invRes = await fetch('http://localhost:3000/api/inventory', { headers: { Authorization: `Bearer ${token}` }});
        const invData = await invRes.json();
        console.log("Inventory status:", invRes.status);
        console.log("Inventory data length/keys:", Array.isArray(invData) ? invData.length : Object.keys(invData));
        if(invRes.status >= 400) console.log("Inventory data:", invData);
    } catch(err) {
        console.error("Inventory Error:", err.message);
    }
    process.exit(0);
}
test();
