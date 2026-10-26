import React, { useState, useRef } from 'react';

export interface UserAccountValues {
  id?: number | string;
  full_name?: string;
  fullName?: string;
  first_name?: string;
  last_name?: string;
  role: 'agency_admin' | 'process_server' | 'client' | string;
  paySheet: string;
  isProcessServer: 'Yes' | 'No' | string;
  licenseNumber: string;
  licenseExpDate: string;
  countyOfLicense: string;
  dateOfBirth: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
  customerName?: string;
  agency: string; // Agency / Company (e.g. "Lejeune Civil Process" - invoice title source)
  active: boolean | number;
  emailCcList: string;
  signatureDataUrl?: string;
  smtpEmail?: string;
  smtpDisplayName?: string;
  smtpUserName?: string;
  smtpPassword?: string;
  smtpServer?: string;
  smtpPort?: string;
  smtpUseSsl?: 'Yes' | 'No' | string;
  zipCodes: string[];
}

export const PAY_SHEETS = ['Standard Paysheet', 'Hourly Paysheet', 'Per Serve Paysheet'];

export function createDefaultAccountValues(initial?: Partial<UserAccountValues>): UserAccountValues {
  return {
    role: 'agency_admin',
    paySheet: 'Standard Paysheet',
    isProcessServer: 'Yes',
    licenseNumber: '',
    licenseExpDate: '',
    countyOfLicense: '',
    dateOfBirth: '',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    customerName: '',
    agency: 'Civil Process Agency',
    active: true,
    emailCcList: '',
    signatureDataUrl: '',
    smtpEmail: '',
    smtpDisplayName: '',
    smtpUserName: '',
    smtpPassword: '',
    smtpServer: '',
    smtpPort: '587',
    smtpUseSsl: 'No',
    zipCodes: ['28540', '28546'],
    ...initial,
  };
}

interface AccountSetupFormProps {
  value: UserAccountValues;
  onChange: (val: UserAccountValues) => void;
  mode: 'signup' | 'edit' | 'create';
  submitLabel: string;
  cancelLabel?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  showPassword?: boolean;
  showActive?: boolean;
  showCustomerName?: boolean;
}

