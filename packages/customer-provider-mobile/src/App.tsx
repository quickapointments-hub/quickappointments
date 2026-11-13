import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { LanguageModal } from './components/LanguageModal';
import {
  SplashScreen,
  SelectLocationScreen,
  OnboardingScreen,
  AuthScreen,
  CustomerHomeScreen,
  AllCategoriesScreen,
  CategoryProvidersScreen,
  SearchScreen,
  CustomerBookingsScreen,
  CustomerProfileScreen,
  CustomerSupportScreen,
  ProviderDashboardScreen,
  ProviderAvailabilityScreen,
  ProviderEarningsScreen,
  ProviderProfileScreen,
  ProviderReviewsScreen,
  ProviderBranchesScreen,
  ProviderStaffScreen,
  ProviderBusinessDetailsScreen,
  ProviderKycUploadScreen,
  ProviderKycStatusScreen,
} from './screens';
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
  Globe,
} from 'lucide-react';

const MobileNavigationContent: React.FC = () => {
  const { user, activeRole, isAuthenticated, switchRole } = useAuth();
  const { currentLanguage, languages, t } = useLanguage();
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('qa_splash_shown') !== 'true';
    } catch {
      return true;
    }
  });
  const [onboardingStage, setOnboardingStage] = useState<'carousel' | 'location' | 'auth'>('carousel');
  const [showLangModal, setShowLangModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Sub-screen navigation states
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Provider sub-screen navigation states
  const [providerSubScreen, setProviderSubScreen] = useState<
    'none' | 'reviews' | 'branches' | 'staff' | 'kyc-step1' | 'kyc-step2' | 'kyc-status'
  >('none');
  const [onboardingBusinessData, setOnboardingBusinessData] = useState<any>(null);

  const activeLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Cold start splash screen display (only once on app launch)
  if (showSplash) {
    return <SplashScreen onFinish={handleFinishSplash} />;
  }

  // Unauthenticated: Complete Onboarding & Authentication Flow (Matching exact screenshots)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F2E6] flex items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-md h-screen sm:h-[844px] bg-[#FDFCF4] sm:rounded-[48px] shadow-2xl overflow-hidden relative border-0 sm:border-[8px] sm:border-[#E8E4D9]">
          {onboardingStage === 'carousel' && (
            <OnboardingScreen
              onComplete={() => setOnboardingStage('location')}
            />
          )}

          {onboardingStage === 'location' && (
            <SelectLocationScreen
              onContinue={(_city) => setOnboardingStage('auth')}
              onBack={() => setOnboardingStage('carousel')}
            />
          )}

          {onboardingStage === 'auth' && (
            <AuthScreen
              onComplete={() => setActiveTab('home')}
              onBackToOnboarding={() => setOnboardingStage('location')}
            />
          )}
        </div>
      </div>
    );
  }

  const providerStatus =
    user?.providerProfile?.verificationStatus ||
    user?.providerProfile?.verification_status ||
    'PENDING';
  const isProviderApproved = providerStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-[#F5F2E6] flex flex-col items-center justify-center p-0 sm:p-4 selection:bg-[#65B32E] selection:text-white">
      {/* Top Device & Role Controls for Reviewer Experience */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-xs text-[#111111]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] shadow-sm">
          <span className="text-[#4B5563]">Current Mode:</span>
          <span className="font-bold text-[#65B32E]">{activeRole}</span>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowSearch(false);
              setShowSupport(false);
              setProviderSubScreen('none');
              switchRole(activeRole === 'CUSTOMER' ? 'PROVIDER' : 'CUSTOMER');
            }}
            className="ml-2 px-2.5 py-0.5 rounded-md bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <Repeat className="w-3 h-3" />
            <span>Switch to {activeRole === 'CUSTOMER' ? 'Provider' : 'Customer'}</span>
          </button>
        </div>

        {/* Multilingual Switcher Pill */}
        <button
          onClick={() => setShowLangModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F0] border border-[#E8E4D9] text-[#111111] font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#65B32E]" />
          <span>{activeLangObj.nativeName}</span>
          <span className="text-[10px] text-[#6B7280]">({activeLangObj.name})</span>
        </button>

        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F0] border border-[#E8E4D9] text-[#4B5563] font-medium transition-all shadow-sm cursor-pointer"
        >
          {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isPhoneFrame ? 'Full Width' : 'Device Shell'}</span>
        </button>
      </div>

      {/* Mobile Frame Container (Official Cream Background) */}
      <div
        className={`w-full bg-[#FDFCF4] overflow-hidden relative transition-all duration-300 flex flex-col ${
          isPhoneFrame
            ? 'sm:max-w-[400px] h-screen sm:h-[844px] sm:rounded-[48px] sm:border-[8px] sm:border-[#E8E4D9] shadow-2xl'
            : 'max-w-2xl min-h-screen sm:rounded-3xl shadow-xl'
        }`}
      >
        {/* Device Notch & Status bar */}
        <div className="h-10 px-6 pt-3 flex items-center justify-between text-xs font-semibold text-[#111111] select-none bg-[#FDFCF4] shrink-0 border-b border-[#F2EFE8]">
          <span className="font-mono text-[11px] font-bold">9:41</span>
          <div className="w-24 h-4 bg-[#111111] rounded-full mx-auto hidden sm:block" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span
              onClick={() => {
                setSelectedCategory(null);
                setShowSearch(false);
                setShowSupport(false);
                setProviderSubScreen('none');
                switchRole(activeRole === 'CUSTOMER' ? 'PROVIDER' : 'CUSTOMER');
              }}
              className="cursor-pointer font-bold px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E]"
            >
              {activeRole} ⇄
            </span>
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto bg-[#FDFCF4]">
          {activeRole === 'CUSTOMER' ? (
            <>
              {selectedCategory ? (
                <CategoryProvidersScreen
                  category={selectedCategory}
                  city={user?.customerProfile?.city}
                  onBack={() => setSelectedCategory(null)}
                />
              ) : showAllCategories ? (
                <AllCategoriesScreen
                  selectedCity={user?.customerProfile?.city}
                  onSelectCategory={(cat) => {
                    setShowAllCategories(false);
                    setSelectedCategory(cat);
                  }}
                  onBack={() => setShowAllCategories(false)}
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
                      onViewAllCategories={() => setShowAllCategories(true)}
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
              ) : providerSubScreen === 'kyc-status' || !isProviderApproved ? (
                <ProviderKycStatusScreen
                  status={providerStatus}
                  rejectionReason={user?.providerProfile?.rejectionReason || user?.providerProfile?.rejection_reason}
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
                  {activeTab === 'schedule' && <ProviderAvailabilityScreen />}
                  {activeTab === 'earnings' && <ProviderEarningsScreen />}
                  {activeTab === 'profile' && (
                    <ProviderProfileScreen
                      onOpenReviews={() => setProviderSubScreen('reviews')}
                      onOpenBranches={() => setProviderSubScreen('branches')}
                      onOpenStaff={() => setProviderSubScreen('staff')}
                      onOpenKyc={() => setProviderSubScreen('kyc-step1')}
                      onOpenSupport={() => setShowSupport(true)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Global Search Modal Overlay */}
        {showSearch && (
          <SearchScreen
            selectedCity={user?.customerProfile?.city}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onViewAllCategories={() => setShowAllCategories(true)}
            onClose={() => setShowSearch(false)}
          />
        )}

        {/* Global Language Switcher Modal */}
        <LanguageModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />

        {/* Mobile Bottom Navigation Bar (Official Cream & Brand Green Active Indicator, Safe Area Resilient) */}
        <nav className="h-16 bottom-nav-safe border-t border-[#E8E4D9] bg-[#FDFCF4] px-6 flex items-center justify-around shrink-0 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          {activeRole === 'CUSTOMER' ? (
            <>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('home');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'home' && !selectedCategory && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Compass className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_explore')}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('bookings');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'bookings' && !selectedCategory && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <CalendarCheck className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_bookings')}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'profile' && !selectedCategory && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_profile')}</span>
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
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'home' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_dashboard')}</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('schedule');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_availability')}</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('earnings');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_earnings')}</span>
              </button>

              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'profile' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E] font-bold'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">{t('tab_profile')}</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MobileErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Render Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCF4] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EFF8E7] border border-[#65B32E]/30 text-[#65B32E] flex items-center justify-center mb-4 text-2xl font-bold">
            ⚡
          </div>
          <h2 className="text-xl font-extrabold text-[#111111] mb-2">Something went wrong</h2>
          <p className="text-xs text-[#4B5563] max-w-xs mb-6">
            An unexpected error occurred while loading this view.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <MobileErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <MobileNavigationContent />
        </AuthProvider>
      </LanguageProvider>
    </MobileErrorBoundary>
  );
};

export default App;
