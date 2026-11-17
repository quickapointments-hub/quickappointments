import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import {
  LoginPage,
  DashboardPage,
  VerificationPage,
  BookingsPage,
  ProvidersPage,
  CustomersPage,
  CatalogPage,
  RateCardPage,
  ServiceLocationsPage,
  FinancePage,
  RefundsPage,
  PayoutsPage,
  SupportPage,
  AuditPage,
  AdminUsersPage,
  SettingsPage,
  AdminProfilePage,
  BannersPage,
  OffersCouponsPage,
  NotificationsPage,
  ReviewsRatingsPage,
  ReportsPage,
  ServicesPage,
  ProviderDetailsPage,
} from './pages';
import { api } from './api';
import { supabase } from './supabase';
import { AdminPreloader } from './components/AdminPreloader';

export const App: React.FC = () => {
  const [initializing, setInitializing] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<any>(() => {
    if (!api.hasValidSession()) return null;
    try {
      const cached = localStorage.getItem('qa_admin_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    api.onUnauthorized(() => {
      setAdminUser(null);
    });

    let active = true;
    const minSplashDelay = new Promise((resolve) => setTimeout(resolve, 420));

    const restoreSession = async () => {
      try {
        if (api.hasValidSession()) {
          const res = await api.getAdminMe();
          if (active && res?.user) {
            setAdminUser(res.user);
          }
        }
      } catch (err: any) {
        // Keep cached user only when backend is temporarily unreachable; clear on auth failures
        const msg = (err?.message || '').toLowerCase();
        if (
          active &&
          !msg.includes('unable to connect') &&
          !msg.includes('unable to reach')
        ) {
          api.logout();
          setAdminUser(null);
        }
      } finally {
        await minSplashDelay;
        if (active) {
          setInitializing(false);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);

  useEffect(() => {
    if (!adminUser) return;
    let active = true;

    const refreshPendingCount = async () => {
      try {
        const res = await api.getMetrics();
        if (active && typeof res?.data?.pendingVerifications === 'number') {
          setPendingKycCount(res.data.pendingVerifications);
        }
      } catch (e) {}
    };

    refreshPendingCount();
    const timer = setInterval(refreshPendingCount, 15000);
    const unsubscribeSync = api.subscribeToSync((ev) => {
      if (ev === 'providers_updated' || ev === 'provider_kyc_updated' || ev === 'bookings_updated') {
        refreshPendingCount();
      }
    });
    const channel = supabase
      .channel('admin-sidebar-pending-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        refreshPendingCount();
      })
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      unsubscribeSync();
      supabase.removeChannel(channel);
    };
  }, [adminUser, currentTab]);

  const handleLogout = () => {
    api.logout();
    setAdminUser(null);
  };

  if (initializing) {
    return (
      <AdminPreloader
        message={
          api.hasValidSession()
            ? 'Restoring administrator session...'
            : 'Loading Admin Panel...'
        }
      />
    );
  }

  if (!adminUser) {
    return <LoginPage onLoginSuccess={(u) => setAdminUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F5] font-sans selection:bg-[#16A34A] selection:text-white">
      {/* Sidebar with blueprint navigation matching screenshots */}
      {!sidebarCollapsed && (
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          onLogout={handleLogout}
          pendingKycCount={pendingKycCount}
          adminUser={adminUser}
        />
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          adminUser={adminUser}
          onNavigateToProfile={() => setCurrentTab('admin_profile')}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigateToKyc={() => setCurrentTab('verification')} />
          )}
          {currentTab === 'admin_profile' && (
            <AdminProfilePage adminUser={adminUser} onUpdateAdminUser={(u) => setAdminUser(u)} />
          )}
          {currentTab === 'providers' && (
            <ProvidersPage
              onNavigateToKyc={() => setCurrentTab('verification')}
              onViewDetails={(id) => {
                setSelectedProviderId(id);
                setCurrentTab('provider_details');
              }}
            />
          )}
          {currentTab === 'provider_details' && selectedProviderId && (
            <ProviderDetailsPage
              providerId={selectedProviderId}
              onBack={() => setCurrentTab('providers')}
            />
          )}
          {currentTab === 'verification' && <VerificationPage />}
          {currentTab === 'catalog' && (
            <CatalogPage
              onNavigateToRateCards={() => setCurrentTab('rate_cards')}
              onNavigateToServices={() => setCurrentTab('services')}
            />
          )}
          {currentTab === 'services' && <ServicesPage />}
          {currentTab === 'bookings' && <BookingsPage />}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'locations' && <ServiceLocationsPage />}
          {currentTab === 'finance' && <FinancePage />}
          {currentTab === 'offers' && <OffersCouponsPage />}
          {currentTab === 'banners' && <BannersPage />}
          {currentTab === 'refunds' && <RefundsPage />}
          {currentTab === 'payouts' && <PayoutsPage />}
          {currentTab === 'rate_cards' && <RateCardPage />}
          {currentTab === 'support' && <SupportPage />}
          {currentTab === 'audit' && <AuditPage />}
          {currentTab === 'roles' && <AdminUsersPage />}
          {currentTab === 'settings' && <SettingsPage />}
          {currentTab === 'notifications' && <NotificationsPage />}
          {currentTab === 'reviews' && <ReviewsRatingsPage />}
          {currentTab === 'reports' && <ReportsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
