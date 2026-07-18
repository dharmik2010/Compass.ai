import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Sparkles, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSuccess('Password reset OTP sent successfully to your email.');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email, isPasswordReset: true } });
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger password reset.');
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
            <Compass className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-poppins font-bold tracking-tight text-white font-poppins">Reset Password</h2>
          <p className="text-slate-400 mt-1 text-sm font-light">We will send you a verification OTP code</p>
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
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-success" />
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2 tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-blue-600 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all glow-btn glow-cyan flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request OTP <Sparkles className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Back to{' '}
          <Link to="/login" className="text-secondary font-medium hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};
