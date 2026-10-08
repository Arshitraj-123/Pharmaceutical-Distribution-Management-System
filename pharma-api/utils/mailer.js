const nodemailer = require('nodemailer');

// ── HOSTINGER BUSINESS EMAIL SMTP CONFIGURATION ───────────────────────────
// Default SMTP settings for Hostinger Business Email:
// Host: smtp.hostinger.com
// Port: 465 (SSL) or 587 (TLS)
// Auth: orders@aadyamedicineagencies.com / Password
const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;
  const user = process.env.SMTP_USER || 'orders@aadyamedicineagencies.com';
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    return null; // SMTP credentials not configured yet; will fallback to console log
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks on shared hosts
    },
  });
};

/**
 * Send 2-Step Verification OTP Email
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 4-digit or 6-digit OTP code
 * @param {string} options.fullName - Recipient name
 * @param {string} options.purpose - 'signup' | 'login' | 'reset'
 */
const sendOtpEmail = async ({ to, otp, fullName = 'Valued Partner', purpose = 'signup' }) => {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'orders@aadyamedicineagencies.com';
  const companyName = 'Aadya Medicine Agencies';

  const subjectMap = {
    signup: `Your Registration OTP — ${companyName}`,
    login: `Your 2-Step Login OTP — ${companyName}`,
    reset: `Password Reset Verification Code — ${companyName}`,
  };

  const titleMap = {
    signup: 'Verify Your Retailer Account',
    login: 'Two-Step Login Verification',
    reset: 'Password Reset Request',
  };

  const actionTextMap = {
    signup: 'Thank you for registering with Aadya Medicine Agencies. Please use the verification code below to complete your account registration.',
    login: 'A sign-in attempt was initiated for your retailer account. Please enter the verification code below to authenticate.',
    reset: 'A request was made to reset your password. Use the verification code below to proceed.',
  };

  const subject = subjectMap[purpose] || `Verification Code — ${companyName}`;
  const title = titleMap[purpose] || 'Verification Code';
  const actionText = actionTextMap[purpose] || 'Please use the verification code below to verify your account.';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0d3b66 0%, #001e3d 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 28px; }
    .otp-label { font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0d3b66; font-family: 'Courier New', Courier, monospace; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
    .security-note { font-size: 12px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
      <p>B2B Pharmaceutical Distribution</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${fullName || 'Partner'},</div>
      <div class="message">${actionText}</div>
      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">Expires in 10 minutes · Single use only</div>
      </div>
      <div class="security-note">
        <strong>Security Tip:</strong> Never share this verification code with anyone. Representatives of ${companyName} will never ask for your verification code. If you did not request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
      Hostinger Business Mail Gateway · Sent via orders@aadyamedicineagencies.com
    </div>
  </div>
</body>
</html>
  `;

  const text = `Hello ${fullName || 'Partner'},\n\nYour ${title} code for ${companyName} is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n— ${companyName}`;

  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('\n============================================================');
      console.log(`[HOSTINGER SMTP SIMULATION] (SMTP_PASS not set in .env)`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Purpose: ${purpose}`);
      console.log('============================================================\n');
      return { sent: true, simulated: true, otp };
    }

    const info = await transporter.sendMail({
      from: `"${companyName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[HOSTINGER SMTP] OTP email sent successfully to ${to}: ${info.messageId}`);
    return { sent: true, simulated: false, messageId: info.messageId, otp };
  } catch (err) {
    console.error(`[HOSTINGER SMTP ERROR] Failed to send email to ${to}:`, err.message);
    // Return simulated fallback so registration / testing is not blocked
    return { sent: false, error: err.message, otp };
  }
};

module.exports = {
  sendOtpEmail,
  getTransporter,
};
