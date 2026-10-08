import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { auth, saveUserProfileToDb, getUserProfileFromDb } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAuthenticated: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onUserAuthenticated,
}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [coverageArea, setCoverageArea] = useState('Los Angeles County');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoSignIn = async (demoRole: UserRole) => {
    setLoading(true);
    setErrorMsg(null);
    const isClient = demoRole === 'client';
    
    // Build the high-fidelity demo profile
    const demoProfile: UserProfile = {
      userId: isClient ? 'demo-client-01' : 'demo-server-01',
      email: isClient ? 'sarah.jenkins@sterlinglit.com' : 'marcus.vance@vanceserves.com',
      fullName: isClient ? 'Sarah Jenkins, Esq.' : 'Marcus Vance',
      role: demoRole,
      organizationName: isClient ? 'Jenkins & Sterling Litigation LLP' : 'Vance Registered Legal Process Servers',
      phone: isClient ? '(213) 555-8830' : '(310) 555-7291',
      badgeNumber: isClient ? undefined : 'LA-4991',
      coverageArea: isClient ? undefined : 'Southern California District',
      subscriptionPlan: 'professional',
      createdAt: new Date().toISOString(),
    };

    try {
      // Attempt Firebase Email/Password credential for demo if available
      const demoEmail = isClient ? 'demo.client@sterlinglit.com' : 'demo.server@vanceserves.com';
      const demoPass = 'DemoPass2026!';
      try {
        const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        if (cred?.user?.uid) {
          demoProfile.userId = cred.user.uid;
        }
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
            if (newCred?.user?.uid) {
              demoProfile.userId = newCred.user.uid;
            }
          } catch (createErr) {
            // Creation restricted by Firebase project config; proceed with local demo profile
          }
        }
      }

      // Persist profile to Firestore database
      saveUserProfileToDb(demoProfile).catch(() => {});

      // Sync profile to Cloud SQL backend
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoProfile),
      }).catch(() => {});

      setSuccessMsg(`Signed in as ${demoProfile.fullName} (${isClient ? 'Attorney / Client' : 'Process Server'})!`);
      setTimeout(() => {
        onUserAuthenticated(demoProfile);
        onClose();
      }, 500);
    } catch (err: any) {
      // Clean fallback
      onUserAuthenticated(demoProfile);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Persist comprehensive SaaS account profile to Firestore
        const newProfile: UserProfile = {
          userId: cred.user.uid,
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          organizationName: organizationName.trim() || (role === 'client' ? 'Legal Associates' : 'Process Serving Agency'),
          phone: phone.trim() || undefined,
          badgeNumber: role === 'process_server' ? (badgeNumber.trim() || 'REG-PENDING') : undefined,
          coverageArea: role === 'process_server' ? coverageArea.trim() : undefined,
          subscriptionPlan: plan,
          createdAt: new Date().toISOString(),
        };

        await saveUserProfileToDb(newProfile);

        // Sync to Cloud SQL
        fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile),
        }).catch(() => {});

        setSuccessMsg('Account created & profile saved to database!');
        setTimeout(() => {
          onUserAuthenticated(newProfile);
          onClose();
        }, 800);
      } else {
        // Sign In
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const existingProfile = await getUserProfileFromDb(cred.user.uid);
        
        if (existingProfile) {
          setSuccessMsg(`Welcome back, ${existingProfile.fullName}!`);
          setTimeout(() => {
            onUserAuthenticated(existingProfile);
            onClose();
          }, 600);
        } else {
          // Construct basic profile if none saved
          const fallbackProfile: UserProfile = {
            userId: cred.user.uid,
            email: cred.user.email || email,
            fullName: cred.user.displayName || email.split('@')[0],
            role: 'client',
            organizationName: 'Legal Associates',
            subscriptionPlan: 'starter',
            createdAt: new Date().toISOString(),
          };
          await saveUserProfileToDb(fallbackProfile);
          onUserAuthenticated(fallbackProfile);
          onClose();
        }
      }
    } catch (err: any) {
      console.warn('Auth notice:', err?.code || err?.message);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please try again or use 1-Click Demo accounts.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email auth is restricted by project console configuration. Please use 1-Click Demo accounts below.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isSignUp ? 'Create SaaS Account' : 'Sign In to Portal'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp 
                  ? 'Your profile & legal organization data is saved to Google Cloud Firestore' 
                  : 'Access your secure legal service orders & attempt logs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition ${
              isSignUp ? 'bg-white text-teal-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up & Save Profile
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition ${
              !isSignUp ? 'bg-white text-teal-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Existing User Sign In
          </button>
        </div>

        {/* Quick Demo Logins */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 space-y-2">
          <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">
            ⚡ Quick Evaluation Sign In (One-Click Firestore Profile)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('client')}
              disabled={loading}
              className="px-3 py-2 bg-white hover:bg-teal-100/70 text-teal-900 rounded-xl border border-teal-200 text-xs font-bold flex items-center justify-between shadow-2xs transition"
            >
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span>Sign In as Attorney</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('process_server')}
              disabled={loading}
              className="px-3 py-2 bg-white hover:bg-amber-100/70 text-amber-950 rounded-xl border border-amber-200 text-xs font-bold flex items-center justify-between shadow-2xs transition"
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Sign In as Process Server</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {isSignUp && (
            <>
              {/* Account Role Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-800 font-bold block uppercase tracking-wider text-[11px]">
                  Select Your SaaS Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === 'client'
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-950'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                      <span>Law Firm / Client</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Attorneys, paralegals, landlords ordering service of process
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('process_server')}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === 'process_server'
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 text-amber-950'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Process Server</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Registered field servers logging attempts & proof of service
                    </p>
                  </button>
                </div>
              </div>

              {/* Full Name & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {role === 'client' ? 'Attorney / Contact Name *' : 'Server Full Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'client' ? 'e.g. Rachel Thorne, Esq.' : 'e.g. Marcus Vance'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {role === 'client' ? 'Law Firm / Company Name *' : 'Process Serving Agency *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'client' ? 'e.g. Thorne & Bay Law LLC' : 'e.g. Vanguard Process Servers'}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Process server specific fields */}
              {role === 'process_server' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <div>
                    <label className="text-amber-950 font-semibold block mb-1">Badge / License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. LA-4991"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-amber-950 font-semibold block mb-1">Coverage Area / County</label>
                    <input
                      type="text"
                      placeholder="e.g. Los Angeles & Orange County"
                      value={coverageArea}
                      onChange={(e) => setCoverageArea(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email and Password */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {isSignUp && (
            /* SaaS Plan tier selection */
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <label className="text-slate-800 font-bold block uppercase tracking-wider text-[11px]">
                Subscription Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'starter', label: 'Starter', desc: 'Up to 25 orders/mo' },
                  { id: 'professional', label: 'Professional', desc: 'Unlimited + GPS proof' },
                  { id: 'enterprise', label: 'Enterprise', desc: 'Multi-seat + API dispatch' },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPlan(p.id as any)}
                    className={`p-2 rounded-xl border text-center transition ${
                      plan === p.id
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Persisted to Firestore</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Saving to Database...' : isSignUp ? 'Save SaaS Profile' : 'Sign In'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
