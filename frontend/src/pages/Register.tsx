import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Sparkles, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await register(name, email, password);
      if (res.success) {
        navigate('/verify-otp', { state: { email } });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
          <h2 className="text-3xl font-poppins font-bold tracking-tight text-white font-poppins font-bold">Get Started</h2>
          <p className="text-slate-400 mt-1 text-sm font-light">Create an account with Compass.ai today</p>
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
            <label className="block text-slate-300 text-xs font-semibold mb-2 tracking-wide uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

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
            <label className="block text-slate-300 text-xs font-semibold mb-2 tracking-wide uppercase">Password</label>
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
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-blue-600 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all glow-btn glow-cyan flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <Sparkles className="w-4 h-4" /></>}
          </button>

          <button 
            onClick={handleGoogleSignIn}
            type="button"
            disabled={loading}
            className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-750 text-secondary hover:text-white border border-slate-700 hover:border-secondary/40 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            Skip Registration (Enter as Guest) &rarr;
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-medium hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};
