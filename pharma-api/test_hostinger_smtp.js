require('dotenv').config();
const { getTransporter, sendOtpEmail } = require('./utils/mailer');

async function testSmtp() {
  console.log('================================================================');
  console.log('      AADYA MEDICINE AGENCIES — SMTP EMAIL VERIFICATION TOOL    ');
  console.log('================================================================');
  const user = process.env.SMTP_USER || 'aadyamedicineagencies@gmail.com';
  const isGmail = user.toLowerCase().endsWith('@gmail.com') || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'));
  
  console.log(`Provider  : ${isGmail ? 'Google Gmail (App Password)' : 'Hostinger Business Mail'}`);
  console.log(`SMTP Host : ${process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.hostinger.com')}`);
  console.log(`SMTP Port : ${process.env.SMTP_PORT || '465'}`);
  console.log(`SMTP User : ${user}`);
  console.log(`SMTP Pass : ${process.env.SMTP_PASS ? '******** (configured)' : 'MISSING'}`);
  console.log(`SMTP From : ${process.env.SMTP_FROM || user}`);
  console.log('----------------------------------------------------------------');

  if (!process.env.SMTP_PASS) {
    console.log('❌ ERROR: SMTP_PASS is empty in pharma-api/.env!');
    console.log('👉 Please open "pharma-api/.env" and set SMTP_PASS.');
    if (isGmail) {
      console.log('📌 NOTE FOR GMAIL:');
      console.log('   Do NOT use your standard Gmail login password.');
      console.log('   You must use a 16-character Google "App Password".');
      console.log('   Generate it here: https://myaccount.google.com/apppasswords');
      console.log('   Example in .env: SMTP_PASS=abcd efgh ijkl mnop\n');
    }
    process.exit(1);
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('❌ Failed to initialize Nodemailer transporter.');
    process.exit(1);
  }

  console.log('⏳ 1. Testing SMTP Server Handshake & Authentication...');
  try {
    await transporter.verify();
    console.log('✅ Handshake & Authentication Successful! Credentials are VALID.\n');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    console.log('\nTroubleshooting tips:');
    if (isGmail) {
      console.log('1. For Gmail, you MUST generate an "App Password":');
      console.log('   Visit: https://myaccount.google.com/apppasswords');
      console.log('2. Ensure "2-Step Verification" is turned ON for aadyamedicineagencies@gmail.com.');
      console.log('3. Copy the 16-character App Password directly into SMTP_PASS in pharma-api/.env.');
    } else {
      console.log('1. Verify your Hostinger email password at https://mail.hostinger.com');
      console.log('2. Ensure SMTP_USER matches your full email address.');
    }
    console.log();
    process.exit(1);
  }

  const targetRecipient = process.argv[2];
  if (targetRecipient) {
    console.log(`⏳ 2. Sending live test OTP to: ${targetRecipient}...`);
    const testOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await sendOtpEmail({
      to: targetRecipient,
      otp: testOtp,
      fullName: 'Aadya Medicine Admin',
      purpose: 'signup',
    });

    if (result.sent) {
      console.log(`🎉 SUCCESS: Live OTP email dispatched!`);
      console.log(`   Message ID : ${result.messageId}`);
      console.log(`   Test OTP   : ${result.otp}`);
      console.log(`👉 Check your inbox/spam folder at ${targetRecipient}.\n`);
    } else {
      console.error(`❌ Failed to send email: ${result.error}`);
    }
  } else {
    console.log('💡 Tip: You can test live email delivery to your inbox by running:');
    console.log('   node test_hostinger_smtp.js your_personal_email@gmail.com\n');
  }
}

testSmtp();
