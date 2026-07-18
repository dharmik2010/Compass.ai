import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Sparkles, PlaneTakeoff, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resetPassword } = useAuth();

  const email = location.state?.email || '';
  const isPasswordReset = location.state?.isPasswordReset || false;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isPasswordReset) {
        if (!newPassword) {
          setError('Please provide your new password.');
          setLoading(false);
          return;
        }
        const res = await resetPassword(email, otp, newPassword);
        if (res.success) {
          setSuccess('Password updated successfully. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        const res = await verifyOtp(email, otp);
        if (res.success) {
          setSuccess('Email verified. Welcome to Compass.ai!');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Check the server console logs for the mock mail code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-3xl glass-panel relative z-10 shadow-glass border border-slate-700/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <PlaneTakeoff className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-poppins font-bold tracking-tight text-white font-poppins">
            {isPasswordReset ? 'Enter Reset Info' : 'Security OTP Check'}
          </h2>
          <p className="text-slate-400 mt-1 text-sm text-center font-light">
            We sent a verification code to <span className="text-secondary font-medium">{email || 'your email'}</span>.<br/>
            <span className="text-[10px] text-accent/80 italic mt-1 block">Check the server log terminal to view the OTP.</span>
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-success" />
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2 tracking-wide uppercase">6-Digit OTP Code</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          {isPasswordReset && (
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-2 tracking-wide uppercase">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-blue-600 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all glow-btn glow-cyan flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code <Sparkles className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Didn't get the code?{' '}
          <Link to="/login" className="text-secondary font-medium hover:underline">Restart login</Link>
        </p>
      </motion.div>
    </div>
  );
};
