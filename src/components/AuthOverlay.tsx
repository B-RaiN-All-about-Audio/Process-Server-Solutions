import React, { useState, useEffect } from 'react';
import { AccountSetupForm, UserAccountValues, createDefaultAccountValues } from './AccountSetupForm';
import { PACKAGES } from './MarketingPage';
import { BrandLogo } from './BrandLogo';

interface AuthOverlayProps {
  initialMode?: 'signin' | 'signup' | 'recover';
  initialPackageId?: string;
  onClose: () => void;
  onSignInSuccess: (user: any) => void;
  onSignUpSuccess: (user: any) => void;
  onFlash: (msg: string, isError?: boolean) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  initialMode = 'signin',
  initialPackageId = 'silver',
  onClose,
  onSignInSuccess,
  onSignUpSuccess,
  onFlash,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recover'>(initialMode);
  const [selectedPackage, setSelectedPackage] = useState<string>(initialPackageId || 'silver');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPackageId) {
      setSelectedPackage(initialPackageId);
    }
  }, [initialPackageId]);

  // Sign in state
  const [signInCreds, setSignInCreds] = useState({
    email: 'admin@processserve.demo',
    password: 'Passw0rd!',
  });

  // Sign up state
  const [signUpValues, setSignUpValues] = useState<UserAccountValues>(() =>
    createDefaultAccountValues({
      agency: 'Lejeune Civil Process', // Default reflecting user's company
      firstName: 'Brandon',
      lastName: 'Raynor',
      username: 'braynor',
      email: 'brandon@lejeuneprocess.com',
      role: 'agency_admin',
    })
  );

  // Recovery state
  const [recoverCreds, setRecoverCreds] = useState({
    email: '',
    code: '',
    password: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInCreds),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      onFlash('Signed in successfully.');
      onSignInSuccess(data.user);
    } catch (err: any) {
      onFlash(err.message || 'Sign in error', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signUpValues,
          subscriptionPlan: selectedPackage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trial account');
      const pkgName = PACKAGES.find((p) => p.id === selectedPackage)?.name || 'Silver';
      onFlash(`Trial account created (${pkgName} package). Company set to: ${signUpValues.agency}`);
      onSignUpSuccess(data.user);
    } catch (err: any) {
      onFlash(err.message || 'Sign up error', true);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    onFlash('Recovery codes are not wired in this preview API yet. Use demo sign-in: admin@processserve.demo / Passw0rd!', true);
    setMode('signin');
    setSignInCreds({
      email: recoverCreds.email || 'admin@processserve.demo',
      password: 'Passw0rd!',
    });
  };

  const fillDemoAccount = (roleType: 'admin' | 'server' | 'client') => {
    if (roleType === 'admin') {
      setSignInCreds({ email: 'admin@processserve.demo', password: 'Passw0rd!' });
      onFlash('Demo Admin (PS Company) filled. Click Sign In.');
    } else if (roleType === 'server') {
      setSignInCreds({ email: 'server@processserve.demo', password: 'Passw0rd!' });
      onFlash('Demo Process Server filled. Click Sign In.');
    } else {
      setSignInCreds({ email: 'client@processserve.demo', password: 'Passw0rd!' });
      onFlash('Demo Customer User filled. Click Sign In.');
    }
  };

  // FULLSCREEN SIGNUP (15-Day Free Trial)
  if (mode === 'signup') {
    return (
      <div
        id="auth-signup-fullscreen"
        className="fixed inset-0 z-50 overflow-y-auto bg-[#eaedf2] flex flex-col min-h-screen animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Start 15-Day Free Trial"
      >
        {/* Sticky Fullscreen Topbar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo layout="banner" size="sm" onClick={onClose} />
            <div className="hidden sm:block h-5 w-px bg-slate-300" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                <svg className="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                15-Day Free Trial
              </span>
              <span className="text-xs text-slate-500 font-medium">No credit card required · Instant access</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              onClick={() => setMode('signin')}
            >
              Already registered? <span className="text-sky-600 underline font-bold">Sign In</span>
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
              onClick={onClose}
              title="Close and return to website"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
              <span>Exit</span>
            </button>
          </div>
        </header>

        {/* Fullscreen Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8">
          {/* Hero Callout Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-700/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Full Platform Trial
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Start Your 15-Day Free Trial
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Get full enterprise access for 15 days — live order tracking, GPS field logs, eSignature affidavits, and automatic client invoicing. No credit card or payment information needed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs shrink-0">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <div className="font-bold text-sky-300">✓ 15 Days Free</div>
                  <div className="text-slate-300 mt-0.5">Full feature suite</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <div className="font-bold text-sky-300">✓ No Credit Card</div>
                  <div className="text-slate-300 mt-0.5">Zero payment info</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <div className="font-bold text-sky-300">✓ Court Affidavits</div>
                  <div className="text-slate-300 mt-0.5">eSignatures built in</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <div className="font-bold text-sky-300">✓ Instant Live</div>
                  <div className="text-slate-300 mt-0.5">Start serving today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Package Selection Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold">1</span>
                  Select Subscription Tier (Included Free for 15 Days)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the volume level that best fits your agency. All tiers include full access during your trial.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-600">Selected: <b className="text-sky-600 uppercase">{PACKAGES.find(p => p.id === selectedPackage)?.name || selectedPackage}</b></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`text-left rounded-xl p-4 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    {pkg.featured && (
                      <span className="absolute -top-2.5 right-3 bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 text-base">{pkg.name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mb-2">{pkg.volume}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mt-2">
                      <span className="text-sm font-extrabold text-slate-900">{pkg.price}</span>
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded">15 Days Free</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Full Uniformed Account Setup Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold">2</span>
              <h2 className="text-lg font-bold text-slate-900">
                Enter Account, Agency & Service Credentials
              </h2>
            </div>

            <AccountSetupForm
              value={signUpValues}
              onChange={setSignUpValues}
              mode="signup"
              submitLabel={loading ? 'Creating trial account…' : 'Start 15-Day Free Trial →'}
              onSubmit={handleSignUp}
              loading={loading}
              showPassword={true}
              onCancel={onClose}
              cancelLabel="Exit to Website"
            />
          </div>

          {/* Bottom Security Assurance */}
          <div className="text-center text-xs text-slate-500 py-4 flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-400">
              <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>Passwords are securely salted and hashed. 100% secure connection · No credit card required.</span>
          </div>
        </main>
      </div>
    );
  }

  // SIGN IN & RECOVERY MODAL
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Account Login"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo layout="banner" size="sm" />
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* 15-Day Free Trial Switch Banner */}
        <div className="bg-sky-50 border-b border-sky-100 p-3.5 flex items-center justify-between text-xs text-sky-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Need an account? Try free for 15 days.</span>
          </div>
          <button
            type="button"
            className="font-bold text-sky-700 hover:text-sky-800 underline cursor-pointer"
            onClick={() => setMode('signup')}
          >
            Start Free Trial →
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === 'signin' && (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
                <p className="text-xs text-slate-500 mt-1">Access your process serving workspace and field operations.</p>
              </div>

              {/* Demo Credentials Quick-Fill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>Demo Roles (Click to fill):</span>
                  <code className="text-slate-500">Passw0rd!</code>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sky-700 font-semibold text-[11px] transition shadow-xs cursor-pointer"
                    onClick={() => fillDemoAccount('admin')}
                  >
                    PS Agency
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sky-700 font-semibold text-[11px] transition shadow-xs cursor-pointer"
                    onClick={() => fillDemoAccount('server')}
                  >
                    Server
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-sky-700 font-semibold text-[11px] transition shadow-xs cursor-pointer"
                    onClick={() => fillDemoAccount('client')}
                  >
                    Client
                  </button>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="username"
                    value={signInCreds.email}
                    onChange={(e) => setSignInCreds((c) => ({ ...c, email: e.target.value }))}
                    required
                    placeholder="you@company.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                      onClick={() => setMode('recover')}
                    >
                      Recovery code?
                    </button>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={signInCreds.password}
                    onChange={(e) => setSignInCreds((c) => ({ ...c, password: e.target.value }))}
                    required
                    placeholder="Enter password"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Signing in…' : 'Sign in to Workspace →'}
                </button>
              </form>
            </>
          )}

          {mode === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Account Recovery</h2>
                <p className="text-xs text-slate-500 mt-1">Use a saved recovery code to reset your login.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={recoverCreds.email}
                  onChange={(e) => setRecoverCreds((c) => ({ ...c, email: e.target.value }))}
                  required
                  placeholder="you@company.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  One-Time Recovery Code
                </label>
                <input
                  type="text"
                  value={recoverCreds.code}
                  onChange={(e) => setRecoverCreds((c) => ({ ...c, code: e.target.value }))}
                  required
                  placeholder="e.g. REC-9921-X8"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={recoverCreds.password}
                  onChange={(e) => setRecoverCreds((c) => ({ ...c, password: e.target.value }))}
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Reset Password
              </button>

              <button
                type="button"
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 text-center py-1 cursor-pointer"
                onClick={() => setMode('signin')}
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
              onClick={() => setMode('signup')}
            >
              Don't have an account? Start 15-Day Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
