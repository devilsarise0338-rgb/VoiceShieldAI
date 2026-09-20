import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your account email.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.message) {
      setMessage(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 selection:bg-blue-500/20 selection:text-blue-200">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Reset Account Access</h2>
          <p className="mt-1 text-xs text-slate-400">Recovery Verification Protocol</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-blue-400 mb-2" />
            <p className="text-xs text-blue-200">{message}</p>
            <NavLink
              to="/login"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
            >
              Return to Login
            </NavLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Registered Email
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500 shadow-sm"
            >
              {isSubmitting ? 'Dispatching Recovery Instructions...' : 'Send Password Recovery Email'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400">
          <NavLink to="/login" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
