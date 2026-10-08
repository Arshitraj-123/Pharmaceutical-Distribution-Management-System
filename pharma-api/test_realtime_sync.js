const { io } = require('../pharma-app/node_modules/socket.io-client');

const API_BASE = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

async function runRealtimeSyncTest() {
  console.log('--- STARTING REAL-TIME SOCKET.IO SYNCHRONIZATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Login Admin
    console.log('\n[1] Authenticating Admin...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@adhyapharma.in', password: 'Password123!' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminVerifyRes = await fetch(`${API_BASE}/auth/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@adhyapharma.in', otp: adminLoginData.otp })
    });
    const adminVerifyData = await adminVerifyRes.json();
    const adminToken = adminVerifyData.token;
    assert(!!adminToken, 'Admin authenticated and received token');

    // 2. Login Retailer
    console.log('\n[2] Authenticating Retailer...');
    const retLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'retailer@adhyapharma.in', password: 'Password123!' })
    });
    const retLoginData = await retLoginRes.json();
    const retVerifyRes = await fetch(`${API_BASE}/auth/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'retailer@adhyapharma.in', otp: retLoginData.otp })
    });
    const retVerifyData = await retVerifyRes.json();
    const retToken = retVerifyData.token;
    assert(!!retToken, 'Retailer authenticated and received token');

    // 3. Connect Sockets
    console.log('\n[3] Connecting Admin & Retailer to Socket.IO...');
    const adminSocket = io(SOCKET_URL, {
      auth: { token: adminToken },
      transports: ['websocket', 'polling']
    });
    const retailerSocket = io(SOCKET_URL, {
      auth: { token: retToken },
      transports: ['websocket', 'polling']
    });

    await new Promise((resolve) => {
      let count = 0;
      const done = () => { count++; if (count === 2) resolve(); };
      adminSocket.on('connect', done);
      retailerSocket.on('connect', done);
    });
    assert(adminSocket.connected, 'Admin socket connected');
    assert(retailerSocket.connected, 'Retailer socket connected');

    // 4. Test: Retailer places order -> Admin receives 'orders:new'
    console.log('\n[4] Testing Order Placement -> Admin Real-time Event...');
    const meRes = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${retToken}` } });
    const meProfile = await meRes.json();
    const retailerId = meProfile.retailerId._id || meProfile.retailerId;

    const prodRes = await fetch(`${API_BASE}/products`, { headers: { Authorization: `Bearer ${retToken}` } });
    const prodData = await prodRes.json();
    const product = prodData.products[0];

    const newOrderPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for orders:new')), 5000);
      adminSocket.once('orders:new', (order) => {
        clearTimeout(timeout);
        resolve(order);
      });
    });

    const placeRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${retToken}`
      },
      body: JSON.stringify({
        retailerId,
        paymentMode: 'Credit',
        items: [{
          productId: product._id,
          qtyOrdered: 1,
          rate: product.ptr || 10
        }]
      })
    });
    const placedOrderData = await placeRes.json();
    const orderId = placedOrderData.order._id;
    assert(placeRes.status === 200 || placeRes.status === 201, 'Order placed successfully');

    const adminReceivedOrder = await newOrderPromise;
    assert(adminReceivedOrder._id === orderId, `Admin received real-time orders:new for ${orderId}`);

    // 5. Test: Admin updates status to 'Processing' -> Retailer receives 'order:status-updated'
    console.log('\n[5] Testing Admin Status Update -> Retailer Real-time Event...');
    const retailerStatusPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for order:status-updated')), 5000);
      retailerSocket.once('order:status-updated', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    const updateStatusRes = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Processing', comment: 'Order packed in warehouse' })
    });
    assert(updateStatusRes.status === 200, 'Admin updated status to Processing (200)');

    const retailerReceivedUpdate = await retailerStatusPromise;
    assert(retailerReceivedUpdate.orderId === orderId, 'Retailer received status update for matching orderId');
    assert(retailerReceivedUpdate.status === 'Processing', 'Status is Processing in real-time');

    // 6. Test: Retailer cancels order -> Admin receives 'order:status-updated' & 'orders:cancelled'
    console.log('\n[6] Testing Retailer Order Cancellation -> Admin Real-time Event...');
    const adminCancelPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for orders:cancelled')), 5000);
      adminSocket.once('orders:cancelled', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    const cancelRes = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${retToken}`
      },
      body: JSON.stringify({ reason: 'Changed mind' })
    });
    assert(cancelRes.status === 200, 'Retailer cancelled order successfully (200)');

    const adminReceivedCancel = await adminCancelPromise;
    assert(adminReceivedCancel.orderId === orderId, `Admin received real-time orders:cancelled for ${orderId}`);

    // Disconnect
    adminSocket.disconnect();
    retailerSocket.disconnect();

    console.log(`\n========================================`);
    console.log(`REAL-TIME SYNC SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Real-time test error:', err);
    process.exit(1);
  }
}

runRealtimeSyncTest();
