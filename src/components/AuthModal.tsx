import React, { useState } from 'react';
import { api } from '../api/client';
import { ApiUser } from '../api/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: ApiUser) => void;
  forced?: boolean; // if true, user must log in to proceed
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  forced = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'USER'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUsername?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const u = customUsername || username;
    const p = customPassword || password;

    if (!u.trim() || !p.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.auth.login({ username: u.trim(), password: p.trim() });
      // Fetch members to find user details
      const members = await api.members.getAll();
      const current = members.find((m) => m.username.toLowerCase() === u.trim().toLowerCase());
      const user: ApiUser = current || {
        id: '2',
        name: u,
        username: u,
        email: `${u}@household.com`,
        role: u === 'admin' ? 'ADMIN' : 'MEMBER',
        status: 'ACTIVE',
      };
      onAuthSuccess(user);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all registration fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      });

      const user: ApiUser = {
        id: res.userId || res.id || '1',
        name: res.name || name.trim(),
        username: res.username || username.trim(),
        email: res.email || email.trim(),
        role: res.role || role,
        status: res.status || 'ACTIVE',
      };

      onAuthSuccess(user);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Registration failed. Username or email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high relative max-h-[95vh] overflow-y-auto">
        {/* Close button if not forced */}
        {!forced && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high/40">
          <div className="w-10 h-10 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {mode === 'login' ? 'Apartment 4B Login' : 'Create Member Account'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Household Food System • Connected API
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-surface-container rounded-xl p-1 mt-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              mode === 'login'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              mode === 'register'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error-container/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Preset Buttons */}
        {mode === 'login' && (
          <div className="mt-4 p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/60">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold block mb-2">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-primary-container/15 hover:bg-primary-container/25 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>Admin (admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('rin1', 'admin123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Member (rin1)</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3.5">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[18px]">
                  key
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Apartment 4B</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alexr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="alex@apartment4b.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
