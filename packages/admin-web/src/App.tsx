import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { VerificationPage } from './pages/VerificationPage';
import { BookingsPage } from './pages/BookingsPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { CatalogPage } from './pages/CatalogPage';
import { FinancePage } from './pages/FinancePage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
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
    bookings: {
      title: 'Appointments & Booking Ledger',
      subtitle: 'Central directory of customer appointments across all service categories',
    },
    providers: {
      title: 'Registered Service Providers',
      subtitle: 'Manage individual and business service professionals',
    },
    catalog: {
      title: 'Category & Service Catalog',
      subtitle: 'Configure dynamic categories, service definitions and base prices',
    },
    finance: {
      title: 'Platform Commissions & Financials',
      subtitle: 'Configure commission split rates, track earnings and provider settlements',
    },
    audit: {
      title: 'System Compliance Audit Logs',
      subtitle: 'Immutable record of security and administrative actions',
    },
    settings: {
      title: 'Platform System Settings',
      subtitle: 'Configure core platform parameters and integrations',
    },
  };

  const currentMeta = titles[currentTab] || { title: 'Admin Console', subtitle: '' };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-brand-500 selection:text-white">
      {/* Sidebar with official brand logo */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        pendingKycCount={1}
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
          {currentTab === 'bookings' && <BookingsPage />}
          {currentTab === 'providers' && (
            <ProvidersPage onNavigateToKyc={() => setCurrentTab('verification')} />
          )}
          {currentTab === 'catalog' && <CatalogPage />}
          {currentTab === 'finance' && <FinancePage />}
          {currentTab === 'audit' && <AuditPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;

