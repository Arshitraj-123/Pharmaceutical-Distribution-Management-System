import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { 
  Activity, FlaskConical, ShieldCheck, ChevronRight, Microscope, TrendingUp, Users, Link as LinkIcon, 
  Eye, EyeOff, Building, Building2, Server, ArrowLeft, Mail, Smartphone, AlertTriangle, 
  CheckCircle2, Clock, Shield, LockKeyhole, Loader2, Check, XCircle
} from 'lucide-react';

export function PharmaAuth({ onLogin }) {
  // viewMode: login, register, sso-select, sso-redirect, forgot-request, forgot-verify, forgot-reset, forgot-success
  const [viewMode, setViewMode] = useState('login');
  
  // Shared state that spans across views
  const [resetEmail, setResetEmail] = useState('');

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] font-sans">
      <LeftPanel viewMode={viewMode} />
      <RightPanel viewMode={viewMode} setViewMode={setViewMode} onLogin={onLogin} resetEmail={resetEmail} setResetEmail={setResetEmail} />
    </div>
  );
}

// ==========================================
// LEFT PANEL (Dynamic content based on view)
// ==========================================
function LeftPanel({ viewMode }) {
  const isForgotFlow = viewMode.startsWith('forgot-');
  const isSsoFlow = viewMode.startsWith('sso-');
  
  return (
    <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-brand-dark p-12 text-white lg:flex">
      <div className="absolute top-8 left-12 flex items-center gap-3 z-20">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-success-solid shadow-lg">
          <LinkIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-wide text-white">Aadya Medicine Agencies</span>
        </div>
      </div>

      <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-teal-400/10 blur-[100px] z-0" />
      <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] z-0" />

      <div className={`relative z-10 w-full max-w-xl mx-auto ${['login', 'register'].includes(viewMode) ? '-mt-24' : ''}`}>
        <AnimatePresence mode="wait">
          
          {/* LOGIN & REGISTER */}
          {(viewMode === 'login' || viewMode === 'register') && (
            <motion.div key="auth-main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">
                {viewMode === 'register' ? <>Streamline Your <br /> Pharma Distribution</> : <>Manage Operations <br /> Efficiently</>}
              </h1>
              <p className="mb-12 text-lg text-slate-300">
                {viewMode === 'register' 
                  ? "Take complete control of your inventory, deliveries, and compliance with our intelligent distribution management system."
                  : "From stock allocation to real-time delivery tracking, optimize your supply chain and maximize fulfillment rates."
                }
              </p>

              {viewMode === 'register' ? (
                <div className="relative w-full rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center justify-center min-h-[200px]">
                  <div className="absolute top-4 left-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-status-success-solid" />
                    <span className="font-semibold text-white">Platform Features</span>
                  </div>
                  <div className="mt-8 flex flex-col gap-4 w-full px-4">
                     <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="bg-blue-500/20 p-2 rounded text-blue-300"><Microscope size={20} /></div>
                        <div>
                          <div className="font-medium">Live Inventory Control</div>
                          <div className="text-xs text-slate-300">Real-time stock tracking across all branches</div>
                        </div>
                     </motion.div>
                     <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-4 bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="bg-green-500/20 p-2 rounded text-green-300"><ShieldCheck size={20} /></div>
                        <div>
                          <div className="font-medium">Automated GST Compliance</div>
                          <div className="text-xs text-slate-300">Built-in regulatory checks and reporting</div>
                        </div>
                     </motion.div>
                     <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-4 bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="bg-rose-500/20 p-2 rounded text-rose-300"><Users size={20} /></div>
                        <div>
                          <div className="font-medium">Retailer Network Management</div>
                          <div className="text-xs text-slate-300">Seamless ordering and dispatch control</div>
                        </div>
                     </motion.div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full rounded-xl bg-white/5 p-6 backdrop-blur-md border border-white/10 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/10 p-4 border border-white/5">
                      <Users className="h-6 w-6 mb-2 text-status-success-solid" />
                      <div className="text-2xl font-bold">1.2k</div>
                      <div className="text-sm text-slate-300">Active Retailers</div>
                    </div>
                    <div className="rounded-lg bg-white/10 p-4 border border-white/5">
                      <TrendingUp className="h-6 w-6 mb-2 text-status-success-solid" />
                      <div className="text-2xl font-bold">98.2%</div>
                      <div className="text-sm text-slate-300">Delivery Success</div>
                    </div>
                  </div>
                   <FloatingBadge icon={<FlaskConical className="h-4 w-4 text-purple-600" />} text="Dispatch Control" delay={0.5} startX={50} startY={-50} className="-right-10 -top-6" />
                </div>
              )}
            </motion.div>
          )}

          {/* SSO SELECT */}
          {viewMode === 'sso-select' && (
            <motion.div key="sso-select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Enterprise <br /> Secure Access</h1>
              <p className="mb-12 text-lg text-slate-300">Use your corporate identity to securely access the Aadya Medicine Agencies DMS.</p>
              <div className="space-y-4">
                <div className="rounded-xl bg-white/10 p-5 border border-white/20 flex items-center gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg"><Server className="text-blue-400" /></div>
                  <div>
                    <div className="font-semibold text-lg">Single Sign-On</div>
                    <div className="text-sm text-slate-300">Centralized authentication and access</div>
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20 flex items-center gap-4">
                  <div className="bg-green-500/20 p-3 rounded-lg"><Shield className="text-green-400" /></div>
                  <div>
                    <div className="font-semibold text-lg">Access Control</div>
                    <div className="text-sm text-slate-300">Strict role-based security policies</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SSO REDIRECT */}
          {viewMode === 'sso-redirect' && (
            <motion.div key="sso-redirect" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Verifying your <br /> identity...</h1>
              <p className="mb-12 text-lg text-slate-300">Connecting securely to Microsoft Azure AD. This takes just a moment.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">SAML 2.0</div><div className="text-sm text-slate-400">Protocol</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">256-bit</div><div className="text-sm text-slate-400">Encryption</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">TLS 1.3</div><div className="text-sm text-slate-400">Transport</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">0 ms</div><div className="text-sm text-slate-400">Data stored</div></div>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD REQUEST */}
          {viewMode === 'forgot-request' && (
            <motion.div key="forgot-req" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Reset your <br /> password securely</h1>
              <p className="mb-12 text-lg text-slate-300">We'll send a one-time verification code to your registered email or phone number.</p>
              <div className="space-y-4">
                <div className="rounded-xl bg-white/10 p-4 border border-white/20 flex items-center gap-4">
                  <Mail className="text-green-400 opacity-80" /><div className="text-sm"><div className="font-semibold">OTP via email</div><div className="text-slate-400">Sent to your registered company email</div></div>
                </div>
                <div className="rounded-xl bg-white/10 p-4 border border-white/20 flex items-center gap-4">
                  <Smartphone className="text-green-400 opacity-80" /><div className="text-sm"><div className="font-semibold">OTP via SMS</div><div className="text-slate-400">Sent to your registered phone number</div></div>
                </div>
                <div className="rounded-xl bg-white/10 p-4 border border-white/20 flex items-center gap-4">
                  <Clock className="text-green-400 opacity-80" /><div className="text-sm"><div className="font-semibold">Code valid for 2 minutes</div><div className="text-slate-400">Request a new one if it expires</div></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VERIFY */}
          {viewMode === 'forgot-verify' && (
            <motion.div key="forgot-verify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Check your <br /> inbox</h1>
              <p className="mb-12 text-lg text-slate-300">A 4-digit verification code has been sent to your registered contact.</p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">4</div><div className="text-sm text-slate-400">Digit code</div></div>
                 <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">2 min</div><div className="text-sm text-slate-400">Validity</div></div>
              </div>
              <div className="mt-4 rounded-xl bg-white/10 p-4 border border-white/20 flex items-center gap-4">
                <Shield className="text-green-400 opacity-80" /><div className="text-sm"><div className="font-semibold">One-time use only</div><div className="text-slate-400">Code invalidated after use</div></div>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD RESET */}
          {viewMode === 'forgot-reset' && (
            <motion.div key="forgot-reset" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Create a strong <br /> new password</h1>
              <p className="mb-12 text-lg text-slate-300">Your new password must meet the Aadya Medicine Agencies security policy requirements.</p>
              <div className="space-y-3">
                <PolicyCard title="Minimum 8 characters" sub="Longer is stronger" valid={true} />
                <PolicyCard title="1 uppercase + 1 number" sub="Mix letters and digits" valid={true} />
                <PolicyCard title="1 special character" sub="e.g. @ # $ &" valid={true} />
                <PolicyCard title="Cannot reuse last 5 passwords" sub="Security policy requirement" valid={false} icon={<XCircle size={18} className="text-rose-400" />} />
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD SUCCESS */}
          {viewMode === 'forgot-success' && (
            <motion.div key="forgot-success" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="mb-4 text-5xl font-bold leading-tight">Password reset <br /> complete</h1>
              <p className="mb-12 text-lg text-slate-300">Your password has been updated securely. You can now sign in with your new credentials.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">AES-256</div><div className="text-sm text-slate-400">Encryption</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">bcrypt</div><div className="text-sm text-slate-400">Hash (cost 12)</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">0</div><div className="text-sm text-slate-400">Plain text stored</div></div>
                <div className="rounded-xl bg-white/10 p-5 border border-white/20"><div className="font-bold text-xl mb-1">90 days</div><div className="text-sm text-slate-400">Password expiry</div></div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-8 left-12 text-sm text-teal-100/50 z-20">
        © Aadya Medicine Agencies 2026. All Rights Reserved
      </div>
    </div>
  );
}

function PolicyCard({ title, sub, valid, icon }) {
  return (
    <div className={`rounded-xl bg-white/10 p-4 border border-white/20 flex items-center gap-4 transition-colors ${valid ? 'border-green-500/30 bg-green-500/10' : ''}`}>
      {icon || <Check className={`h-5 w-5 ${valid ? 'text-green-400' : 'text-slate-500 opacity-50'}`} />}
      <div className="text-sm">
        <div className={`font-semibold ${valid ? 'text-white' : 'text-slate-300'}`}>{title}</div>
        <div className="text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

// ==========================================
// RIGHT PANEL (Dynamic content based on view)
// ==========================================
function RightPanel({ viewMode, setViewMode, onLogin, resetEmail, setResetEmail }) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center p-8 lg:w-1/2" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <AnimatePresence mode="wait">
        {(viewMode === 'login' || viewMode === 'register') && <LoginRegisterForms key="login-register" viewMode={viewMode} setViewMode={setViewMode} onLogin={onLogin} />}
        {(viewMode === 'sso-select' || viewMode === 'sso-redirect') && <SSOForms key="sso" viewMode={viewMode} setViewMode={setViewMode} onLogin={onLogin} />}
        {viewMode.startsWith('forgot-') && <ForgotPasswordForms key="forgot" viewMode={viewMode} setViewMode={setViewMode} resetEmail={resetEmail} setResetEmail={setResetEmail} />}
      </AnimatePresence>

      {/* Footer */}
      {(viewMode === 'login' || viewMode === 'register') && (
        <p className="mt-8 text-center text-xs text-slate-400">
          By accessing this system, you agree to the <br />
          <a href="#" className="underline hover:text-slate-600">IT Security Policy</a> and <a href="#" className="underline hover:text-slate-600">Confidentiality Agreement</a>
        </p>
      )}
    </div>
  );
}

// =====================
// FORMS & FLOWS
// =====================

function LoginRegisterForms({ viewMode, setViewMode, onLogin }) {
  const isLogin = viewMode === 'login';
  const [authStep, setAuthStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '', otp: ['', '', '', ''] });
  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', empId: '', role: '', branch: '', license: '' });
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!loginForm.email) newErrors.email = "Email is required";
    else if (!validateEmail(loginForm.email)) newErrors.email = "Invalid email format";
    if (!loginForm.password) newErrors.password = "Password is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        const res = await api.post('/auth/login', { email: loginForm.email, password: loginForm.password });
        
        // Log OTP to console for easy testing!
        console.log('--- TEST 2FA OTP GENERATED ---');
        console.log('OTP:', res.data.otp);
        console.log('------------------------------');

        setAuthStep(2); 
        setErrors({});
      } catch (err) {
        setErrors({ email: err.response?.data?.message || 'Login failed' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...loginForm.otp];
    newOtp[index] = value;
    setLoginForm({ ...loginForm, otp: newOtp });
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !loginForm.otp[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (loginForm.otp.join('').length === 4) { 
      try {
        setLoading(true);
        const res = await api.post('/auth/login-verify', { email: loginForm.email, otp: loginForm.otp.join('') });
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        if (onLogin) onLogin(res.data.user);
      } catch (err) {
        setErrors({ otp: err.response?.data?.message || 'Invalid OTP' });
      } finally {
        setLoading(false);
      }
    } else { 
      setErrors({ otp: "Please enter the 4-digit OTP" }); 
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!regForm.fullName) newErrors.fullName = "Required";
    if (!regForm.email) newErrors.email = "Required"; else if (!validateEmail(regForm.email)) newErrors.email = "Invalid";
    if (!regForm.password) newErrors.password = "Required"; else if (regForm.password.length < 8) newErrors.password = "Min 8 chars";
    if (!regForm.empId) newErrors.empId = "Required";
    if (!regForm.role) newErrors.role = "Required";
    if (!regForm.branch) newErrors.branch = "Required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        await api.post('/auth/register', regForm);
        alert("Registration successful! Awaiting admin approval.");
        setViewMode('login');
        setAuthStep(1);
      } catch (err) {
        setErrors({ email: err.response?.data?.message || 'Registration failed' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div layout className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
      <AnimatePresence mode="wait">
        {!isLogin ? (
          <motion.div key="register-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-status-success-solid shadow-md"><LinkIcon className="h-7 w-7" /></div>
              <h2 className="text-2xl font-bold text-slate-900">Partner Registration</h2>
            </div>
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600" />
              <div>All new registrations require administrative approval.</div>
            </div>
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-sm font-medium">Name</label><input type="text" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} className={`w-full rounded-lg border ${errors.fullName?'border-red-500':'border-slate-200'} px-3 py-2 text-sm`} /></div>
                <div><label className="mb-1 block text-sm font-medium">Emp ID</label><input type="text" value={regForm.empId} onChange={e => setRegForm({...regForm, empId: e.target.value})} className={`w-full rounded-lg border ${errors.empId?'border-red-500':'border-slate-200'} px-3 py-2 text-sm`} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <select value={regForm.role} onChange={e => setRegForm({...regForm, role: e.target.value})} className={`w-full rounded-lg border ${errors.role?'border-red-500':'border-slate-200'} px-3 py-2 text-sm bg-white`}>
                    <option value="">Select</option><option value="Manager">Manager</option><option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Branch</label>
                  <select value={regForm.branch} onChange={e => setRegForm({...regForm, branch: e.target.value})} className={`w-full rounded-lg border ${errors.branch?'border-red-500':'border-slate-200'} px-3 py-2 text-sm bg-white`}>
                    <option value="">Select</option><option value="HQ">HQ</option><option value="Patna">Patna</option>
                  </select>
                </div>
              </div>
              <div><label className="mb-1 block text-sm font-medium">Email</label><input type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className={`w-full rounded-lg border ${errors.email?'border-red-500':'border-slate-200'} px-3 py-2 text-sm`} /></div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className={`w-full rounded-lg border ${errors.password?'border-red-500':'border-slate-200'} px-3 py-2 text-sm`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <button disabled={loading} className="mt-4 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-70">{loading ? 'Submitting...' : 'Submit Registration'}</button>
            </form>
          </motion.div>
        ) : authStep === 1 ? (
          <motion.div key="login-form-step-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-status-success-solid shadow-md"><LinkIcon className="h-7 w-7" /></div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            </div>
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className={`w-full rounded-lg border ${errors.email?'border-red-500':'border-slate-200'} px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1`} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium">Password</label>
                  <button type="button" onClick={() => setViewMode('forgot-request')} className="text-xs font-semibold text-teal-700 hover:text-teal-800">Forgot Password?</button>
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className={`w-full rounded-lg border ${errors.password?'border-red-500':'border-slate-200'} px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <button disabled={loading} className="mt-6 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-70">{loading ? 'Signing in...' : 'Continue'}</button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="login-form-step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
             <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-status-success-solid shadow-md"><ShieldCheck className="h-7 w-7" /></div>
              <h2 className="text-2xl font-bold text-slate-900">2-Factor Auth</h2>
              <p className="mt-2 text-sm text-slate-500">Enter the 4-digit OTP sent to {loginForm.email}.</p>
            </div>
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div className="flex justify-center gap-4">
                {loginForm.otp.map((digit, index) => (
                  <input key={index} ref={otpRefs[index]} type="text" maxLength="1" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border ${errors.otp?'border-red-500':'border-slate-200'} outline-none focus:border-slate-900 focus:ring-2`} />
                ))}
              </div>
              {errors.otp && <p className="text-center text-sm text-red-500">{errors.otp}</p>}
              <button disabled={loading} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-70">{loading ? 'Verifying...' : 'Verify & Login'}</button>
              <button type="button" onClick={() => setAuthStep(1)} className="w-full text-center text-sm text-slate-500">Back to password</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-slate-500">Secure Access</span></div></div>
        <div className="mt-6 flex justify-center">
           <button onClick={() => setViewMode('sso-select')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:shadow-sm">
             <Building className="h-5 w-5 text-slate-500" /> Login with Corporate SSO (SAML)
           </button>
        </div>
      </div>
      <div className="mt-8 flex justify-center border-t border-slate-100 pt-8">
        <button onClick={() => { setViewMode(isLogin ? 'register' : 'login'); setAuthStep(1); setErrors({}); }} className="group flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
          {isLogin ? "Don't have an account? Apply here" : "Already registered? Sign In"}
          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

function SSOForms({ viewMode, setViewMode, onLogin }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (viewMode === 'sso-redirect') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 4) {
            clearInterval(interval);
            setTimeout(() => onLogin(), 500);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [viewMode, onLogin]);

  return (
    <motion.div layout className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <button onClick={() => setViewMode('login')} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="mr-1 h-4 w-4" /> Return to email login</button>
      
      {viewMode === 'sso-select' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm"><Building2 className="h-7 w-7" /></div>
            <h2 className="text-2xl font-bold text-slate-900">Corporate SSO</h2>
          </div>
          
          <div className="space-y-4">
            <button onClick={() => setViewMode('sso-redirect')} className="w-full text-left p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm font-bold text-blue-600 text-lg">M</div>
                 <div><div className="font-semibold text-slate-800">Microsoft Azure AD</div><div className="text-xs text-blue-600 font-medium">SAML 2.0 • Active</div></div>
               </div>
               <ChevronRight className="text-blue-400" />
            </button>
            <div className="w-full text-left p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between opacity-60 cursor-not-allowed">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm font-bold text-slate-500 text-lg">O</div>
                 <div><div className="font-semibold text-slate-500">Okta</div><div className="text-xs text-slate-400 font-medium">Inactive • Contact IT Admin</div></div>
               </div>
               <LockKeyhole className="text-slate-400 h-4 w-4" />
            </div>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-500">
            You will be securely redirected to your identity provider to complete authentication.
          </div>
        </motion.div>
      )}

      {viewMode === 'sso-redirect' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
           <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm"><Loader2 className="h-7 w-7 animate-spin" /></div>
            <h2 className="text-xl font-bold text-slate-900">Redirecting to Microsoft...</h2>
            <p className="mt-2 text-sm text-slate-500">Please wait — do not close this window.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm">
              {progress >= 1 ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : progress === 0 ? <Loader2 className="text-blue-500 h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />}
              <span className={progress >= 1 ? 'text-slate-700' : progress === 0 ? 'text-blue-600 font-medium' : 'text-slate-400'}>SAML request generated</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {progress >= 2 ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : progress === 1 ? <Loader2 className="text-blue-500 h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />}
              <span className={progress >= 2 ? 'text-slate-700' : progress === 1 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Encrypted connection established</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {progress >= 3 ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : progress === 2 ? <Loader2 className="text-blue-500 h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />}
              <span className={progress >= 3 ? 'text-slate-700' : progress === 2 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Awaiting identity provider response...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {progress >= 4 ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : progress === 3 ? <Loader2 className="text-blue-500 h-5 w-5 animate-spin" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-200" />}
              <span className={progress >= 4 ? 'text-slate-700' : progress === 3 ? 'text-blue-600 font-medium' : 'text-slate-400'}>Session token issued on success</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
            <motion.div className="bg-blue-600 h-1.5 rounded-full" animate={{ width: `${(progress / 4) * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
          
          <button onClick={() => setViewMode('sso-select')} className="w-full py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        </motion.div>
      )}
    </motion.div>
  );
}

function ForgotPasswordForms({ viewMode, setViewMode, resetEmail, setResetEmail }) {
  const [otp, setOtp] = useState(['','','','']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [timeLeft, setTimeLeft] = useState(120);
  
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (viewMode === 'forgot-verify' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, timeLeft]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const getStrength = (pass) => {
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    if (pass.length >= 12) s++; // Extra bonus
    return s; // 0 to 4
  };
  const strength = getStrength(newPass);

  const renderProgress = (step) => (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
      <div className={`h-px w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
      <div className={`h-px w-8 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
    </div>
  );

  return (
    <motion.div layout className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      {viewMode !== 'forgot-success' && (
        <button onClick={() => { setError(''); setViewMode(viewMode === 'forgot-request' ? 'login' : viewMode === 'forgot-verify' ? 'forgot-request' : 'forgot-verify'); }} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="mr-1 h-4 w-4" /> Back</button>
      )}

      {viewMode === 'forgot-request' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm"><LockKeyhole className="h-7 w-7" /></div>
            <h2 className="text-2xl font-bold text-slate-900">Forgot your password?</h2>
          </div>
          {renderProgress(1)}
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Work email address <span className="text-red-500">*</span></label>
              <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="yourname@adhyapharma.in" className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            </div>
            
            <div>
               <label className="mb-1.5 block text-sm font-medium">Send OTP via</label>
               <div className="flex gap-4">
                 <label className="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                   <input type="radio" name="otpType" defaultChecked className="text-blue-600" /> <span className="text-sm font-medium text-slate-700">Email OTP</span>
                 </label>
                 <label className="flex-1 flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                   <input type="radio" name="otpType" className="text-blue-600" /> <span className="text-sm font-medium text-slate-700">SMS OTP</span>
                 </label>
               </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>If you don't receive the OTP within 2 minutes, contact your system administrator at admin@adhyapharma.in</div>
            </div>

            <button onClick={async () => { 
              if(resetEmail) { 
                try {
                  setLoading(true);
                  setError('');
                  const res = await api.post('/auth/forgot-password', { email: resetEmail, type: 'email' });
                  
                  // For easy testing: log the OTP directly to the browser console!
                  console.log('--- TEST OTP GENERATED ---');
                  console.log('OTP:', res.data.otp);
                  console.log('--------------------------');

                  setViewMode('forgot-verify'); 
                  setTimeLeft(120); 
                } catch(err) {
                  setError(err.response?.data?.message || 'Failed to send OTP');
                } finally {
                  setLoading(false);
                }
              } 
            }} disabled={loading || !resetEmail} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white mt-4 disabled:opacity-70">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </motion.div>
      )}

      {viewMode === 'forgot-verify' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 shadow-sm"><Mail className="h-7 w-7" /></div>
            <h2 className="text-2xl font-bold text-slate-900">Enter verification code</h2>
            <p className="mt-2 text-sm text-slate-500">We sent a 4-digit OTP to <br/><span className="font-semibold text-slate-800">{resetEmail ? resetEmail.replace(/(.{1}).*(@.*)/, "$1***$2") : "r***h@adhyapharma.in"}</span></p>
          </div>
          {renderProgress(2)}

          <div className="flex justify-between gap-2 mb-6">
            {otp.map((digit, index) => (
              <input key={index} ref={otpRefs[index]} type="text" maxLength="1" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 outline-none" />
            ))}
          </div>
          
          <div className="text-center text-sm font-medium text-slate-600 mb-6">
             Resend OTP in <span className="text-blue-600 font-bold">{Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}</span>
          </div>

          <button onClick={async () => {
             try {
               setLoading(true);
               setError('');
               await api.post('/auth/verify-otp', { email: resetEmail, otp: otp.join('') });
               setViewMode('forgot-reset');
             } catch(err) {
               setError(err.response?.data?.message || 'Invalid OTP');
             } finally {
               setLoading(false);
             }
          }} disabled={loading || otp.join('').length < 4} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-70">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          
          <div className="mt-4 text-center text-sm text-slate-500">Didn't receive it? <button className="font-semibold text-slate-800 hover:underline">Resend OTP</button></div>
        </motion.div>
      )}

      {viewMode === 'forgot-reset' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm"><LockKeyhole className="h-7 w-7" /></div>
            <h2 className="text-2xl font-bold text-slate-900">Set new password</h2>
            <p className="mt-2 text-sm text-slate-500">OTP verified. Create your new secure password below.</p>
          </div>
          {renderProgress(3)}

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">New password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showP1 ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" />
                <button type="button" onClick={() => setShowP1(!showP1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showP1 ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <div className="mt-2 flex gap-1 h-1">
                {[0,1,2,3].map(i => <div key={i} className={`flex-1 rounded-full ${i < strength ? (strength < 2 ? 'bg-red-400' : strength < 3 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`} />)}
              </div>
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm new password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showP2 ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900" />
                <button type="button" onClick={() => setShowP2(!showP2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showP2 ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
              After resetting, you will be asked to set up 2-Factor Authentication (2FA) if not already configured.
            </div>

            <button onClick={async () => {
              try {
                setLoading(true);
                setError('');
                await api.post('/auth/reset-password', { email: resetEmail, newPassword: newPass });
                setViewMode('forgot-success');
              } catch(err) {
                setError(err.response?.data?.message || 'Reset failed');
              } finally {
                setLoading(false);
              }
            }} disabled={strength < 3 || newPass !== confirmPass || loading} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </motion.div>
      )}

      {viewMode === 'forgot-success' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
           <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-sm border border-green-100"><CheckCircle2 className="h-10 w-10" /></div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Password reset successful</h2>
           <p className="text-sm text-slate-500 mb-8">Your Aadya Medicine Agencies account password has been securely updated. All active sessions have been signed out for your security.</p>
           
           <div className="space-y-3 text-left mb-8">
             <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 text-sm text-green-800">
               <Check className="h-5 w-5 shrink-0 mt-0.5" /> <div>Password updated and encrypted with bcrypt (cost 12+). Previous sessions invalidated.</div>
             </div>
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 text-sm text-blue-800">
               <Activity className="h-5 w-5 shrink-0 mt-0.5" /> <div>A confirmation email has been sent to your registered address. If you did not request this reset, contact IT immediately.</div>
             </div>
           </div>

           <button onClick={() => setViewMode('login')} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">Sign In with new password</button>
        </motion.div>
      )}

    </motion.div>
  );
}

function FloatingBadge({ icon, text, delay, className, startX = 0, startY = 50 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: startX, y: startY, scale: 0.5 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: delay, type: "spring", bounce: 0.4 }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: delay + 0.8 }}
        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 shadow-xl border border-slate-100"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-[#27374D]">{icon}</div>
        <span className="font-semibold text-slate-700 text-sm">{text}</span>
      </motion.div>
    </motion.div>
  );
}