export const AccountSetupForm: React.FC<AccountSetupFormProps> = ({
  value,
  onChange,
  mode,
  submitLabel,
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  loading = false,
  showPassword = false,
  showActive = false,
  showCustomerName = false,
}) => {
  const [zipInput, setZipInput] = useState('');
  const [sigWarning, setSigWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = value.role === 'agency_admin';
  const isProcessServerRole = value.role === 'process_server';
  const isClientRole = value.role === 'client';

  const update = (patch: Partial<UserAccountValues>) => {
    onChange({ ...value, ...patch });
  };

  const handleRoleChange = (newRole: string) => {
    if (newRole === 'agency_admin') {
      update({
        role: newRole,
        isProcessServer: value.isProcessServer || 'Yes',
        paySheet: value.paySheet || 'Standard Paysheet',
      });
    } else if (newRole === 'process_server') {
      update({
        role: newRole,
        isProcessServer: 'Yes',
      });
    } else if (newRole === 'client') {
      update({
        role: newRole,
        isProcessServer: 'No',
      });
    } else {
      update({ role: newRole });
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      setSigWarning(`Signature image is ${(file.size / 1024).toFixed(0)}KB — keep under ~200KB for profile storage.`);
    } else {
      setSigWarning('');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      update({ signatureDataUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const addZipCode = () => {
    const trimmed = zipInput.trim();
    if (!trimmed) return;
    if (value.zipCodes.includes(trimmed)) {
      setZipInput('');
      return;
    }
    update({ zipCodes: [...value.zipCodes, trimmed] });
    setZipInput('');
  };

  const removeZipCode = (zip: string) => {
    update({ zipCodes: value.zipCodes.filter((z) => z !== zip) });
  };

  const removeZipInput = () => {
    const trimmed = zipInput.trim();
    if (trimmed) {
      removeZipCode(trimmed);
      setZipInput('');
    }
  };

  return (
    <form className="w-full space-y-8" onSubmit={onSubmit}>
      {/* 1. Account Role Selection (Drives All Context Below) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Select Your System Role
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your operational role. Form data entry fields automatically adapt to show only what is appropriate for your account.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-fit">
            * Indicates Required Field
          </span>
        </div>

        {/* Visual Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: Full Administrator */}
          <button
            type="button"
            onClick={() => handleRoleChange('agency_admin')}
            className={`text-left rounded-xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
              isAdmin
                ? 'border-sky-600 bg-sky-50/60 shadow-md ring-2 ring-sky-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                  Full Administrator
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isAdmin ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isAdmin && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">PS Company Administrator</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manages agency operations, server dispatch, customer billing, and issues payments.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100/80 text-[11px] font-semibold text-sky-700 flex items-center gap-1.5">
              <span>✓ Pay Sheet Model Selection Enabled</span>
            </div>
          </button>

          {/* Option 2: Process Server (Field Operative) */}
          <button
            type="button"
            onClick={() => handleRoleChange('process_server')}
            className={`text-left rounded-xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
              isProcessServerRole
                ? 'border-sky-600 bg-sky-50/60 shadow-md ring-2 ring-sky-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Field Operative
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isProcessServerRole ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isProcessServerRole && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Process Server</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes court serves in the field, logs GPS attempt verification, and signs affidavits.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100/80 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Court Licensing &amp; Affidavit eSignature</span>
            </div>
          </button>

          {/* Option 3: Customer User (Client Portal) */}
          <button
            type="button"
            onClick={() => handleRoleChange('client')}
            className={`text-left rounded-xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
              isClientRole
                ? 'border-sky-600 bg-sky-50/60 shadow-md ring-2 ring-sky-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Client Portal
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isClientRole ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isClientRole && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Customer User (Client)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Law firms, attorneys, and corporate clients submitting court service requests and tracking status.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100/80 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Streamlined: Case intake &amp; proof download</span>
            </div>
          </button>
        </div>

        {/* Accessible dropdown fallback/sync */}
        <div className="pt-1">
          <label htmlFor="as-role" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            System Role Selection <span className="text-amber-600 font-bold">*</span>
          </label>
          <select
            id="as-role"
            value={value.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            required
            className="w-full sm:w-80 h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
          >
            <option value="agency_admin">PS Company (Full Administrator)</option>
            <option value="process_server">Process Server (Field Operative)</option>
            <option value="client">Customer User (Client Portal)</option>
          </select>
        </div>
      </section>

      {/* 2. Account Credentials & Company/Organization Profile */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {isAdmin && 'Agency & Administrator Profile'}
            {isProcessServerRole && 'Process Server Account Profile'}
            {isClientRole && 'Law Firm / Client Organization Profile'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin && 'Set up primary administrator login credentials and identify your process serving agency.'}
            {isProcessServerRole && 'Set up your field operative login credentials and serving company affiliation.'}
            {isClientRole && 'Set up client portal login credentials and identify your law firm or organization.'}
          </p>
        </div>

        {/* Agency / Company / Law Firm Name */}
        <div>
          <label htmlFor="as-agency" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {isAdmin && 'Agency / Process Serving Company Name'}
            {isProcessServerRole && 'Serving Company / Contractor Name'}
            {isClientRole && 'Law Firm / Company / Client Name'}
            <span className="text-amber-600 font-bold ml-1">*</span>
          </label>
          <input
            id="as-agency"
            value={value.agency}
            onChange={(e) => update({ agency: e.target.value })}
            required
            placeholder={
              isAdmin
                ? 'e.g. Lejeune Civil Process'
                : isProcessServerRole
                ? 'e.g. Lejeune Civil Process (or Independent Field Server)'
                : 'e.g. Morrison & Associates Law Firm, LLC'
            }
            className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
          />
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {isAdmin && 'This agency name prints dynamically on all court affidavits, client invoices, and service receipts.'}
            {isProcessServerRole && 'Identifies the process serving company or independent contractor record in the field system.'}
            {isClientRole && 'This organization name appears as the responsible client party on service intake orders and invoices.'}
          </p>
        </div>

        {/* Primary Contact & Login Fields in 3 Uniform Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label htmlFor="as-first" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name <span className="text-amber-600 font-bold">*</span>
            </label>
            <input
              id="as-first"
              value={value.firstName}
              onChange={(e) => update({ firstName: e.target.value })}
              required
              placeholder="First name"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="as-last" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <input
              id="as-last"
              value={value.lastName}
              onChange={(e) => update({ lastName: e.target.value })}
              placeholder="Last name"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="as-username" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              User Name <span className="text-amber-600 font-bold">*</span>
            </label>
            <input
              id="as-username"
              value={value.username}
              onChange={(e) => update({ username: e.target.value })}
              required
              autoComplete="username"
              placeholder="e.g. brandon95"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="as-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-amber-600 font-bold">*</span>
            </label>
            <input
              id="as-email"
              type="email"
              value={value.email}
              onChange={(e) => update({ email: e.target.value })}
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="as-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              id="as-phone"
              value={value.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="(___) ___-____"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
            />
          </div>

          {(showPassword || mode === 'signup' || mode === 'create') && (
            <div>
              <label htmlFor="as-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-amber-600 font-bold">*</span>
              </label>
              <input
                id="as-password"
                type="password"
                value={value.password || ''}
                onChange={(e) => update({ password: e.target.value })}
                required={mode === 'signup' || mode === 'create'}
                autoComplete="new-password"
                minLength={8}
                placeholder="Minimum 8 characters"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>
          )}

          {showCustomerName && (
            <div>
              <label htmlFor="as-customer" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Name
              </label>
              <input
                id="as-customer"
                value={value.customerName || ''}
                onChange={(e) => update({ customerName: e.target.value })}
                placeholder="For Customer User accounts"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>
          )}

          {showActive && (
            <div>
              <label htmlFor="as-active" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Active Status
              </label>
              <select
                id="as-active"
                value={value.active ? 'True' : 'False'}
                onChange={(e) => update({ active: e.target.value === 'True' })}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              >
                <option value="True">Active</option>
                <option value="False">Disabled</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 3. Role-Specific Operational Details */}
      {/* 3A: FULL ADMINISTRATOR (Includes Pay Sheet Model & Optional Field Serving) */}
      {isAdmin && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Administrator &amp; Dispatch Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure system access permissions, paysheet model for issuing payments, and court authorization credentials.
            </p>
          </div>

          {/* Pay Sheet Model: ONLY visible when signing up as Full Administrator */}
          <div className="p-5 rounded-xl bg-sky-50/70 border border-sky-200/90 max-w-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="as-paysheet" className="block text-xs font-bold text-sky-950 uppercase tracking-wider">
                Pay Sheet Model <span className="text-amber-600 font-bold">*</span>
              </label>
              <span className="text-[10px] font-bold text-sky-700 bg-white border border-sky-300 px-2.5 py-0.5 rounded-full">
                Full Administrator Only
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Select the compensation model your agency uses to issue payments to process servers and bill clients.
            </p>
            <select
              id="as-paysheet"
              value={value.paySheet}
              onChange={(e) => update({ paySheet: e.target.value })}
              required
              className="w-full sm:w-80 h-11 px-3.5 rounded-lg border border-sky-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-semibold transition shadow-xs"
            >
              {PAY_SHEETS.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>

          {/* Licensing & Demographics for field administration */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Court Authorization &amp; Licensing Credentials
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Required for field service delivery and signing official court affidavits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label htmlFor="as-license" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  License Number
                </label>
                <input
                  id="as-license"
                  value={value.licenseNumber}
                  onChange={(e) => update({ licenseNumber: e.target.value })}
                  placeholder="e.g. NC-PS-4821"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="as-county" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  County of License
                </label>
                <input
                  id="as-county"
                  value={value.countyOfLicense}
                  onChange={(e) => update({ countyOfLicense: e.target.value })}
                  placeholder="e.g. Onslow County"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="as-license-exp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  License Exp. Date
                </label>
                <input
                  id="as-license-exp"
                  type="date"
                  value={value.licenseExpDate}
                  onChange={(e) => update({ licenseExpDate: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="as-dob" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  id="as-dob"
                  type="date"
                  value={value.dateOfBirth}
                  onChange={(e) => update({ dateOfBirth: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3B: PROCESS SERVER (Field Operative - NO Pay Sheet Model!) */}
      {isProcessServerRole && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Process Server Court Licensing &amp; Authorization
              </h3>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                Field Operative Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your court-authorized process server credentials. These details print automatically on official affidavits and proofs of service.
            </p>
          </div>

          {/* Notice confirming pay sheet is managed by agency admin */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <svg className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Compensation &amp; Paysheets:</strong> Your pay rate and compensation model are administered directly by your agency administrator. You do not need to configure paysheets during registration.
            </p>
          </div>

          {/* Licensing & Demographics in 4 Uniform Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label htmlFor="as-license" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                License / Badge Number
              </label>
              <input
                id="as-license"
                value={value.licenseNumber}
                onChange={(e) => update({ licenseNumber: e.target.value })}
                placeholder="e.g. NC-PS-4821"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-county" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                County of License
              </label>
              <input
                id="as-county"
                value={value.countyOfLicense}
                onChange={(e) => update({ countyOfLicense: e.target.value })}
                placeholder="e.g. Onslow County"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-license-exp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                License Exp. Date
              </label>
              <input
                id="as-license-exp"
                type="date"
                value={value.licenseExpDate}
                onChange={(e) => update({ licenseExpDate: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-dob" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                id="as-dob"
                type="date"
                value={value.dateOfBirth}
                onChange={(e) => update({ dateOfBirth: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>
          </div>
        </section>
      )}

      {/* 3C: CUSTOMER USER (Client Portal - NO Pay Sheet Model, NO Process Server fields!) */}
      {isClientRole && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Client Portal &amp; Case Ordering Account
              </h3>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 w-fit">
                Client User Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Your account is streamlined for attorneys, legal departments, and individuals ordering process service.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Simplified Client Registration
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Process server licensing, paysheet models, and dispatch tools are handled by the serving agency. You only manage your service requests.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-xs shrink-0">
              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Standard Client Portal
            </span>
          </div>
        </section>
      )}

      {/* 4. Document Delivery, CC List & Affidavit Signature */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {isClientRole ? 'Case Notifications & Email CC List' : 'Document Delivery & eSignature'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isClientRole
              ? 'Configure email addresses that should automatically receive case status updates, GPS attempt alerts, and executed affidavits.'
              : 'Configure automated CC recipients and upload your electronic signature image for automated court affidavits.'}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${!isClientRole ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Email CC List */}
          <div>
            <label htmlFor="as-cc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email CC List {isClientRole ? '(for Case Updates)' : ''}
            </label>
            <textarea
              id="as-cc"
              rows={4}
              value={value.emailCcList}
              onChange={(e) => update({ emailCcList: e.target.value })}
              placeholder={
                isClientRole
                  ? 'e.g. paralegal@lawfirm.com, assistant@company.com'
                  : 'e.g. dispatch@agency.com, billing@agency.com'
              }
              className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs resize-y"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Separate multiple email addresses with commas. All listed recipients automatically receive job status updates.
            </p>
          </div>

          {/* Signature Upload: ONLY for Process Servers and Full Administrators (not clients) */}
          {!isClientRole && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Server Signature Image (for Court Affidavits)
              </span>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-48 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-xs shrink-0">
                  {value.signatureDataUrl ? (
                    <img
                      src={value.signatureDataUrl}
                      alt="Signature preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">No signature loaded</span>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <input
                    id="as-signature"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Choose Signature Image
                  </button>
                  <p className="text-[11px] text-slate-500">
                    PNG or JPG transparent background recommended (under 200KB).
                  </p>
                  {sigWarning && <p className="text-xs text-amber-700 font-medium">{sigWarning}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Outgoing Email / SMTP Dispatch Settings (Optional - Full Admin Only) */}
      {isAdmin && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email Account Settings (Optional)
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 w-fit">
                Agency Custom SMTP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Process Servers Solution handles automated emailing by default. Fill in SMTP settings only if you wish notifications to route through your agency's custom mail domain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label htmlFor="as-smtp-server" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Outgoing Mail Server (SMTP)
              </label>
              <input
                id="as-smtp-server"
                value={value.smtpServer || ''}
                onChange={(e) => update({ smtpServer: e.target.value })}
                placeholder="e.g. smtp.office365.com"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-smtp-port" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Port
              </label>
              <input
                id="as-smtp-port"
                value={value.smtpPort || ''}
                onChange={(e) => update({ smtpPort: e.target.value })}
                placeholder="587"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-smtp-ssl" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Use SSL / TLS
              </label>
              <select
                id="as-smtp-ssl"
                value={value.smtpUseSsl || 'No'}
                onChange={(e) => update({ smtpUseSsl: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              >
                <option value="No">No (STARTTLS / Standard)</option>
                <option value="Yes">Yes (Direct SSL)</option>
              </select>
            </div>

            <div>
              <label htmlFor="as-smtp-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                SMTP Sender Email
              </label>
              <input
                id="as-smtp-email"
                type="email"
                value={value.smtpEmail || ''}
                onChange={(e) => update({ smtpEmail: e.target.value })}
                placeholder="e.g. notifications@company.com"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-smtp-display" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sender Display Name
              </label>
              <input
                id="as-smtp-display"
                value={value.smtpDisplayName || ''}
                onChange={(e) => update({ smtpDisplayName: e.target.value })}
                placeholder="e.g. Civil Process Dispatch"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-smtp-user" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                SMTP Username
              </label>
              <input
                id="as-smtp-user"
                value={value.smtpUserName || ''}
                onChange={(e) => update({ smtpUserName: e.target.value })}
                placeholder="SMTP account username"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="as-smtp-pass" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                SMTP Password
              </label>
              <input
                id="as-smtp-pass"
                type="password"
                value={value.smtpPassword || ''}
                onChange={(e) => update({ smtpPassword: e.target.value })}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>
          </div>
        </section>
      )}

      {/* 6. Service Coverage Zip Codes (Only for Agency Admins & Field Process Servers) */}
      {!isClientRole && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {isAdmin ? 'Agency Service Territory & Coverage Zip Codes' : 'Field Service Territory & Coverage Zip Codes'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Add postal codes your agency covers to automate server matching and jurisdiction filtering.'
                : 'Add postal codes you actively cover in the field for job dispatching.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <input
                id="as-zip"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addZipCode();
                  }
                }}
                placeholder="e.g. 28540"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 text-sm font-medium transition shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={addZipCode}
              className="h-11 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Zip Code
            </button>
            {zipInput.trim() && (
              <button
                type="button"
                onClick={removeZipInput}
                className="h-11 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Active Coverage Territories ({value.zipCodes.length})
            </span>
            <div className="flex flex-wrap items-center gap-2 min-h-10 p-3 rounded-xl bg-slate-50 border border-slate-200">
              {value.zipCodes.map((z) => (
                <span
                  key={z}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold text-xs shadow-xs"
                >
                  <span>{z}</span>
                  <button
                    type="button"
                    onClick={() => removeZipCode(z)}
                    className="hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                    title="Remove this zip code"
                    aria-label={`Remove zip code ${z}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              {value.zipCodes.length === 0 && (
                <p className="text-xs text-slate-400 italic">No zip codes entered yet. Type a zip code above and click Add.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Form Submission Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            {isAdmin && '✓ 15-Day Free Trial: Full Agency Administration & Paysheet Control'}
            {isProcessServerRole && '✓ 15-Day Free Trial: Mobile Field Operative & Court Serving Suite'}
            {isClientRole && '✓ 15-Day Free Trial: Client Portal & Live Case Tracking'}
          </p>
          <p>No credit card required. Full operational access enabled upon submission.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Processing…</span>
              </>
            ) : (
              <>
                <span>{submitLabel}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
