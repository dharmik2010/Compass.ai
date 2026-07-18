import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Sparkles, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message.includes('Verification Code')) {
        // Redirect to OTP verification
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin('demo.traveler@gmail.com', 'Demo Traveler');
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden">
      {/* Decorative Floating Circles */}
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
          <h2 className="text-3xl font-poppins font-bold tracking-tight text-white font-poppins">Welcome Back</h2>
          <p className="text-slate-400 mt-1 text-sm font-light">Enter your credentials to access Compass.ai</p>
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

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-xs font-semibold tracking-wide uppercase">Password</label>
              <Link to="/forgot-password" className="text-secondary hover:underline text-xs">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-blue-600 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all glow-btn glow-cyan flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <Sparkles className="w-4 h-4" /></>}
          </button>

          <button 
            onClick={handleGoogleSignIn}
            type="button"
            disabled={loading}
            className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-750 text-secondary hover:text-white border border-slate-700 hover:border-secondary/40 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            Skip Login (Enter as Guest) &rarr;
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/60"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#10192e] px-2 text-slate-500">Quick Testing</span></div>
        </div>

        <div className="space-y-3">

          <button 
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 text-xs font-semibold transition-all flex items-center justify-center gap-3"
          >
            {/* Custom Google Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" strokeLinecap="round" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Fast Login (Mocked)
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary font-medium hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
};
