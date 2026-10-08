require('dotenv').config();
const crypto = require('crypto');
const { createOrderHandler, verifyPaymentHandler } = require('./routes/payments');

// Mock req and res helper
function mockReqRes(body = {}, headers = {}) {
  const req = {
    body,
    header: (name) => headers[name.toLowerCase()] || headers[name],
    headers,
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    send: (data) => {
      responseData = data;
      return res;
    },
  };
  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTests() {
  console.log('=== RUNNING RAZORPAY INTEGRATION TESTS ===\n');
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

  // ── TEST 1: Create Order - Validation (amount < 100 paise) ──
  {
    const { req, res, getStatus, getData } = mockReqRes({ amount: 50, currency: 'INR' });
    await createOrderHandler(req, res);
    assert(getStatus() === 400, 'Create order with amount < 100 paise returns 400');
    assert(getData()?.code === 'INVALID_AMOUNT', 'Create order returns INVALID_AMOUNT code');
  }

  // ── TEST 2: Create Order - Missing amount ──
  {
    const { req, res, getStatus } = mockReqRes({});
    await createOrderHandler(req, res);
    assert(getStatus() === 400, 'Create order with missing amount returns 400');
  }

  // ── TEST 3: Create Order - Valid amount (>= 100 paise) ──
  let createdOrderId = null;
  {
    const { req, res, getStatus, getData } = mockReqRes({
      amount: 50000, // 500.00 INR (50000 paise)
      currency: 'INR',
      receipt: `test_rcpt_${Date.now()}`
    });
    await createOrderHandler(req, res);
    const data = getData();
    assert(getStatus() === 200, 'Create order with valid amount returns 200');
    assert(!!data?.order_id, 'Response contains order_id');
    assert(data?.amount === 50000, 'Response contains correct amount in paise');
    assert(data?.currency === 'INR', 'Response contains correct currency');
    createdOrderId = data?.order_id;
    console.log(`       -> Created Razorpay Order ID: ${createdOrderId}`);
  }

  // ── TEST 4: Verify Signature - Missing fields ──
  {
    const { req, res, getStatus, getData } = mockReqRes({
      order_id: createdOrderId,
      // missing payment_id and signature
    });
    await verifyPaymentHandler(req, res);
    assert(getStatus() === 400, 'Verify payment with missing fields returns 400');
    assert(getData()?.code === 'PAYMENT_FIELDS_MISSING', 'Returns PAYMENT_FIELDS_MISSING code');
  }

  // ── TEST 5: Verify Signature - Signature mismatch ──
  {
    const fakePaymentId = 'pay_fake_test_12345';
    const fakeSignature = 'bad_invalid_signature_hex_code';
    const { req, res, getStatus, getData } = mockReqRes({
      order_id: createdOrderId,
      payment_id: fakePaymentId,
      signature: fakeSignature,
    });
    await verifyPaymentHandler(req, res);
    assert(getStatus() === 400, 'Verify payment with invalid signature returns 400');
    assert(getData()?.code === 'PAYMENT_SIGNATURE_INVALID', 'Returns PAYMENT_SIGNATURE_INVALID code');
    assert(getData()?.verified === false, 'Returns verified: false');
  }

  // ── TEST 6: Verify Signature - Valid HMAC-SHA256 signature ──
  {
    const fakePaymentId = 'pay_fake_test_98765';
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${createdOrderId}|${fakePaymentId}`)
      .digest('hex');

    const { req, res, getStatus, getData } = mockReqRes({
      order_id: createdOrderId,
      payment_id: fakePaymentId,
      signature: validSignature,
    });
    await verifyPaymentHandler(req, res);
    const data = getData();
    assert(getStatus() === 200, 'Verify payment with matching signature returns 200');
    assert(data?.verified === true, 'Returns verified: true');
    assert(data?.order_id === createdOrderId, 'Returns order_id');
    assert(data?.payment_id === fakePaymentId, 'Returns payment_id');
  }

  // ── TEST 7: Verify Signature - razorpay_* field naming compatibility ──
  {
    const fakePaymentId = 'pay_fake_test_compatibility';
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${createdOrderId}|${fakePaymentId}`)
      .digest('hex');

    const { req, res, getStatus, getData } = mockReqRes({
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
    });
    await verifyPaymentHandler(req, res);
    const data = getData();
    assert(getStatus() === 200, 'Verify payment with razorpay_* prefixed fields returns 200');
    assert(data?.verified === true, 'Returns verified: true');
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
