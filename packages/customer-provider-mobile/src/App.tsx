import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { CustomerHomeScreen } from './screens/CustomerHomeScreen';
import { CustomerBookingsScreen } from './screens/CustomerBookingsScreen';
import { CustomerProfileScreen } from './screens/CustomerProfileScreen';
import { CategoryProvidersScreen } from './screens/CategoryProvidersScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CustomerSupportScreen } from './screens/CustomerSupportScreen';
import { ProviderDashboardScreen } from './screens/ProviderDashboardScreen';
import { ProviderAvailabilityScreen } from './screens/ProviderAvailabilityScreen';
import { ProviderEarningsScreen } from './screens/ProviderEarningsScreen';
import { ProviderProfileScreen } from './screens/ProviderProfileScreen';
import { ProviderReviewsScreen } from './screens/ProviderReviewsScreen';
import { ProviderBranchesScreen } from './screens/ProviderBranchesScreen';
import { ProviderStaffScreen } from './screens/ProviderStaffScreen';
import { ProviderBusinessDetailsScreen } from './screens/ProviderBusinessDetailsScreen';
import { ProviderKycUploadScreen } from './screens/ProviderKycUploadScreen';
import { ProviderKycStatusScreen } from './screens/ProviderKycStatusScreen';
import {
  Compass,
  CalendarCheck,
  User,
  LayoutDashboard,
  Clock,
  Coins,
  Smartphone,
  Maximize2,
  Repeat,
} from 'lucide-react';

