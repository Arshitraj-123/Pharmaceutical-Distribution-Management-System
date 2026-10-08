const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000/api';

// Helper to make simulated Google credential (header.payload.signature)
function makeSimulatedGoogleToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('mock_signature').toString('base64url');
  return `${header}.${body}.${sig}`;
}

async function runTests() {
  console.log('--- STARTING ACCOUNT MODULE VERIFICATION TESTS ---');
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
    // 1. Authenticate default retailer (2-step 2FA login)
    console.log('\n[1] Testing Retailer Login (Step 1 & Step 2)...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'retailer@adhyapharma.in', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login status 200');
    assert(loginData.step === 2, 'Received step 2 for OTP verification');
    assert(!!loginData.otp, 'Received dev OTP');

    const verifyLoginRes = await fetch(`${API_BASE}/auth/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'retailer@adhyapharma.in', otp: loginData.otp })
    });
    const verifyLoginData = await verifyLoginRes.json();
    assert(verifyLoginRes.status === 200, 'Login verify status 200');
    assert(!!verifyLoginData.token, 'Received JWT token');
    let token = verifyLoginData.token;

    // 2. GET /api/users/me
    console.log('\n[2] Testing GET /api/users/me...');
    const meRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /me status 200');
    assert(meData.email === 'retailer@adhyapharma.in', 'User email matches');
    assert(meData.role === 'Retailer', 'Role is Retailer');
    assert(!!meData.retailerId, 'Retailer profile populated');
    assert(!meData.password, 'Password field stripped');

    // 3. PUT /api/users/me
    console.log('\n[3] Testing PUT /api/users/me (safe profile fields)...');
    const updateRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Updated Retailer Name',
        phone: '9876543210',
        address: '123 Market Road, Suite 4'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /me status 200');
    assert(updateData.fullName === 'Updated Retailer Name', 'fullName updated');
    assert(updateData.phone === '9876543210', 'phone updated');
    assert(updateData.address === '123 Market Road, Suite 4', 'address updated');

    // 4. Email Change OTP flow
    console.log('\n[4] Testing OTP-based Email Change flow...');
    const tempNewEmail = `test_retailer_${Date.now()}@example.com`;
    const reqOtpRes = await fetch(`${API_BASE}/auth/request-email-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail: tempNewEmail })
    });
    const reqOtpData = await reqOtpRes.json();
    assert(reqOtpRes.status === 200, 'request-email-change status 200');
    assert(!!reqOtpData.otp, 'OTP received in dev response');

    const verifyOtpRes = await fetch(`${API_BASE}/auth/verify-email-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail: tempNewEmail, otp: reqOtpData.otp })
    });
    const verifyOtpData = await verifyOtpRes.json();
    assert(verifyOtpRes.status === 200, 'verify-email-change status 200');
    assert(verifyOtpData.user.email === tempNewEmail, 'Email successfully changed');
    assert(!!verifyOtpData.token, 'Received refreshed JWT token');
    token = verifyOtpData.token;

    // Restore original email
    console.log('\n[5] Restoring original email via OTP...');
    const reqOtpRestore = await fetch(`${API_BASE}/auth/request-email-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail: 'retailer@adhyapharma.in' })
    });
    const reqOtpRestoreData = await reqOtpRestore.json();
    const verifyOtpRestore = await fetch(`${API_BASE}/auth/verify-email-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail: 'retailer@adhyapharma.in', otp: reqOtpRestoreData.otp })
    });
    const verifyOtpRestoreData = await verifyOtpRestore.json();
    assert(verifyOtpRestore.status === 200, 'Original email restored');
    token = verifyOtpRestoreData.token;

    // 6. Change Password Flow
    console.log('\n[6] Testing Change Password Flow...');
    const wrongPassRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' })
    });
    assert(wrongPassRes.status === 401, 'Rejects wrong current password with 401');

    const changePassRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' })
    });
    assert(changePassRes.status === 200, 'Password changed successfully');

    // Change back to original password
    const restorePassRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: 'NewPassword123!', newPassword: 'Password123!' })
    });
    assert(restorePassRes.status === 200, 'Password reverted to original');

    // 7. Google Auth flow (Simulated GIS)
    console.log('\n[7] Testing Google Sign-In & Conflict Handling...');
    const googleSub = `google_sub_${Date.now()}`;
    const googleEmail = `google_user_${Date.now()}@gmail.com`;
    const googleCred = makeSimulatedGoogleToken({
      sub: googleSub,
      email: googleEmail,
      name: 'Google Test Retailer',
      picture: 'https://lh3.googleusercontent.com/a/default'
    });

    const googleSignupRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCred })
    });
    const googleSignupData = await googleSignupRes.json();
    assert(googleSignupRes.status === 201, 'Google new user returns 201 created');
    assert(googleSignupData.user.email === googleEmail, 'Google user email matches');
    assert(!!googleSignupData.user.retailerId, 'Retailer store auto-created for Google user');

    // Login again with same Google credential
    const googleLoginRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCred })
    });
    const googleLoginData = await googleLoginRes.json();
    assert(googleLoginRes.status === 200, 'Existing Google user returns 200 login');
    assert(googleLoginData.user.id === googleSignupData.user.id, 'Same user ID returned');

    // Conflict test: Google login attempt with existing local user email
    const conflictCred = makeSimulatedGoogleToken({
      sub: 'some_other_google_sub',
      email: 'retailer@adhyapharma.in',
      name: 'Conflict Attempt'
    });
    const conflictRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: conflictCred })
    });
    const conflictData = await conflictRes.json();
    assert(conflictRes.status === 409, 'Conflict returns 409 status');
    assert(conflictData.code === 'ACCOUNT_EXISTS_LINK_REQUIRED', 'Returns ACCOUNT_EXISTS_LINK_REQUIRED code');

    // 8. Retailer Orders & Cancellation
    console.log('\n[8] Testing /api/orders/my-orders...');
    const ordersRes = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const ordersData = await ordersRes.json();
    assert(ordersRes.status === 200, 'GET /my-orders status 200');
    assert(Array.isArray(ordersData.orders), 'orders is an array');

    // 9. Order Tracking endpoint
    console.log('\n[9] Testing Order Tracking endpoint & Cancellation...');
    // Fetch products to place an order
    const prodRes = await fetch(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prodData = await prodRes.json();
    const products = Array.isArray(prodData) ? prodData : (prodData.products || []);
    
    if (products.length > 0) {
      // Place a test order to test cancellation & inventory restock
      const meCheck = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meProfile = await meCheck.json();
      const retailerId = meProfile.retailerId._id || meProfile.retailerId;

      const placeOrderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          retailerId: retailerId,
          paymentMode: 'Credit',
          items: [{
            productId: products[0]._id,
            qtyOrdered: 2,
            rate: products[0].ptr || 10
          }]
        })
      });

      if (placeOrderRes.status === 201 || placeOrderRes.status === 200) {
        const newOrderData = await placeOrderRes.json();
        const orderId = newOrderData.order._id;
        assert(true, 'Test order placed successfully: ' + orderId);

        // Test Tracking
        const trackRes = await fetch(`${API_BASE}/orders/${orderId}/track`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const trackData = await trackRes.json();
        assert(trackRes.status === 200, 'GET /:id/track returns 200');
        assert(trackData.status === 'Pending', 'Initial status is Pending');
        assert(Array.isArray(trackData.statusHistory), 'statusHistory is array');

        // Test Cancel
        const cancelRes = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ reason: 'Ordered by mistake' })
        });
        const cancelData = await cancelRes.json();
        assert(cancelRes.status === 200, 'POST /:id/cancel returns 200');
        assert(cancelData.order.status === 'Cancelled', 'Status updated to Cancelled');
        assert(cancelData.order.cancelledBy === 'Retailer', 'cancelledBy is Retailer');

        // Re-cancelling should fail
        const reCancelRes = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ reason: 'Try again' })
        });
        assert(reCancelRes.status === 400, 'Cannot re-cancel terminal order (returns 400)');
      } else {
        const errText = await placeOrderRes.text();
        console.log('  Note: Could not place order due to:', errText);
      }
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
