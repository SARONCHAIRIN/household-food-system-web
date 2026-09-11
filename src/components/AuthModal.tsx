import React, { useState } from 'react';
import { api } from '../api/client';
import { ApiUser } from '../api/types';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: ApiUser) => void;
  forced?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  forced = false,
}) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'USER'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  if (!isOpen) return null;

  const handleSwitchToLogin = () => {
    setMode('login');
    setError(null);
    setIsDuplicate(false);
  };

  const handleSuggestAlternative = () => {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const base = username.trim().replace(/\d+$/, '') || 'member';
    const newUsername = `${base}${randomSuffix}`;
    setUsername(newUsername);
    setEmail(`${newUsername}@household.com`);
    setError(null);
    setIsDuplicate(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError(
        language === 'km'
          ? 'សូមបញ្ចូលទាំងឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់'
          : 'Please enter both username and password'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ផ្ទៀងផ្ទាត់ទិន្នន័យជាមួយ Backend API ផ្ទាល់
      await api.auth.login({ username: cleanUsername, password: cleanPassword });
      const members = await api.members.getAll();
      const current = Array.isArray(members)
        ? members.find((m) => m.username.toLowerCase() === cleanUsername.toLowerCase())
        : undefined;

      const user: ApiUser = current || {
        id: '1',
        name: cleanUsername,
        username: cleanUsername,
        email: `${cleanUsername}@household.com`,
        role: cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'USER',
        status: 'ACTIVE',
      };

      onAuthSuccess(user);
      if (onClose) onClose();
    } catch (err: any) {
      console.warn('Login attempt failed:', err?.message || err);
      setError(
        err.message ||
          (language === 'km'
            ? 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្តងទៀត។'
            : 'Invalid credentials. Please check your username and password.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError(
        language === 'km'
          ? 'សូមបំពេញគ្រប់ប្រអប់សម្រាប់ចុះឈ្មោះ'
          : 'Please fill in all registration fields'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsDuplicate(false);

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
      console.warn('Registration validation result:', err?.message || err);
      const isAlreadyExists = /already exists|already registered|exists|duplicate/i.test(
        err?.message || ''
      );
      if (isAlreadyExists) {
        setIsDuplicate(true);
        setError(
          language === 'km'
            ? `ឈ្មោះអ្នកប្រើប្រាស់ "${username.trim()}" ឬអ៊ីមែលនេះមានគណនីរួចហើយ។`
            : `Username "${username.trim()}" or email is already registered.`
        );
      } else {
        setIsDuplicate(false);
        setError(
          err.message ||
            (language === 'km'
              ? 'ការចុះឈ្មោះមិនបានជោគជ័យទេ។ សូមពិនិត្យព័ត៌មានម្តងទៀត។'
              : 'Registration failed. Please check your information and try again.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high relative max-h-[95vh] overflow-y-auto">
        {!forced && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high/40">
          <div className="w-10 h-10 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {mode === 'login'
                ? language === 'km'
                  ? 'ចូលគណនី Household Food'
                  : 'Apartment 4B Login'
                : language === 'km'
                ? 'បង្កើតគណនីសមាជិកថ្មី'
                : 'Create Member Account'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Household Food System • {language === 'km' ? 'ប្រព័ន្ធតភ្ជាប់ API' : 'Connected API'}
            </p>
          </div>
        </div>

        <div className="flex bg-surface-container rounded-xl p-1 mt-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setIsDuplicate(false);
            }}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              mode === 'login'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.common.signIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setIsDuplicate(false);
            }}
            className={`flex-1 py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              mode === 'register'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.common.register}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-error-container/20 border border-error/20 text-on-surface text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-error font-medium">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
            {isDuplicate && mode === 'register' && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-error/10">
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">login</span>
                  <span>
                    {language === 'km'
                      ? `ចូលគណនីជា "${username.trim()}"`
                      : `Sign in as "${username.trim()}"`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleSuggestAlternative}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                  <span>
                    {language === 'km' ? 'ប្តូរឈ្មោះអ្នកប្រើថ្មី' : 'Suggest alternative'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3.5">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                {language === 'km' ? 'ឈ្មោះអ្នកប្រើប្រាស់' : 'Username'}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  required
                  placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះអ្នកប្រើប្រាស់' : 'Enter your username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
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
              className="w-full mt-2 h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <>
                  <span>
                    {language === 'km' ? 'ចូលប្រើប្រាស់ Household Food' : 'Sign In to Apartment 4B'}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                {language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}
              </label>
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
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  {language === 'km' ? 'ឈ្មោះអ្នកប្រើប្រាស់' : 'Username'}
                </label>
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
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  {language === 'km' ? 'តួនាទី' : 'Role'}
                </label>
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
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                {language === 'km' ? 'អ៊ីមែល' : 'Email'}
              </label>
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
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <>
                  <span>{language === 'km' ? 'បង្កើតគណនី' : 'Create Account'}</span>
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