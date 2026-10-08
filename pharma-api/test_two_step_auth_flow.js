const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000/api';

// Helper to make simulated Google credential (header.payload.signature)
function makeSimulatedGoogleToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('mock_signature').toString('base64url');
  return `${header}.${body}.${sig}`;
}

async function runTwoStepAuthTests() {
  console.log('=== RUNNING TWO-STEP OTP AUTH & REGISTRATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  const testEmail = `retailer_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testFullName = 'Test Pharmacy Owner';

  // ── TEST 1: Manual Registration Step 1 ─────────────────────────────────
  console.log('▶ TEST 1: Initiate Manual Registration (Step 1)...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testFullName,
      storeName: 'Aadya Test Medico',
      email: testEmail,
      password: testPassword,
      phone: '9876543210',
      city: 'Patna',
      role: 'Retailer',
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 200, 'Registration initiation returns HTTP 200');
  assert(regData.step === 2, 'Response requires step 2 for OTP verification');
  assert(!!regData.otp, 'Dev mode returns OTP code for automated testing');
  const otpCode = regData.otp;

  // ── TEST 2: Reject Invalid Registration OTP ─────────────────────────────
  console.log('\n▶ TEST 2: Verify Registration with Invalid OTP (9999)...');
  const wrongOtpRes = await fetch(`${API_BASE}/auth/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '9999',
    }),
  });
  assert(wrongOtpRes.status === 400, 'Rejects invalid OTP with HTTP 400');

  // ── TEST 3: Verify Registration with Correct OTP (Step 2) ───────────────
  console.log('\n▶ TEST 3: Verify Registration with Correct OTP...');
  const verifyRes = await fetch(`${API_BASE}/auth/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: otpCode,
    }),
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 200, 'Registration verification returns HTTP 200');
  assert(verifyData.verified === true, 'Returns verified: true');
  assert(!!verifyData.verificationToken, 'Returns temporary verificationToken for 1-click sign in');
  const verificationToken = verifyData.verificationToken;

  // ── TEST 4: 1-Click Sign In with Auto-Filled Credentials ────────────────
  console.log('\n▶ TEST 4: 1-Click Sign In with Auto-Filled Email, Password & verificationToken...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      verificationToken,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Login with verificationToken returns HTTP 200');
  assert(!!loginData.token, 'Immediately returns JWT token without redundant OTP prompt');
  assert(loginData.user?.email === testEmail.toLowerCase(), 'Authenticated user matches registered email');

  // ── TEST 5: Non-Registered Google Sign-In Requires 2-Step OTP ───────────
  console.log('\n▶ TEST 5: Non-Registered Google Retailer Requires 2-Step OTP...');
  const googleEmail = `google_retailer_${Date.now()}@gmail.com`;
  const googleToken = makeSimulatedGoogleToken({
    sub: `google_sub_${Date.now()}`,
    email: googleEmail,
    name: 'Google Medico Store',
    picture: 'https://lh3.googleusercontent.com/test.jpg',
  });

  const googleRes = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: googleToken }),
  });
  const googleData = await googleRes.json();
  assert(googleRes.status === 200, 'Non-registered Google request returns HTTP 200');
  assert(googleData.requiresOtp === true, 'Returns requiresOtp: true (blocks bypass of 2-step verification)');
  assert(googleData.step === 2, 'Step is 2');
  assert(!!googleData.otp, 'Returns OTP code for dev testing');
  const googleOtp = googleData.otp;

  // ── TEST 6: Complete Google 2-Step Verification ─────────────────────────
  console.log('\n▶ TEST 6: Complete Google 2-Step Verification...');
  const googleVerifyRes = await fetch(`${API_BASE}/auth/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleEmail,
      otp: googleOtp,
    }),
  });
  const googleVerifyData = await googleVerifyRes.json();
  assert(googleVerifyRes.status === 200, 'Google 2-step verification returns HTTP 200');
  assert(googleVerifyData.verified === true, 'Google retailer account activated');

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTwoStepAuthTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
