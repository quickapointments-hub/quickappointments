import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageModal } from '../../components/LanguageModal';
import { mobileApi } from '../../api';
import {
  User,
  Phone,
  ShieldCheck,
  Repeat,
  LogOut,
  ChevronRight,
  HelpCircle,
  MapPin,
  Settings,
  Edit3,
  X,
  Bell,
  Check,
  Globe,
} from 'lucide-react';

export const CustomerProfileScreen: React.FC<{
  onOpenSupport?: () => void;
}> = ({ onOpenSupport }) => {
  const { user, switchRole, logout, refreshProfile } = useAuth();
  const { currentLanguage, languages, t } = useLanguage();

  // Sub-modal states
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState((user as any)?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddresses, setShowAddresses] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail((user as any)?.email || '');
  }, [user?.fullName, (user as any)?.email]);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await mobileApi.getCustomerAddresses();
      setAddresses(res.data || []);
    } catch {
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await mobileApi.updateProfile({ fullName: fullName.trim(), email: email.trim() || undefined });
      await refreshProfile();
      setShowEditProfile(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    try {
      setSavingAddress(true);
      await mobileApi.addCustomerAddress({
        label: 'Saved Address',
        addressLine: newAddress.trim(),
        city: user?.customerProfile?.city || undefined,
      });
      setNewAddress('');
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addr: any, idx: number) => {
    if (addr?.id) {
      try {
        await mobileApi.deleteCustomerAddress(addr.id);
        await loadAddresses();
      } catch (err: any) {
        alert(err.message || 'Failed to remove address');
      }
    } else {
      setAddresses(addresses.filter((_, i) => i !== idx));
    }
  };

  const activeLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  return (
    <div className="pb-24 px-5 pt-4 space-y-5 bg-[#FDFCF4] text-[#111111] min-h-full">
      <div>
        <h2 className="text-lg font-black font-display text-[#111111] tracking-tight">
          {t('profile')}
        </h2>
        <p className="text-xs text-[#4B5563] font-medium">Preferences, profile & role switcher</p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF8E7] text-[#111111] border border-[#65B32E] font-black font-display flex items-center justify-center text-lg">
          {fullName.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[#111111] truncate">{fullName || user?.fullName || 'Quick User'}</h3>
          <p className="text-xs text-[#4B5563] font-mono mt-0.5">{user?.phone || ''}</p>
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E] text-[10px] font-bold mt-1.5">
            Active Mode: Customer
          </span>
        </div>
      </div>

      {/* Multi-Role Switcher Card */}
      <div className="p-5 rounded-3xl bg-white text-[#111111] shadow-sm border border-[#E8E4D9] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#111111] text-xs font-bold">
            <Repeat className="w-4 h-4 text-[#65B32E]" />
            <span>Dual Role Switcher</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E] font-bold">
            Provider Mode
          </span>
        </div>

        <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
          Are you a certified specialist or salon/clinic owner? Switch to Provider Mode to manage
          bookings, configure working hours, and review earnings.
        </p>

        <button
          onClick={() => switchRole('PROVIDER')}
          className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{t('switch_to_provider')}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Links */}
      <div className="bg-white rounded-3xl border border-[#E8E4D9] divide-y divide-[#F2EFE8] overflow-hidden shadow-sm">
        {/* Language Selection Option */}
        <div
          onClick={() => setShowLanguageModal(true)}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <Globe className="w-4 h-4 text-[#65B32E]" />
            <span>{t('language')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#65B32E] px-2 py-0.5 rounded-full bg-[#EFF8E7]">
              {activeLangObj.nativeName} ({activeLangObj.name})
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>

        <div
          onClick={() => setShowEditProfile(true)}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <Edit3 className="w-4 h-4 text-[#65B32E]" />
            <span>{t('edit_profile')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>

        <div
          onClick={() => setShowAddresses(true)}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <MapPin className="w-4 h-4 text-[#65B32E]" />
            <span>{t('saved_addresses')} ({addresses.length})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>

        <div
          onClick={() => setShowSettings(true)}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <Settings className="w-4 h-4 text-[#65B32E]" />
            <span>{t('notifications')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>

        <div
          onClick={onOpenSupport}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <HelpCircle className="w-4 h-4 text-[#65B32E]" />
            <span>{t('help_center')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>

        <div
          onClick={logout}
          className="p-4 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors text-xs text-[#DC2626] font-bold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-[#DC2626]" />
            <span>{t('logout')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#FDFCF4] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E8E4D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h3 className="font-bold text-sm text-[#111111]">{t('edit_profile')}</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">{t('full_name')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCD8C8] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#65B32E]/30 focus:border-[#65B32E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCD8C8] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#65B32E]/30 focus:border-[#65B32E]"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : t('save')}
            </button>
          </div>
        </div>
      )}

      {/* SAVED ADDRESSES MODAL */}
      {showAddresses && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#FDFCF4] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E8E4D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h3 className="font-bold text-sm text-[#111111]">{t('saved_addresses')}</h3>
              <button
                onClick={() => setShowAddresses(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {addresses.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-[#E8E4D9]">
                  No saved addresses yet. Add your primary service address below.
                </div>
              ) : (
                addresses.map((addr, idx) => (
                  <div
                    key={addr?.id || idx}
                    className="p-3 rounded-xl bg-white border border-[#E8E4D9] flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#65B32E] mt-0.5 shrink-0" />
                      <span className="text-xs text-[#111111]">
                        {typeof addr === 'string'
                          ? addr
                          : `${addr.addressLine || addr.address_line}${addr.city ? `, ${addr.city}` : ''}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr, idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E8E4D9]">
              <input
                type="text"
                placeholder="Enter new address..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCD8C8] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#65B32E]/30 focus:border-[#65B32E]"
              />
              <button
                onClick={handleAddAddress}
                disabled={savingAddress}
                className="w-full py-2 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {savingAddress ? 'Saving...' : '+ Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#FDFCF4] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E8E4D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h3 className="font-bold text-sm text-[#111111]">{t('notifications')}</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E4D9]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#65B32E]" />
                  <span className="text-xs font-semibold text-[#111111]">Push Notifications</span>
                </div>
                <button
                  onClick={() => setPushNotifs(!pushNotifs)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${pushNotifs ? 'bg-[#65B32E]' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${pushNotifs ? 'right-1' : 'left-1'
                      }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E4D9]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#65B32E]" />
                  <span className="text-xs font-semibold text-[#111111]">SMS Appointment Alerts</span>
                </div>
                <button
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${smsAlerts ? 'bg-[#65B32E]' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${smsAlerts ? 'right-1' : 'left-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECTION MODAL */}
      <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
    </div>
  );
};
