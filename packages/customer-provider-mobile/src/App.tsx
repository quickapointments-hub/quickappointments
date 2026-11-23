import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { mobileApi } from './api';
import { supabase } from './supabase';
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
import { ProviderServicesScreen } from './screens/provider/ProviderServicesScreen';
import {
  Smartphone,
  Maximize2,
  Repeat,
  Globe,
  Home,
  Search,
  CalendarCheck2,
  Heart,
  User,
  LayoutDashboard,
  Clock,
  Wallet,
  Sparkles,
  Tag,
} from 'lucide-react';
import { WalletModal } from './components/WalletModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { OffersCouponsModal } from './components/OffersCouponsModal';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { BookingInvoiceModal } from './components/BookingInvoiceModal';
import { RefundStatusModal } from './components/RefundStatusModal';
import { FilterSortModal } from './components/FilterSortModal';
import { ProviderGalleryModal } from './components/ProviderGalleryModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { FAQsModal } from './components/FAQsModal';
import { ProviderAddServiceModal } from './components/ProviderAddServiceModal';

const MobileNavigationContent: React.FC = () => {
  const { user, activeRole, isAuthenticated, switchRole } = useAuth();
  const { currentLanguage, languages, t } = useLanguage();
  const [showSplash, setShowSplash] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<'carousel' | 'location' | 'auth'>('carousel');
  const [showLangModal, setShowLangModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Sub-screen navigation states
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Refinement & Feature Modal States (Addressing UI-Only & Partial items)
  const [showWallet, setShowWallet] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFaqs, setShowFaqs] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<any>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundBooking, setRefundBooking] = useState<any>(null);
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [detailService, setDetailService] = useState<any>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryProviderId, setGalleryProviderId] = useState<string>('fp1');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // Filter state for services
  const [serviceFilters, setServiceFilters] = useState<{
    sort: 'popular' | 'price_low' | 'price_high';
    priceRange: 'all' | 'under_500' | '500_1000' | 'above_1000';
    verifiedOnly: boolean;
  }>({ sort: 'popular', priceRange: 'all', verifiedOnly: false });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Active City State (Synced across Customer Home, Discovery, Categories and Search)
  const [currentCity, setCurrentCity] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('qa_selected_city');
      if (saved) return saved;
    } catch { }
    return user?.customerProfile?.city || 'Hyderabad';
  });

  const handleCityChange = useCallback((cityName: string) => {
    if (!cityName) return;
    setCurrentCity(cityName);
    try {
      localStorage.setItem('qa_selected_city', cityName);
    } catch { }
  }, []);

  useEffect(() => {
    let active = true;
    mobileApi.getActiveCities().then((res) => {
      if (!active || !Array.isArray(res?.data) || res.data.length === 0) return;
      const activeNames = res.data.map((c: any) => c.name);
      const saved = localStorage.getItem('qa_selected_city');

      if (!saved || !activeNames.includes(saved)) {
        const fallback = user?.customerProfile?.city && activeNames.includes(user.customerProfile.city)
          ? user.customerProfile.city
          : activeNames[0];
        handleCityChange(fallback);
      }
    }).catch(() => { });

    // Listen to realtime city updates when admin enables/disables cities in Admin Panel
    const channel = supabase
      .channel('app-global-cities-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
        mobileApi.getActiveCities().then((res) => {
          if (!Array.isArray(res?.data) || res.data.length === 0) return;
          const activeNames = res.data.map((c: any) => c.name);
          setCurrentCity((prev) => {
            const next = activeNames.includes(prev) ? prev : activeNames[0];
            try {
              localStorage.setItem('qa_selected_city', next);
            } catch { }
            return next;
          });
        }).catch(() => { });
      })
      .subscribe();

    const unsub = mobileApi.subscribeToSync((ev) => {
      if (ev === 'cities_updated') {
        mobileApi.getActiveCities().then((res) => {
          if (!Array.isArray(res?.data) || res.data.length === 0) return;
          const activeNames = res.data.map((c: any) => c.name);
          setCurrentCity((prev) => {
            const next = activeNames.includes(prev) ? prev : activeNames[0];
            try {
              localStorage.setItem('qa_selected_city', next);
            } catch { }
            return next;
          });
        }).catch(() => { });
      }
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      unsub();
    };
  }, [user?.customerProfile?.city, handleCityChange]);

  // Provider sub-screen navigation states
  const [providerSubScreen, setProviderSubScreen] = useState<
    'none' | 'services' | 'reviews' | 'branches' | 'staff' | 'kyc-step1' | 'kyc-step2' | 'kyc-status'
  >('none');
  const [onboardingBusinessData, setOnboardingBusinessData] = useState<any>(null);

  const activeLangObj =
    languages.find((l) => l.code === currentLanguage) ||
    languages[0] || { code: 'en', name: 'English', nativeName: 'English' };

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
              onContinue={(chosenCity) => {
                handleCityChange(chosenCity);
                setOnboardingStage('auth');
              }}
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
        className={`w-full bg-[#FDFCF4] overflow-hidden relative transition-all duration-300 flex flex-col ${isPhoneFrame
          ? 'sm:max-w-[400px] h-screen sm:h-[844px] sm:rounded-[48px] sm:border-[8px] sm:border-[#E8E4D9] shadow-2xl'
          : 'max-w-2xl min-h-screen sm:rounded-3xl shadow-xl'
          }`}
      >
        {/* Device Notch & Status bar */}
        <div className="h-11 px-6 pt-2 flex items-center justify-between text-xs font-semibold text-[#111111] select-none bg-[#FDFCF4] shrink-0 border-b border-[#F2EFE8]">
          <span className="font-mono text-[11px] font-bold tracking-tight">9:41</span>

          {/* Dynamic Island Pill with Camera & Sensor Elements */}
          <div className="hidden sm:flex items-center justify-center gap-2 px-3 py-1 bg-[#111111] rounded-full mx-auto shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1F2937] ring-1 ring-white/10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#374151]" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" title="System Live" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span
              onClick={() => {
                setSelectedCategory(null);
                setShowSearch(false);
                setShowSupport(false);
                setProviderSubScreen('none');
                switchRole(activeRole === 'CUSTOMER' ? 'PROVIDER' : 'CUSTOMER');
              }}
              className="cursor-pointer font-bold px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E] hover:bg-[#65B32E] hover:text-white transition-colors"
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
                  city={currentCity}
                  onBack={() => setSelectedCategory(null)}
                  onOpenSearch={() => {
                    setSelectedCategory(null);
                    setActiveTab('search');
                  }}
                  onOpenLocationModal={() => setShowLocationPermission(true)}
                />
              ) : showAllCategories ? (
                <AllCategoriesScreen
                  selectedCity={currentCity}
                  onChangeCity={handleCityChange}
                  onOpenLocationModal={() => setShowLocationPermission(true)}
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
                      selectedCity={currentCity}
                      onChangeCity={handleCityChange}
                      onOpenLocationModal={() => setShowLocationPermission(true)}
                      onSelectCategory={(cat) => setSelectedCategory(cat)}
                      onNavigateToBookings={() => setActiveTab('bookings')}
                      onOpenSearch={() => setActiveTab('search')}
                      onViewAllCategories={() => setShowAllCategories(true)}
                    />
                  )}
                  {activeTab === 'search' && (
                    <SearchScreen
                      selectedCity={currentCity}
                      onChangeCity={handleCityChange}
                      onOpenLocationModal={() => setShowLocationPermission(true)}
                      onSelectCategory={(cat) => setSelectedCategory(cat)}
                      onViewAllCategories={() => setShowAllCategories(true)}
                      onClose={() => setActiveTab('home')}
                    />
                  )}
                  {activeTab === 'bookings' && (
                    <CustomerBookingsScreen
                      onViewInvoice={(b) => {
                        setInvoiceBooking(b);
                        setShowInvoiceModal(true);
                      }}
                      onTrackRefund={(b) => {
                        setRefundBooking(b);
                        setShowRefundModal(true);
                      }}
                    />
                  )}
                  {activeTab === 'favorites' && (
                    <div className="p-4 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-[#111111]">Saved Favourites</h2>
                        <button
                          onClick={() => setShowFavorites(true)}
                          className="px-3 py-1 bg-[#EFF8E7] border border-[#65B32E] text-[#1B3808] font-bold text-xs rounded-lg"
                        >
                          Manage Favourites
                        </button>
                      </div>
                      <p className="text-xs text-[#4B5563] mb-4">Your saved specialists and salon partners for instant rebooking.</p>
                      <button
                        onClick={() => setShowFavorites(true)}
                        className="w-full py-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs text-xs font-bold text-[#65B32E] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-[#65B32E] text-[#65B32E]" />
                        <span>View All Favourite Specialists</span>
                      </button>
                    </div>
                  )}
                  {activeTab === 'profile' && (
                    <CustomerProfileScreen
                      onOpenSupport={() => setShowSupport(true)}
                      onOpenWallet={() => setShowWallet(true)}
                      onOpenTransactions={() => setShowTransactions(true)}
                      onOpenOffers={() => setShowOffers(true)}
                      onOpenFaqs={() => setShowFaqs(true)}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Provider Sub-screens */}
              {showSupport ? (
                <CustomerSupportScreen onBack={() => setShowSupport(false)} />
              ) : providerSubScreen === 'services' ? (
                <ProviderServicesScreen onBack={() => setProviderSubScreen('none')} />
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
                      onNavigateToServices={() => setProviderSubScreen('services')}
                    />
                  )}
                  {activeTab === 'schedule' && <ProviderAvailabilityScreen />}
                  {activeTab === 'earnings' && <ProviderEarningsScreen />}
                  {activeTab === 'profile' && (
                    <ProviderProfileScreen
                      onOpenServices={() => setProviderSubScreen('services')}
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
            selectedCity={currentCity}
            onChangeCity={handleCityChange}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onViewAllCategories={() => setShowAllCategories(true)}
            onClose={() => setShowSearch(false)}
          />
        )}

        {/* Global Language Switcher Modal */}
        <LanguageModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />

        {/* Refinement & Polish Modals (Wallet, Transactions, Offers, Invoices, FAQs, Gallery) */}
        <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
        <TransactionHistoryModal
          isOpen={showTransactions}
          onClose={() => setShowTransactions(false)}
          onViewInvoice={(tx) => {
            setInvoiceBooking(tx);
            setShowInvoiceModal(true);
          }}
        />
        <OffersCouponsModal isOpen={showOffers} onClose={() => setShowOffers(false)} />
        <FavoritesDrawer
          isOpen={showFavorites}
          onClose={() => setShowFavorites(false)}
          onSelectProvider={(p) => {
            setShowFavorites(false);
            setSelectedCategory({ id: p.categoryId || 'beauty', name: p.categoryName || 'Beauty & Salon' });
          }}
        />
        <FAQsModal isOpen={showFaqs} onClose={() => setShowFaqs(false)} />
        <LocationPermissionModal
          isOpen={showLocationPermission}
          onClose={() => setShowLocationPermission(false)}
          onLocationSelected={handleCityChange}
        />
        <BookingInvoiceModal
          isOpen={showInvoiceModal}
          booking={invoiceBooking}
          onClose={() => setShowInvoiceModal(false)}
        />
        <RefundStatusModal
          isOpen={showRefundModal}
          booking={refundBooking}
          onClose={() => setShowRefundModal(false)}
        />
        <ServiceDetailsModal
          isOpen={showServiceDetailModal}
          service={detailService}
          onClose={() => setShowServiceDetailModal(false)}
          onBookNow={(_srv) => { }}
        />
        <ProviderGalleryModal
          isOpen={showGalleryModal}
          providerId={galleryProviderId}
          isProviderOwner={activeRole === 'PROVIDER'}
          onClose={() => setShowGalleryModal(false)}
        />
        <FilterSortModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          currentSort={serviceFilters.sort}
          currentPriceRange={serviceFilters.priceRange}
          verifiedOnly={serviceFilters.verifiedOnly}
          onApply={(f) => setServiceFilters(f)}
        />
        <ProviderAddServiceModal
          isOpen={showAddServiceModal}
          onClose={() => setShowAddServiceModal(false)}
        />

        {/* Mobile Bottom Navigation Bar (Official Cream, FontAwesome Icons & Safe Area Resilient) */}
        <nav
          className="border-t border-[#E8E4D9] bg-[#FDFCF4] px-4 flex items-center justify-around shrink-0 select-none shadow-[0_-2px_12px_rgba(0,0,0,0.03)]"
          style={{
            paddingTop: '8px',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 16px))',
            minHeight: '68px',
          }}
        >
          {activeRole === 'CUSTOMER' ? (
            <>
              {/* 1. Explore (Matching Screenshot 1) */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAllCategories(false);
                  setShowSupport(false);
                  setActiveTab('home');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'home' && !showAllCategories && !showSupport
                    ? 'text-[#16A34A]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Sparkles className="w-5 h-5 stroke-[2]" color={activeTab === 'home' && !showAllCategories && !showSupport ? '#16A34A' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'home' && !showAllCategories && !showSupport ? 'font-black text-[#111111]' : 'font-medium'}`}>
                  Explore
                </span>
                {activeTab === 'home' && !showAllCategories && !showSupport && (
                  <div className="w-4 h-0.5 bg-[#16A34A] rounded-full mt-0.5" />
                )}
              </button>

              {/* 2. Bookings (Matching Screenshot 1 with (1) badge) */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAllCategories(false);
                  setShowSupport(false);
                  setActiveTab('bookings');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
                  activeTab === 'bookings'
                    ? 'text-[#16A34A]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <div className="relative">
                  <CalendarCheck2 className="w-5 h-5 stroke-[2]" color={activeTab === 'bookings' ? '#16A34A' : '#6B7280'} />
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 min-w-[14px] h-3.5 rounded-full bg-[#16A34A] text-white text-[9px] font-black flex items-center justify-center ring-1 ring-white">
                    1
                  </span>
                </div>
                <span className={`text-[10px] ${activeTab === 'bookings' ? 'font-black text-[#111111]' : 'font-medium'}`}>
                  Bookings
                </span>
                {activeTab === 'bookings' && (
                  <div className="w-4 h-0.5 bg-[#16A34A] rounded-full mt-0.5" />
                )}
              </button>

              {/* 3. Offers (Matching Screenshot 1) */}
              <button
                onClick={() => {
                  setShowOffers(true);
                }}
                className="flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer text-[#6B7280] hover:text-[#111111]"
              >
                <Tag className="w-5 h-5 stroke-[2]" color="#6B7280" />
                <span className="text-[10px] font-medium">
                  Offers
                </span>
              </button>

              {/* 4. Profile (Matching Screenshot 1) */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAllCategories(false);
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-[#16A34A]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <User className="w-5 h-5 stroke-[2]" color={activeTab === 'profile' ? '#16A34A' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'profile' ? 'font-black text-[#111111]' : 'font-medium'}`}>
                  Profile
                </span>
                {activeTab === 'profile' && (
                  <div className="w-4 h-0.5 bg-[#16A34A] rounded-full mt-0.5" />
                )}
              </button>
            </>
          ) : (
            <>
              {/* Provider 1. Dashboard */}
              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('home');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'home' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 stroke-[1.9]" color={activeTab === 'home' && providerSubScreen === 'none' && !showSupport ? '#65B32E' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'home' && providerSubScreen === 'none' && !showSupport ? 'font-black text-[#1B3808]' : 'font-medium'}`}>
                  {t('tab_dashboard') || 'Dashboard'}
                </span>
                {activeTab === 'home' && providerSubScreen === 'none' && !showSupport && (
                  <div className="w-4 h-0.5 bg-[#65B32E] rounded-full mt-0.5" />
                )}
              </button>

              {/* Provider 2. Schedule / Availability */}
              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('schedule');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Clock className="w-5 h-5 stroke-[1.9]" color={activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport ? '#65B32E' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport ? 'font-black text-[#1B3808]' : 'font-medium'}`}>
                  {t('tab_availability') || 'Schedule'}
                </span>
                {activeTab === 'schedule' && providerSubScreen === 'none' && !showSupport && (
                  <div className="w-4 h-0.5 bg-[#65B32E] rounded-full mt-0.5" />
                )}
              </button>

              {/* Provider 3. Earnings */}
              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('earnings');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Wallet className="w-5 h-5 stroke-[1.9]" color={activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport ? '#65B32E' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport ? 'font-black text-[#1B3808]' : 'font-medium'}`}>
                  {t('tab_earnings') || 'Earnings'}
                </span>
                {activeTab === 'earnings' && providerSubScreen === 'none' && !showSupport && (
                  <div className="w-4 h-0.5 bg-[#65B32E] rounded-full mt-0.5" />
                )}
              </button>

              {/* Provider 4. Profile */}
              <button
                onClick={() => {
                  setProviderSubScreen('none');
                  setShowSupport(false);
                  setActiveTab('profile');
                }}
                className={`flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'profile' && providerSubScreen === 'none' && !showSupport
                    ? 'text-[#65B32E]'
                    : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <User className="w-5 h-5 stroke-[1.9]" color={activeTab === 'profile' && providerSubScreen === 'none' && !showSupport ? '#65B32E' : '#6B7280'} />
                <span className={`text-[10px] ${activeTab === 'profile' && providerSubScreen === 'none' && !showSupport ? 'font-black text-[#1B3808]' : 'font-medium'}`}>
                  {t('tab_profile') || 'Profile'}
                </span>
                {activeTab === 'profile' && providerSubScreen === 'none' && !showSupport && (
                  <div className="w-4 h-0.5 bg-[#65B32E] rounded-full mt-0.5" />
                )}
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
  override state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Render Error Boundary caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCF4] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-[#EFF8E7] border border-[#65B32E]/30 text-[#65B32E] flex items-center justify-center mb-4 text-2xl font-bold">
            ⚡
          </div>
          <h2 className="text-xl font-extrabold text-[#111111] mb-2">Quick Appointments</h2>
          <p className="text-xs text-rose-600 font-mono max-w-sm mb-4 break-words bg-rose-50 p-3 rounded-xl border border-rose-100">
            {this.state.error?.message || 'Rendering error'}
          </p>
          <p className="text-xs text-[#4B5563] max-w-xs mb-6">
            An unexpected error occurred while loading this view.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              try {
                localStorage.removeItem('qa_mobile_user');
                sessionStorage.clear();
              } catch {}
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Reset & Reload App
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
