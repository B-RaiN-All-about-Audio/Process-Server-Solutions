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
  const [role, setRole] = useState<UserRole>('process_server');
  const [organizationName, setOrganizationName] = useState('');
  const [companyMotto, setCompanyMotto] = useState('');
  const [billingPoBox, setBillingPoBox] = useState('');
  const [billingCityStateZip, setBillingCityStateZip] = useState('');
  const [showBillingCustomization, setShowBillingCustomization] = useState(false);
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [coverageArea, setCoverageArea] = useState('Los Angeles County');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoSignIn = async (demoType: 'lejeune' | 'vance' | 'client') => {
    setLoading(true);
    setErrorMsg(null);
    
    let demoProfile: UserProfile;
    let demoEmail = '';
    let demoPass = 'DemoPass2026!';

    if (demoType === 'lejeune') {
      demoEmail = 'robert.lejeune@lejeuneprocess.com';
      demoProfile = {
        userId: 'demo-server-lejeune',
        email: demoEmail,
        fullName: 'Robert Lejeune',
        role: 'process_server',
        organizationName: 'Lejeune Civil Process',
        companyMotto: 'Put the Papers in Our Hands So We Can Put the Papers in Theirs',
        billingPoBox: 'PO Box 12301',
        billingCityStateZip: 'Jacksonville, NC 28546',
        phone: '(910) 555-4920',
        badgeNumber: 'NC-3012',
        coverageArea: 'Onslow County & Coastal District',
        subscriptionPlan: 'professional',
        createdAt: new Date().toISOString(),
      };
    } else if (demoType === 'vance') {
      demoEmail = 'marcus.vance@vanceserves.com';
      demoProfile = {
        userId: 'demo-server-01',
        email: demoEmail,
        fullName: 'Marcus Vance',
        role: 'process_server',
        organizationName: 'Vance Registered Legal Process Servers',
        companyMotto: 'Diligent Field Execution & Court Affidavits',
        billingPoBox: 'PO Box 4502',
        billingCityStateZip: 'Los Angeles, CA 90012',
        phone: '(310) 555-7291',
        badgeNumber: 'LA-4991',
        coverageArea: 'Southern California District',
        subscriptionPlan: 'professional',
        createdAt: new Date().toISOString(),
      };
    } else {
      demoEmail = 'sarah.jenkins@sterlinglit.com';
      demoProfile = {
        userId: 'demo-client-01',
        email: demoEmail,
        fullName: 'Sarah Jenkins, Esq.',
        role: 'client',
        organizationName: 'Jenkins & Sterling Litigation LLP',
        companyMotto: 'Excellence in Civil Trial & Commercial Litigation',
        billingPoBox: 'Suite 1800, 777 Tower Blvd',
        billingCityStateZip: 'Los Angeles, CA 90017',
        phone: '(213) 555-8830',
        subscriptionPlan: 'professional',
        createdAt: new Date().toISOString(),
      };
    }

    try {
      // Attempt Firebase Email/Password credential for demo if available
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
            // Proceed with local profile
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

      setSuccessMsg(`Signed in as ${demoProfile.organizationName}! Invoices will display this title.`);
      setTimeout(() => {
        onUserAuthenticated(demoProfile);
        onClose();
      }, 500);
    } catch (err: any) {
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
          organizationName: organizationName.trim() || (role === 'client' ? 'Legal Associates LLP' : 'Civil Process Agency'),
          companyMotto: companyMotto.trim() || undefined,
          billingPoBox: billingPoBox.trim() || undefined,
          billingCityStateZip: billingCityStateZip.trim() || undefined,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-700/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
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
              isSignUp ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up & Save Profile
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition ${
              !isSignUp ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Existing User Sign In
          </button>
        </div>

        {/* Quick Demo Logins */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
              ⚡ 1-Click Evaluation Sign In (Sets Invoice Title)
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Auto-brands invoices</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('lejeune')}
              disabled={loading}
              className="px-2.5 py-2 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-300 text-xs font-bold flex flex-col items-start shadow-2xs transition"
            >
              <div className="flex items-center gap-1.5 w-full justify-between">
                <span className="text-emerald-700 font-bold truncate">Lejeune Civil Process</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">Server</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5">Robert Lejeune (Owner)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('vance')}
              disabled={loading}
              className="px-2.5 py-2 bg-white hover:bg-amber-50 text-amber-950 rounded-xl border border-amber-300 text-xs font-bold flex flex-col items-start shadow-2xs transition"
            >
              <div className="flex items-center gap-1.5 w-full justify-between">
                <span className="text-amber-800 font-bold truncate">Vance Legal Servers</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">Server</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5">Marcus Vance</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('client')}
              disabled={loading}
              className="px-2.5 py-2 bg-white hover:bg-blue-50 text-blue-950 rounded-xl border border-blue-300 text-xs font-bold flex flex-col items-start shadow-2xs transition"
            >
              <div className="flex items-center gap-1.5 w-full justify-between">
                <span className="text-blue-700 font-bold truncate">Jenkins & Sterling</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">Law Firm</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5">Sarah Jenkins, Esq.</span>
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
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
                  Select Your Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                      <span>Process Serving Company</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Process server agencies creating and issuing branded service invoices
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === 'client'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 text-blue-950'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>Law Firm / Client</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Attorneys, litigation counsel & corporate legal ordering service
                    </p>
                  </button>
                </div>
              </div>

              {/* Full Name & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {role === 'client' ? 'Attorney / Contact Name *' : 'Owner / Server Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'client' ? 'e.g. Rachel Thorne, Esq.' : 'e.g. Robert Lejeune'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'client' ? 'e.g. Thorne & Bay Law LLC' : 'e.g. Lejeune Civil Process'}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-blue-600 mt-0.5 block font-medium">
                    ✦ This company title prints at the top of all your service invoices.
                  </span>
                </div>
              </div>

              {/* Collapsible Invoice Header Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <button
                  type="button"
                  onClick={() => setShowBillingCustomization(!showBillingCustomization)}
                  className="w-full flex items-center justify-between text-left font-semibold text-slate-800"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Invoice Customization: Motto & Remit Address</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                  </span>
                  <span className="text-blue-600 text-xs">{showBillingCustomization ? 'Hide ▲' : 'Customize ▼'}</span>
                </button>

                {showBillingCustomization && (
                  <div className="pt-2 space-y-2.5 border-t border-slate-200">
                    <div>
                      <label className="text-slate-600 block mb-0.5 text-[11px]">
                        Company Motto / Tagline (under invoice title)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Put the Papers in Our Hands So We Can Put the Papers in Theirs"
                        value={companyMotto}
                        onChange={(e) => setCompanyMotto(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 block mb-0.5 text-[11px]">
                          Billing / Remit P.O. Box
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. PO Box 12301"
                          value={billingPoBox}
                          onChange={(e) => setBillingPoBox(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-0.5 text-[11px]">
                          City, State, Zip
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jacksonville, NC 28546"
                          value={billingCityStateZip}
                          onChange={(e) => setBillingCityStateZip(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Process server specific fields */}
              {role === 'process_server' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <div>
                    <label className="text-amber-950 font-semibold block mb-1">Badge / License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. NC-3012 or LA-4991"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-amber-950 font-semibold block mb-1">Coverage Area / County</label>
                    <input
                      type="text"
                      placeholder="e.g. Onslow County & Coastal NC"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
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
              <Database className="w-3.5 h-3.5 text-blue-600" />
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition disabled:opacity-50"
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
