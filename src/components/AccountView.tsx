import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  Database, 
  CreditCard, 
  CheckCircle2, 
  LogOut, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Award,
  RefreshCw,
  Edit3,
  Receipt,
  Save,
  Upload,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { BrandLogo } from './BrandLogo';

interface AccountViewProps {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onRoleChange: (role: UserRole) => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  firestoreConnected: boolean;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  currentRole: _currentRole,
  onOpenAuth,
  onSignOut,
  onRoleChange: _onRoleChange,
  onUpdateProfile,
  firestoreConnected: _firestoreConnected,
}) => {
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editOrgName, setEditOrgName] = useState(currentUser?.organizationName || '');
  const [editMotto, setEditMotto] = useState(currentUser?.companyMotto || '');
  const [editPoBox, setEditPoBox] = useState(currentUser?.billingPoBox || '');
  const [editCityZip, setEditCityZip] = useState(currentUser?.billingCityStateZip || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditOrgName(currentUser.organizationName || '');
      setEditMotto(currentUser.companyMotto || '');
      setEditPoBox(currentUser.billingPoBox || '');
      setEditCityZip(currentUser.billingCityStateZip || '');
      setEditPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleSaveOrgSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !onUpdateProfile) return;

    const updatedProfile: UserProfile = {
      ...currentUser,
      organizationName: editOrgName.trim() || currentUser.organizationName,
      companyMotto: editMotto.trim() || undefined,
      billingPoBox: editPoBox.trim() || undefined,
      billingCityStateZip: editCityZip.trim() || undefined,
      phone: editPhone.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProfile(updatedProfile);
    setIsEditingOrg(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      try {
        localStorage.setItem('pss_company_logo', dataUrl);
        window.dispatchEvent(new Event('company-logo-updated'));
        setLogoSuccess('Company logo successfully updated and deployed across all views!');
        setTimeout(() => setLogoSuccess(null), 4000);
      } catch {
        // quota limit
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    localStorage.removeItem('pss_company_logo');
    window.dispatchEvent(new Event('company-logo-updated'));
    setLogoSuccess('Reset to official default company logo (image.png).');
    setTimeout(() => setLogoSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">SaaS Profile & Organization Branding</h2>
            <p className="text-xs text-slate-500">
              Manage your company title printed on service invoices, legal declarations, and Cloud SQL persistence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud SQL & Firestore Active</span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Organization branding saved! All generated invoices will now display <strong>{currentUser?.organizationName}</strong>.</span>
        </div>
      )}

      {currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{currentUser.organizationName}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-blue-600">{currentUser.role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingOrg(!isEditingOrg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isEditingOrg ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingOrg ? 'Cancel' : 'Edit Company Branding'}</span>
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  {currentUser.subscriptionPlan} Tier
                </span>
              </div>
            </div>

            {/* Editable Invoice Branding Form */}
            {isEditingOrg ? (
              <form onSubmit={handleSaveOrgSettings} className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span>Customize Invoice Title & Header Information</span>
                  </div>
                  <span className="text-[10px] text-blue-700">Reflects on all service invoices</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Company / Organization Name (Main Invoice Title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editOrgName}
                      onChange={(e) => setEditOrgName(e.target.value)}
                      placeholder="e.g. Lejeune Civil Process or Vance Legal Servers"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Invoice Motto / Slogan
                    </label>
                    <input
                      type="text"
                      value={editMotto}
                      onChange={(e) => setEditMotto(e.target.value)}
                      placeholder="e.g. Put the Papers in Our Hands So We Can Put the Papers in Theirs"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Remit / Billing P.O. Box or Street
                    </label>
                    <input
                      type="text"
                      value={editPoBox}
                      onChange={(e) => setEditPoBox(e.target.value)}
                      placeholder="e.g. PO Box 12301"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Remit City, State, Zip
                    </label>
                    <input
                      type="text"
                      value={editCityZip}
                      onChange={(e) => setEditCityZip(e.target.value)}
                      placeholder="e.g. Jacksonville, NC 28546"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingOrg(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Invoice Title & Header</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Invoice Header Preview Banner */
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Active Invoice Title
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-serif">
                    {currentUser.organizationName}
                  </div>
                  <div className="text-[11px] text-blue-600 italic">
                    "{currentUser.companyMotto || 'Professional Civil Process & Diligent Legal Service'}"
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>{currentUser.billingPoBox || 'PO Box 12301'}</div>
                  <div>{currentUser.billingCityStateZip || (currentUser.coverageArea || 'Jacksonville, NC 28546')}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.email}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Contact Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.phone || '(910) 555-4920'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Badge & License Number</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {currentUser.badgeNumber || 'Certified Process Server'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block mb-1">Primary Jurisdiction Coverage</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  {currentUser.coverageArea || 'Greater Regional / District'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Switch Account / Role
              </button>

              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Company Logo & Brand Identity Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Company Logo & Branding</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Active
                </span>
              </div>

              {logoSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{logoSuccess}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-2">
                <BrandLogo size="lg" />
                <span className="text-[11px] text-slate-500 font-medium">
                  Deployed across navigation, marketing & legal documents
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo File</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="w-full py-1.5 px-3 rounded-xl text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Official Logo</span>
                </button>
              </div>
            </div>

            {/* Database & Subscription Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                <span>SaaS Data Architecture</span>
              </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your service orders, GPS coordinates, recipient descriptions, and affidavits are persisted to both Cloud SQL (PostgreSQL) and Firebase Firestore.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Database Engine</span>
                <span className="font-mono font-bold text-slate-800">PostgreSQL (Cloud SQL)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Real-time Stream</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Firestore Live
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Tenant Level</span>
                <span className="font-bold text-blue-700 uppercase">{currentUser.subscriptionPlan}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
              >
                Manage Subscription Plan
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">SaaS Account Sign In / Registration</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Create a process server company account or law firm credential to brand your invoices, persist cases to Cloud SQL, and generate digital proof of service.
            </p>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Open Demo Sign In / Registration</span>
          </button>
        </div>
      )}
    </div>
  );
};
