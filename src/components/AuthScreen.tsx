import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translateError } from '../locales/translations';

export const AuthScreen: React.FC = () => {
  const { login, register, language, setLanguage, theme, toggleTheme, t } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form State - empty clean defaults for production
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!username.trim() || !password) {
      setApiError(t.enterUsernamePassword);
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setApiError(t.fillAllFields);
      return;
    }
    setLoading(true);
    try {
      // Role is hardcoded to 'MEMBER' per production contract
      await register({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'MEMBER',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col">
        {/* Top Controls */}
        <div className="flex items-center justify-between w-full py-2 mb-3">
          <div className="inline-flex items-center p-1 bg-[var(--surface-container)] rounded-full shadow-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('km')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'km'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
              }`}
            >
              ខ្មែរ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-container-high)] rounded-full text-xs font-medium text-[var(--on-surface-variant)]">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
              <span>API Live</span>
            </span>
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[19px]">
                {theme === 'light' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-[var(--surface-container-lowest)] rounded-3xl shadow-xl overflow-hidden mb-5 border border-[var(--outline)]/10">
          <div className="relative flex flex-col items-center pt-8 pb-5 px-6 bg-gradient-to-b from-[var(--surface-container-low)] to-[var(--surface-container-lowest)] text-center">
            <div className="w-20 h-20 mb-3 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2 border border-black/5">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1WVIylQnD56T2_Oq0fZNL8MubrEY2Awppu4Rp9k2t8FdgRrp7MtJvPuSaC-Z9y5bVEFP54h3FXsA7FUjrzNmTbLhJC8pEj0BQsq8pwX48povC6n6T6b8OY9qgxKF3yLvRJN2BEeZmozusduiHjC3xeVyqIjBB-Lk7KKDAJwloqfOqjsv5AaBCo6ktlhaz_Rp2UORs4oqB2ZFIRTdWC1E-v5AN2Y8JpKO78jR0vOQzIYHd3WC2VtP9ukl8A"
                alt="Household Food Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">
              {t.appName}
            </h1>
            <span className="text-base font-bold text-[var(--primary)]">
              {language === 'km' ? t.appName : 'ផ្ទះបាយរួម'}
            </span>
            <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
              {t.liveApiAuth}
            </p>

            {/* Mode Switcher */}
            <div className="w-full mt-5 grid grid-cols-2 p-1 bg-[var(--surface-container)] rounded-full shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setApiError(null);
                }}
                className={`py-2 rounded-full text-xs font-bold transition-all ${
                  !isRegisterMode
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--on-surface-variant)]'
                }`}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setApiError(null);
                }}
                className={`py-2 rounded-full text-xs font-bold transition-all ${
                  isRegisterMode
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--on-surface-variant)]'
                }`}
              >
                {t.register}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div className="px-6 pt-2">
              <div className="flex items-start gap-2.5 p-3 bg-[var(--error-container)] text-[var(--on-error-container)] rounded-2xl border border-[var(--error)]/20">
                <span className="material-symbols-outlined text-[18px] text-[var(--error)] shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{t.apiError}</p>
                  <p className="text-xs opacity-90 mt-0.5 break-words">
                    {translateError(apiError, language)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="text-[var(--on-error-container)]/70 hover:text-[var(--on-error-container)]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Forms */}
          <div className="p-6 pt-4">
            {!isRegisterMode ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1.5 ml-1">
                    {t.usernameLabel}
                  </label>
                  <div className="relative flex items-center bg-[var(--surface-container)] rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-[var(--primary)]/40 transition-all">
                    <span className="material-symbols-outlined text-[20px] text-[var(--primary)] ml-3.5 mr-2 shrink-0">
                      person
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t.usernamePlaceholder}
                      className="w-full py-3 pr-4 bg-transparent text-sm text-[var(--on-surface)] focus:outline-none placeholder:text-[var(--outline)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1.5 ml-1">
                    {t.passwordLabel}
                  </label>
                  <div className="relative flex items-center bg-[var(--surface-container)] rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-[var(--primary)]/40 transition-all">
                    <span className="material-symbols-outlined text-[20px] text-[var(--primary)] ml-3.5 mr-2 shrink-0">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full py-3 pr-2 bg-transparent text-sm text-[var(--on-surface)] focus:outline-none placeholder:text-[var(--outline)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 mr-2 text-[var(--outline)] hover:text-[var(--on-surface)]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white rounded-full shadow-md font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      sync
                    </span>
                  ) : (
                    <>
                      <span>{t.signInButton}</span>
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 ml-1">
                    {t.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[var(--surface-container)] text-sm text-[var(--on-surface)] focus:outline-none shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 ml-1">
                    {t.usernameLabel}
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[var(--surface-container)] text-sm text-[var(--on-surface)] focus:outline-none shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 ml-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[var(--surface-container)] text-sm text-[var(--on-surface)] focus:outline-none shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 ml-1">
                    {t.passwordLabel}
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[var(--surface-container)] text-sm text-[var(--on-surface)] focus:outline-none shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-white rounded-full shadow-md font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      sync
                    </span>
                  ) : (
                    <>
                      <span>{t.createAccountButton}</span>
                      <span className="material-symbols-outlined text-[20px]">
                        check
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setApiError(null);
                }}
                className="text-xs font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
              >
                {!isRegisterMode ? (
                  <span>
                    {language === 'km' ? 'អ្នកស្នាក់នៅថ្មី? ' : 'New resident? '}
                    <strong className="text-[var(--primary)] underline font-bold">
                      {language === 'km' ? 'ចុះឈ្មោះគណនី' : 'Register an account'}
                    </strong>
                  </span>
                ) : (
                  <span>
                    {language === 'km' ? 'មានគណនីរួចហើយ? ' : 'Already registered? '}
                    <strong className="text-[var(--primary)] underline font-bold">
                      {language === 'km' ? 'ចូលគណនីទីនេះ' : 'Sign in here'}
                    </strong>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real API Status Footnote */}
        <div className="text-center text-[11px] text-[var(--outline)]">
          Base URL: https://household-food-system.onrender.com/api/v1
        </div>
      </div>
    </div>
  );
};
