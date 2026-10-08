import { useState } from 'react';
import api from '../api/axios';
import { B } from '../theme.js';

// Helper to ensure Razorpay checkout.js script is loaded
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      existing.onload = () => resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

/**
 * RazorpayCheckoutButton
 * 
 * Standard Razorpay Checkout Button with payment modal and signature verification
 */
export function RazorpayCheckoutButton({
  amount, // Amount in Rupees (e.g. 1500 for ₹1,500)
  receipt,
  description = 'Pharma Invoice Payment',
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onSuccess,
  onError,
  buttonText = 'Pay via Razorpay',
  buttonStyle = {},
  variant = 'primary', // 'primary', 'small', 'icon'
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e) => {
    if (e) e.stopPropagation();
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!keyId) {
      alert('Razorpay Key ID is not configured in environment variables.');
      return;
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    if (!amountInPaise || amountInPaise < 100) {
      alert('Invalid amount. Minimum amount for Razorpay is ₹1.00 (100 paise).');
      return;
    }

    try {
      setLoading(true);
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK unavailable.');
      }

      // Step 1: Backend Create Order
      const { data: orderData } = await api.post('/create-order', {
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
      });

      const orderId = orderData.order_id || orderData.razorpay_order_id;
      if (!orderId) {
        throw new Error('Failed to retrieve order ID from server.');
      }

      // Step 2: Open Razorpay modal with order_id
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Aadya Medicine Agencies',
        description,
        order_id: orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#1B3A6B',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log('[Razorpay] Modal dismissed by user');
          },
        },
        handler: async (response) => {
          // Step 3: Backend Verify Signature
          try {
            const { data: verifyData } = await api.post('/verify-payment', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setLoading(false);
            if (onSuccess) {
              onSuccess(verifyData, response);
            } else {
              alert(`Payment of ₹${Number(amount).toLocaleString('en-IN')} successful!\nPayment ID: ${response.razorpay_payment_id}`);
            }
          } catch (verifyErr) {
            setLoading(false);
            const msg = verifyErr.response?.data?.message || 'Payment signature verification failed.';
            console.error('[Razorpay] Verification error:', verifyErr);
            if (onError) onError(msg);
            else alert(`Verification Failed: ${msg}`);
          }
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          setLoading(false);
          const errMsg = response.error?.description || 'Payment failed.';
          if (orderData.demo_mode && (errMsg.includes('Authentication') || response.error?.code === 'BAD_REQUEST_ERROR')) {
            console.log('[Razorpay] Demo Mode: Completing test payment simulation...');
            await options.handler({
              razorpay_order_id: orderId,
              razorpay_payment_id: `pay_demo_${Date.now()}`,
              razorpay_signature: `sig_demo_${Date.now()}`,
            });
            return;
          }
          console.error('[Razorpay] Payment failed:', response.error);
          if (onError) onError(errMsg);
          else alert(`Payment Failed: ${errMsg}`);
        });
        rzp.open();
      } catch (widgetErr) {
        if (orderData.demo_mode) {
          await options.handler({
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: `sig_demo_${Date.now()}`,
          });
        } else {
          throw widgetErr;
        }
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'Payment initiation failed.';
      console.error('[Razorpay] Checkout initiation error:', err);
      if (onError) onError(errMsg);
      else alert(`Error: ${errMsg}`);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        title={buttonText}
        style={{
          background: 'none',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          color: B.navyMid,
          padding: 2,
          display: 'inline-flex',
          alignItems: 'center',
          opacity: loading ? 0.6 : 1,
          ...buttonStyle,
        }}
      >
        <i className={loading ? "ti ti-loader ti-spin" : "ti ti-credit-card"} style={{ fontSize: 16 }} />
      </button>
    );
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          padding: '4px 8px',
          border: `1px solid ${B.navyMid}`,
          borderRadius: 6,
          background: B.navyMid,
          color: B.white,
          fontSize: 11,
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          opacity: loading ? 0.7 : 1,
          ...buttonStyle,
        }}
      >
        <i className={loading ? "ti ti-loader ti-spin" : "ti ti-credit-card"} style={{ fontSize: 12 }} />
        {loading ? 'Processing…' : buttonText}
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      style={{
        padding: '8px 14px',
        border: 'none',
        borderRadius: 8,
        background: '#1B3A6B',
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 2px 4px rgba(27, 58, 107, 0.2)',
        opacity: loading ? 0.7 : 1,
        ...buttonStyle,
      }}
    >
      <i className={loading ? "ti ti-loader ti-spin" : "ti ti-credit-card"} style={{ fontSize: 14 }} />
      {loading ? 'Opening Razorpay…' : buttonText}
    </button>
  );
}
