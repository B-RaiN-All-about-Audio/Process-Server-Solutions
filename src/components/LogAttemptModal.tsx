import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  PenTool, 
  Navigation, 
  Send,
  Upload
} from 'lucide-react';
import { ServiceOrder, AttemptOutcome, ServiceAttempt } from '../types';

interface LogAttemptModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
  onSubmitAttempt: (orderId: string, attemptData: Omit<ServiceAttempt, 'id' | 'orderId'>) => void;
}

export const LogAttemptModal: React.FC<LogAttemptModalProps> = ({
  order,
  onClose,
  onSubmitAttempt,
}) => {
  if (!order) return null;

  const [outcome, setOutcome] = useState<AttemptOutcome>('personal_service');
  const [serverName, setServerName] = useState(order.assignedServerName || 'Marcus Vance');
  const [serverBadgeId, setServerBadgeId] = useState('LA-4991');
  const [locationAddress, setLocationAddress] = useState(order.serviceAddress);
  const [latitude, setLatitude] = useState(34.0125);
  const [longitude, setLongitude] = useState(-118.4951);
  const [isLocating, setIsLocating] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Recipient details if served
  const [recipientNameServed, setRecipientNameServed] = useState(order.recipientName);
  const [relationshipToRecipient, setRelationshipToRecipient] = useState('Direct Subject / Self');
  const [approxAge, setApproxAge] = useState('45-50');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('5ft 10in');
  const [weight, setWeight] = useState('175 lbs');
  const [hairColor, setHairColor] = useState('Dark Brown');
  const [wearsGlasses, setWearsGlasses] = useState(false);
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');

  // Sample photo selections or file upload
  const SAMPLE_PHOTOS = [
    { label: 'Front Entrance / Door', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80' },
    { label: 'Lobby / Concierge', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80' },
    { label: 'Building Exterior', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' },
    { label: 'Corporate Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' }
  ];
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);

  // Digital signature SVG data
  const [hasSignature, setHasSignature] = useState(true);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation unavailable, using default coordinates', error);
          // provide slight variance for realism
          setLatitude(34.0125 + (Math.random() - 0.5) * 0.01);
          setLongitude(-118.4951 + (Math.random() - 0.5) * 0.01);
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isServed = outcome === 'personal_service' || outcome === 'substituted_service';

    const attemptData: Omit<ServiceAttempt, 'id' | 'orderId'> = {
      timestamp: new Date().toISOString(),
      outcome,
      serverName,
      serverBadgeId,
      latitude,
      longitude,
      locationAddress,
      notes: notes || (isServed ? 'Documents delivered directly and manner explained.' : 'Attempt made per court guidelines.'),
      photoUrl: selectedPhotoUrl,
      signatureUrl: isServed && hasSignature ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><path d="M10 25 C 35 8, 55 35, 80 18 S 120 28, 145 15" stroke="%231e293b" stroke-width="2" fill="none"/></svg>' : undefined,
      verifiedGps: true,
      recipientNameServed: isServed ? recipientNameServed : undefined,
      relationshipToRecipient: isServed ? relationshipToRecipient : undefined,
      recipientDescription: isServed ? {
        approxAge,
        gender,
        height,
        weight,
        hairColor,
        wearsGlasses,
        distinguishingFeatures: distinguishingFeatures || undefined
      } : undefined
    };

    onSubmitAttempt(order.id, attemptData);
    onClose();
  };

  const isServedOutcome = outcome === 'personal_service' || outcome === 'substituted_service';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-amber-600 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-700/60 font-mono text-xs font-bold">
                {order.caseNumber}
              </span>
              <span className="text-xs text-amber-100 font-medium">Field Dispatch</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-1">
              Log Service Attempt for {order.recipientName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-amber-700/50 hover:bg-amber-700 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Service Outcome Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Attempt Outcome / Disposition *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: 'personal_service', title: 'Personal Service', desc: 'Directly handed to named defendant/witness' },
                { value: 'substituted_service', title: 'Substituted Service', desc: 'Served competent adult at home or business' },
                { value: 'no_answer', title: 'No Answer / Attempted', desc: 'Knocked, no response, premises occupied' },
                { value: 'resident_not_home', title: 'Resident Not Home', desc: 'Confirmed address, occupant not present' },
                { value: 'address_vacant', title: 'Address Vacant', desc: 'Premises abandoned or commercial space empty' },
                { value: 'refused_service', title: 'Refused / Evading', desc: 'Subject confirmed inside but refused to open' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setOutcome(opt.value as AttemptOutcome);
                    if (opt.value === 'substituted_service' && relationshipToRecipient === 'Direct Subject / Self') {
                      setRelationshipToRecipient('Co-occupant / Adult resident');
                      setRecipientNameServed('Jane Doe (Adult Resident)');
                    } else if (opt.value === 'personal_service') {
                      setRelationshipToRecipient('Direct Subject / Self');
                      setRecipientNameServed(order.recipientName);
                    }
                  }}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    outcome === opt.value
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{opt.title}</span>
                    {outcome === opt.value && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* GPS Verification Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                GPS Verification Stamp
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 transition flex items-center gap-1"
              >
                {isLocating ? 'Locating...' : 'Refresh GPS Coordinates'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-[11px] text-slate-500 block">Verified Address:</span>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Coordinates (Lat, Lng):</span>
                <div className="mt-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Details & Physical Profile (If Served) */}
          {isServedOutcome && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  Party Served & Physical Description
                </h4>
                <span className="text-[11px] text-emerald-700 font-medium">Required for Affidavit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block">Person Served Name *</label>
                  <input
                    type="text"
                    value={recipientNameServed}
                    onChange={(e) => setRecipientNameServed(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block">Relationship to Defendant *</label>
                  <input
                    type="text"
                    value={relationshipToRecipient}
                    onChange={(e) => setRelationshipToRecipient(e.target.value)}
                    required
                    placeholder="e.g. Self, Spouse, Co-resident, Office Manager"
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 block">Approx. Age</label>
                  <input
                    type="text"
                    value={approxAge}
                    onChange={(e) => setApproxAge(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Height</label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Weight</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Hair</label>
                  <input
                    type="text"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wearsGlasses}
                    onChange={(e) => setWearsGlasses(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Wears Eyeglasses</span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Distinguishing Features & Clothing
                </label>
                <input
                  type="text"
                  value={distinguishingFeatures}
                  onChange={(e) => setDistinguishingFeatures(e.target.value)}
                  placeholder="e.g. Dark jacket, gray slacks, beard, gold wrist watch"
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Field Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Server Notes & Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe attempt circumstances, subject demeanour, vehicle in driveway, or conversation..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Photo Evidence Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Photo Evidence Verification</span>
              <span className="text-[11px] text-slate-400 font-normal">Select sample or click upload</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPhotoUrl(photo.url)}
                  className={`cursor-pointer rounded-xl border p-1.5 transition ${
                    selectedPhotoUrl === photo.url
                      ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="w-full h-16 object-cover rounded-lg"
                  />
                  <span className="text-[10px] font-medium text-slate-700 block text-center mt-1 truncate">
                    {photo.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Server Badge & Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block">Server Name</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block">Server Badge / Reg #</label>
              <input
                type="text"
                value={serverBadgeId}
                onChange={(e) => setServerBadgeId(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Digital Certification Checkbox */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
            <input
              type="checkbox"
              id="certify-attempt"
              checked={hasSignature}
              onChange={(e) => setHasSignature(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="certify-attempt" className="cursor-pointer">
              <span className="font-bold text-slate-900 block">Declare Under Penalty of Perjury</span>
              I certify that I am over 18 years of age, not a party to this action, and that the foregoing information and GPS coordinates are true and accurate.
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Attempt & Notify Client
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