const MobileNavigationContent: React.FC = () => {
  const { user, activeRole, isAuthenticated, isLoading, switchRole } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Sub-screen navigation states
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Provider sub-screen navigation states
  const [providerSubScreen, setProviderSubScreen] = useState<
    'none' | 'reviews' | 'branches' | 'staff' | 'kyc-step1' | 'kyc-step2' | 'kyc-status'
  >('none');
  const [onboardingBusinessData, setOnboardingBusinessData] = useState<any>(null);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-md h-screen sm:h-[844px] bg-slate-50 sm:rounded-[48px] shadow-2xl overflow-hidden relative border-0 sm:border-[8px] sm:border-slate-800">
          <AuthScreen onComplete={() => setActiveTab('home')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-brand-500 selection:text-white">
      {/* Top Device & Role Controls for Reviewer Experience */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-xs text-white">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
          <span className="text-slate-400">Current Role:</span>
          <span className="font-bold text-brand-400">{activeRole}</span>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowSearch(false);
              setShowSupport(false);
              setProviderSubScreen('none');
              switchRole(activeRole === 'CUSTOMER' ? 'PROVIDER' : 'CUSTOMER');
            }}
            className="ml-2 px-2 py-0.5 rounded-md bg-brand-500 hover:bg-brand-600 text-charcoal-900 font-bold text-[10px] flex items-center gap-1 transition-all"
          >
            <Repeat className="w-3 h-3" />
            <span>Switch to {activeRole === 'CUSTOMER' ? 'Provider' : 'Customer'}</span>
          </button>
        </div>

        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all"
        >
          {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isPhoneFrame ? 'Full Width' : 'Device Shell'}</span>
        </button>
      </div>

      {/* Mobile Frame Container */}
      <div
        className={`w-full bg-slate-50 overflow-hidden relative transition-all duration-300 flex flex-col ${
          isPhoneFrame
            ? 'sm:max-w-[400px] h-screen sm:h-[844px] sm:rounded-[48px] sm:border-[8px] sm:border-slate-800 shadow-2xl'
            : 'max-w-2xl min-h-screen sm:rounded-3xl shadow-xl'
        }`}
      >
        {/* Device Notch & Status bar */}
        <div className="h-10 px-6 pt-3 flex items-center justify-between text-xs font-semibold text-slate-800 select-none bg-slate-50 shrink-0">
          <span className="font-mono text-[11px]">9:41</span>
          <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto hidden sm:block" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span
              onClick={() => {
                setSelectedCategory(null);
                setShowSearch(false);
                setShowSupport(false);
                setProviderSubScreen('none');
                switchRole(activeRole === 'CUSTOMER' ? 'PROVIDER' : 'CUSTOMER');
              }}
              className="cursor-pointer font-bold px-2 py-0.5 rounded-full bg-charcoal-900 text-brand-400 border border-slate-700"
            >
              {activeRole} ⇄
            </span>
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto">
          {activeRole === 'CUSTOMER' ? (
            <>
              {selectedCategory ? (
                <CategoryProvidersScreen
                  category={selectedCategory}
                  onBack={() => setSelectedCategory(null)}
                />
              ) : showSupport ? (
                <CustomerSupportScreen onBack={() => setShowSupport(false)} />
              ) : (
                <>
                  {activeTab === 'home' && (
                    <CustomerHomeScreen
                      onSelectCategory={(cat) => setSelectedCategory(cat)}
                      onNavigateToBookings={() => setActiveTab('bookings')}
                      onOpenSearch={() => setShowSearch(true)}
                    />
                  )}
                  {activeTab === 'bookings' && <CustomerBookingsScreen />}
                  {activeTab === 'profile' && (
                    <CustomerProfileScreen onOpenSupport={() => setShowSupport(true)} />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Provider Sub-screens */}
              {showSupport ? (
                <CustomerSupportScreen onBack={() => setShowSupport(false)} />
              ) : providerSubScreen === 'reviews' ? (
                <ProviderReviewsScreen onBack={() => setProviderSubScreen('none')} />
              ) : providerSubScreen === 'branches' ? (
                <ProviderBranchesScreen onBack={() => setProviderSubScreen('none')} />
              ) : providerSubScreen === 'staff' ? (
                <ProviderStaffScreen onBack={() => setProviderSubScreen('none')} />
              ) : providerSubScreen === 'kyc-step1' ? (
                <ProviderBusinessDetailsScreen
                  onNext={(data) => {
                    setOnboardingBusinessData(data);
                    setProviderSubScreen('kyc-step2');
                  }}
                  onBack={() => setProviderSubScreen('none')}
                />
              ) : providerSubScreen === 'kyc-step2' ? (
                <ProviderKycUploadScreen
                  businessData={onboardingBusinessData}
                  onSuccess={() => setProviderSubScreen('kyc-status')}
                  onBack={() => setProviderSubScreen('kyc-step1')}
                />
              ) : providerSubScreen === 'kyc-status' ? (
                <ProviderKycStatusScreen
                  status={user?.providerProfile?.isVerified ? 'APPROVED' : 'PENDING'}
                  onOpenCockpit={() => setProviderSubScreen('none')}
                  onResubmit={() => setProviderSubScreen('kyc-step1')}
                />
              ) : (
                <>
                  {activeTab === 'home' && (
                    <ProviderDashboardScreen
                      onNavigateToSchedule={() => setActiveTab('schedule')}
                      onNavigateToEarnings={() => setActiveTab('earnings')}
                    />
                  )}
                  {activeTab === 'schedule' && (
                    <ProviderAvailabilityScreen onBack={() => setActiveTab('home')} />
                  )}
                  {activeTab === 'earnings' && (
                    <ProviderEarningsScreen onBack={() => setActiveTab('home')} />
                  )}
                  {activeTab === 'profile' && (
                    <ProviderProfileScreen
                      onOpenKyc={() => setProviderSubScreen('kyc-status')}
                      onOpenReviews={() => setProviderSubScreen('reviews')}
                      onOpenBranches={() => setProviderSubScreen('branches')}
                      onOpenStaff={() => setProviderSubScreen('staff')}
                      onOpenSupport={() => setShowSupport(true)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Global Search Screen Modal */}
        {showSearch && <SearchScreen onClose={() => setShowSearch(false)} />}

        {/* Role-Specific Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 flex items-center justify-around z-40 select-none">
          {activeRole === 'CUSTOMER' ? (
            <>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('home');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'home' && !selectedCategory && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Compass className="w-5 h-5" />
                <span className="text-[10px]">Discover</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('bookings');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'bookings' && !selectedCategory && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <CalendarCheck className="w-5 h-5" />
                <span className="text-[10px]">Bookings</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'profile' && !selectedCategory && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('home');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'home' && providerSubScreen === 'none' && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px]">Cockpit</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('schedule');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px]">Schedule</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('earnings');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span className="text-[10px]">Earnings</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'profile' && providerSubScreen === 'none' && !showSupport
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Account</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MobileNavigationContent />
    </AuthProvider>
  );
};

export default App;
