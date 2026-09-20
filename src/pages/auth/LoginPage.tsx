import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, loginAsDemoAnalyst, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your operational email and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      navigate('/dashboard');
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemoAnalyst();
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-blue-500/20 selection:text-blue-200">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-white">VoiceShield AI</h2>
          <p className="mt-1 text-xs text-slate-400">
            {isSupabaseConnected ? 'Secure Enterprise Authentication' : 'Defense Analyst Portal (Demo Mode)'}
          </p>
        </div>

        {/* Quick Demo Sign In Button for Judges/Reviewers */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
          <p className="text-xs text-blue-300 font-medium">Evaluating VoiceShield AI for SIH26104?</p>
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500 shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            <span>Instant Demo Analyst Sign-In</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800/80 w-full" />
          <span className="bg-slate-900/90 px-3 text-[11px] text-slate-400 uppercase tracking-wider absolute">
            Or sign in with credentials
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@defense.gov"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <NavLink to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
                Forgot password?
              </NavLink>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 border border-slate-700/80 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-slate-750 hover:text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                Verifying credentials...
              </span>
            ) : (
              <>
                <span>Sign in to Defense Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Need an incident analyst account?{' '}
          <NavLink to="/signup" className="text-blue-400 font-medium hover:text-blue-300 transition">
            Register Operator
          </NavLink>
        </div>
      </div>
    </div>
  );
};
