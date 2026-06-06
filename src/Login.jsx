import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, Lock, LogIn, UserPlus, ArrowRight, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

export default function Login({ onGuest }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{background:'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, var(--bg) 60%)'}}>
      
      <div className="nm-card w-full max-w-md p-8 flex flex-col gap-6 animate-fade-in relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8b5cf6] opacity-5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"/>

        <div className="flex flex-col items-center text-center gap-2 mb-2 relative z-10">
          <div className="w-14 h-14 nm-card flex items-center justify-center border-glow-accent mb-2">
            <GraduationCap size={24} className="text-[var(--accent)]"/>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            Study<span className="text-[var(--accent)] glow-accent">Dash</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs">
            {isSignUp ? 'Create an account to sync across devices' : 'Sign in to access your cloud dashboards'}
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
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--nm-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                placeholder="••••••••"
              />
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

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-px bg-[var(--nm-border)] flex-1"/>
          <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">OR</span>
          <div className="h-px bg-[var(--nm-border)] flex-1"/>
        </div>

        <button 
          onClick={onGuest}
          className="nm-btn w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-2 hover:text-[var(--text-primary)] transition-colors relative z-10"
        >
          Continue as Guest <ArrowRight size={14}/>
        </button>

        <div className="text-center mt-2 relative z-10">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
