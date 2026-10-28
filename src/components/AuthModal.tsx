/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { loginWithEmail, createAccount, requestPasswordReset } from '../lib/auth/authStore';
import { UserProfile } from '../types/api';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot') => {
    handleResetForm();
    setMode(newMode);
  };

  const handleFillDemo = () => {
    setEmail('developer@example.com');
    setPassword('DemoPass123!');
    setName('Alex Rivera');
    handleResetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetForm();
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        onSuccess(user);
        onClose();
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        const user = await createAccount(name, email, password);
        onSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        const msg = await requestPasswordReset(email);
        setSuccessMsg(msg);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with gradient accent */}
        <div className="bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            Developer Security Access
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {mode === 'login' && 'Sign In to Your Workspace'}
            {mode === 'register' && 'Create Developer Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-1">
            {mode === 'login' && 'Access your isolated API compatibility analysis records and reports.'}
            {mode === 'register' && 'Join to run real-time breaking change audits across microservice versions.'}
            {mode === 'forgot' && 'Enter your email address and we will generate recovery steps.'}
          </p>
        </div>

        {/* Tab switcher (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-purple-50 bg-[#F7F5FF]/60 px-6 pt-3">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-[#6C4DFF] text-[#6C4DFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-[#6C4DFF] text-[#6C4DFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Feedback banners */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Fill CTA */}
          {mode === 'login' && (
            <div className="flex justify-between items-center bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
              <span className="text-xs text-purple-900 font-medium">Quick testing demo account:</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-bold text-[#6C4DFF] hover:underline flex items-center gap-1"
              >
                Autofill Demo
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Full Name field for registration */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manikandan P"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password field */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-xs text-[#6C4DFF] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-slate-500 mt-1">Must be at least 6 characters long.</p>
              )}
            </div>
          )}

          {/* Confirm Password field */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] hover:opacity-95 shadow-md shadow-purple-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Sign In to Analyzer'}
                {mode === 'register' && 'Create Developer Account'}
                {mode === 'forgot' && 'Send Password Reset Link'}
              </>
            )}
          </button>

          {/* Bottom toggle for forgot mode */}
          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-xs font-semibold text-[#6C4DFF] hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
