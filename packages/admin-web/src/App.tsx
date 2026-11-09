import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VerificationPage } from './pages/VerificationPage';
import { BookingsPage } from './pages/BookingsPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { CustomersPage } from './pages/CustomersPage';
import { CatalogPage } from './pages/CatalogPage';
import { RateCardPage } from './pages/RateCardPage';
import { FinancePage } from './pages/FinancePage';
import { RefundsPage } from './pages/RefundsPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { SupportPage } from './pages/SupportPage';
import { AuditPage } from './pages/AuditPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api';

export const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(() => {
    const cached = localStorage.getItem('qa_admin_user');
    return cached ? JSON.parse(cached) : { fullName: 'Super Admin', email: 'admin@quickappointments.in', activeRole: 'SUPERADMIN' };
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Operations Dashboard',
      subtitle: 'Real-time performance metrics, revenues, and booking activity',
    },
    verification: {
      title: 'Provider KYC & Compliance Desk',
      subtitle: 'Review government identification documents and approve service providers',
    },
    catalog: {
      title: 'Category & Service Catalog',
      subtitle: 'Configure dynamic categories, service definitions and base prices',
    },
    rate_cards: {
      title: 'Provider Rate Card Approvals',
      subtitle: 'Review provider-requested custom rates before they become live',
    },
    bookings: {
      title: 'Appointments & Booking Ledger',
      subtitle: 'Central directory of customer appointments across all service categories',
    },
    providers: {
      title: 'Registered Service Providers',
      subtitle: 'Manage individual and business service professionals',
    },
    customers: {
      title: 'Registered Customer Accounts',
      subtitle: 'Manage consumer profiles, booking volumes and access control',
    },
    finance: {
      title: '5% Platform Commission Engine',
      subtitle: 'Configure take-rate rules, track margins and gross transaction volume',
    },
    refunds: {
      title: '48-Hour 100% Refund Queue',
      subtitle: 'Process guaranteed 100% cancellations back to original payment methods',
    },
    payouts: {
      title: 'Next-Day (T+1) Provider Settlements',
      subtitle: 'Batch settlements for verified completed appointments and bank export',
    },
    support: {
      title: 'Support & Dispute Resolution Desk',
      subtitle: 'Manage customer complaints, service dispute tickets and resolutions',
    },
    audit: {
      title: 'Compliance & Security Audit Logs',
      subtitle: 'Immutable record of security and administrative operations',
    },
    roles: {
      title: 'Administrative Users & Roles (RBAC)',
      subtitle: 'Manage admin personnel, assign roles and enforce access policies',
    },
    settings: {
      title: 'Platform System Settings',
      subtitle: 'Configure core platform parameters, SMS OTP and payment gateways',
    },
  };

  const currentMeta = titles[currentTab] || { title: 'Admin Console', subtitle: '' };

  const handleLogout = () => {
    api.logout();
    setAdminUser(null);
  };

  if (!adminUser) {
    return <LoginPage onLoginSuccess={(u) => setAdminUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-brand-500 selection:text-white">
      {/* Sidebar with blueprint navigation grouping */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onLogout={handleLogout}
        pendingKycCount={1}
        adminUser={adminUser}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigateToKyc={() => setCurrentTab('verification')} />
          )}
          {currentTab === 'verification' && <VerificationPage />}
          {currentTab === 'catalog' && <CatalogPage />}
          {currentTab === 'rate_cards' && <RateCardPage />}
          {currentTab === 'bookings' && <BookingsPage />}
          {currentTab === 'providers' && (
            <ProvidersPage onNavigateToKyc={() => setCurrentTab('verification')} />
          )}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'finance' && <FinancePage />}
          {currentTab === 'refunds' && <RefundsPage />}
          {currentTab === 'payouts' && <PayoutsPage />}
          {currentTab === 'support' && <SupportPage />}
          {currentTab === 'audit' && <AuditPage />}
          {currentTab === 'roles' && <AdminUsersPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
