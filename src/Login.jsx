import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, Lock, LogIn, UserPlus, ArrowRight, GraduationCap, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login({ onGuest }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup, resetPassword } = useAuth();

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email first to reset your password.');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset email sent. Check your inbox!');
    } catch (err) {
      setError('Failed to reset password. Check if your email is registered.');
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // Success is handled by AuthContext redirecting the app state
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email is already registered.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err.code === 'auth/user-not-found') setError('Account not found.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError('Failed to authenticate. Check your details.');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-8"
         style={{background:'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, var(--bg) 60%)'}}>
      
      {/* NavBar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between nm-card p-3 sm:px-6 rounded-2xl mb-8 sm:mb-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 nm-card flex items-center justify-center border-glow-accent">
            <GraduationCap size={18} className="text-[var(--accent)]"/>
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">
            Sem<span className="text-[var(--accent)] glow-accent">Pilot</span>
          </h1>
        </div>
        <button onClick={onGuest} className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2">
          Guest Mode <ArrowRight size={14}/>
        </button>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-start justify-center mt-4 sm:mt-8">
        <div className="nm-card w-full max-w-sm p-6 sm:p-8 flex flex-col gap-6 animate-fade-in relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"/>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8b5cf6] opacity-5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"/>

          <div className="flex flex-col items-center text-center gap-1 mb-2 relative z-10">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-[var(--text-muted)] text-[11px] sm:text-xs px-2">
              {isSignUp ? 'Sign up to securely sync your dashboards' : 'Sign in to access your cloud dashboards'}
            </p>
          </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2 animate-fade-in relative z-10">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs px-4 py-3 rounded-xl flex items-start gap-2 animate-fade-in relative z-10">
            <div className="flex-shrink-0 mt-0.5 bg-[var(--accent)] w-3.5 h-3.5 rounded-full flex items-center justify-center">
              <LogIn size={8} className="text-[var(--bg)]" />
            </div>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Email</label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-[var(--text-muted)]" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--nm-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                placeholder="student@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
              {!isSignUp && (
                <button type="button" onClick={handleResetPassword} className="text-[10px] text-[var(--accent)] hover:underline focus:outline-none">
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-[var(--text-muted)]" />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--nm-border)] rounded-xl py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="nm-btn nm-btn-accent w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />)}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

          <div className="text-center mt-2 relative z-10">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
