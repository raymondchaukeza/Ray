import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { UserSession } from '../types/index.ts';
import { DEMO_ACCOUNTS } from '../data/seedData.ts';

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onCancel,
  isModal = false,
}) => {
  const [username, setUsername] = useState('sipho.khumalo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username field is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password field is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Check demo accounts first
      const matched = DEMO_ACCOUNTS.find(
        (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (matched) {
        onLoginSuccess(matched);
      } else {
        // Create user session dynamically
        const customUser: UserSession = {
          username: username.trim(),
          name: username.includes('.') ? username.replace('.', ' ') : `User ${username}`,
          accountNumber: `VXK-${Math.floor(1000 + Math.random() * 9000)}`,
          phone: '0820000000',
          idNumber: '9001015000080',
          email: `${username.trim().toLowerCase()}@vxktech.co.za`,
          role: username.toLowerCase().includes('tech') || username.toLowerCase().includes('admin') ? 'technician' : 'customer',
          lineSpeed: '10/5Mbps @R900pm',
          balanceDays: 30,
        };
        onLoginSuccess(customUser);
      }
    }, 400);
  };

  const handleSelectDemo = (acc: UserSession) => {
    setUsername(acc.username);
    setPassword('demoPass123!');
    setError(null);
  };

  return (
    <div
      style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      className={`border rounded-2xl p-6 sm:p-8 shadow-2xl ${isModal ? 'max-w-md w-full' : 'max-w-lg mx-auto'}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Customer & Staff Login</h2>
            <p className="text-xs text-slate-400">VXK TECH PREPAID INTERNET</p>
          </div>
        </div>
        {isModal && onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close login dialog"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drupal User Login Form */}
      <form onSubmit={handleSubmit} id="user-login" className="space-y-4">
        <div>
          <label
            htmlFor="edit-name"
            className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5"
          >
            Username <span className="text-red-400" title="This field is required.">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="edit-name"
              name="name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sipho.khumalo or account ID"
              style={{ backgroundColor: '#060606' }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Enter your VXK TECH PREPAID INTERNET username or registered mobile.
          </p>
        </div>

        <div>
          <label
            htmlFor="edit-pass"
            className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5"
          >
            Password <span className="text-red-400" title="This field is required.">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              id="edit-pass"
              name="pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ backgroundColor: '#060606' }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Enter the password that accompanies your username.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            id="edit-submit"
            disabled={isLoading}
            style={{ backgroundColor: '#00ff3e', color: '#000000' }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition transform active:scale-98 disabled:opacity-50 hover:brightness-110"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Demo Accounts Selection */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Select Demo Account to Test:
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Instant Auth</span>
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = username === acc.username;
            return (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">{acc.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-cyan-400">{acc.accountNumber}</span>
                    <span>•</span>
                    <span className="capitalize">{acc.role}</span>
                  </div>
                </div>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                    Fill
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Need a prepaid internet account or voucher?{' '}
          <span className="text-cyan-400">Contact NOC Support or WhatsApp 082 000 0000</span>
        </p>
      </div>
    </div>
  );
};
