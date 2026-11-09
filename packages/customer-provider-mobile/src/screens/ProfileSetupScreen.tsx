import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mobileApi } from '../api';
import { User, Mail, MapPin, Compass, Briefcase, ChevronRight, Sparkles } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: (role: 'CUSTOMER' | 'PROVIDER') => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutoDetectLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setCity('Mumbai'); // Default to target launch hub
          setLocating(false);
        },
        () => {
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError('Please provide your full name to complete setup');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await mobileApi.updateProfile({
        fullName,
        email: email || undefined,
        city,
        role: selectedRole,
      });
      await refreshProfile();
      onComplete(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Profile setup failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-50 animate-fadeIn">
      {/* Top Header */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2: Profile & Role Preference</span>
        </div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
          Welcome to Quick Appointments
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tell us how you would like to experience the pan-India appointment ecosystem.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 my-auto">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Pooja Verma"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. pooja@example.com"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">Primary City</label>
            <button
              type="button"
              onClick={handleAutoDetectLocation}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating...' : 'Auto-detect GPS'}</span>
            </button>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium bg-white"
            >
              <option value="Mumbai">Mumbai (Maharashtra)</option>
              <option value="Bengaluru">Bengaluru (Karnataka)</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Chennai">Chennai (Tamil Nadu)</option>
            </select>
          </div>
        </div>

        {/* How will you use Quick Appointments? */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            How will you use Quick Appointments?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => setSelectedRole('CUSTOMER')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                selectedRole === 'CUSTOMER'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center mb-2">
                <User className="w-4 h-4 text-brand-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Book Services</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">I am a client looking for verified experts</p>
            </div>

            <div
              onClick={() => setSelectedRole('PROVIDER')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                selectedRole === 'PROVIDER'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center mb-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Provide Services</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">I am a professional or business specialist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{saving ? 'Saving Profile...' : 'Complete Setup & Continue'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

