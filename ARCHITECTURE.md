# Quick Appointments — Complete Architecture & Directory Map

An enterprise-grade, multi-role appointment booking platform engineered with a clean monorepo architecture, clearly separated domains, and live database integrations.

---

## 🏗 Workspace Layout

```
quick-appointments/
├── assets/
│   └── branding/
│       └── logo.png                          # Master high-resolution brand logo
├── database-migrations/
│   ├── 01_init_schema.sql                    # Core tables, constraints, foreign keys, triggers
│   ├── 02_supabase_storage_and_rls.sql       # Storage buckets (kyc, avatars) & baseline RLS
│   ├── 03_blueprint_extensions.sql           # Branches, staff, rate cards, working hours
│   ├── 04_complete_rls_and_rpc.sql           # Stored procedures (RPCs) & high-concurrency policies
│   └── README.md                             # Step-by-step SQL migration execution guide
├── no-need/                                  # Isolated repository archive for superseded resources
│   ├── database/
│   │   └── run_supabase_migration.sql        # Monolithic setup script (superseded by 01-04)
│   ├── images/
│   │   ├── app-icon.png                      # Unused asset (replaced by assets/icon.png)
│   │   └── splash.png                        # Redundant duplicate (replaced by assets/splash.png)
│   └── screens/
│       ├── ProfileSetupScreen.tsx            # Obsolete prototype (superseded by AuthScreen.tsx)
│       └── SelectLanguageScreen.tsx          # Unused screen (superseded by LanguageModal.tsx)
├── packages/
│   ├── admin-web/                            # Admin Panel (React 18 + Vite + Tailwind)
│   ├── customer-provider-mobile/             # Customer & Provider App (React Native/Web + Expo + Tailwind)
│   ├── backend-api/                          # Express REST API + Prisma ORM + Workers
│   └── shared-types/                         # TypeScript interfaces, enums, Zod validation schemas
├── scripts/
│   ├── apply-custom-icon.ps1                 # Native app icon deployment utility
│   ├── check-deps.js                         # Dependency health and conflict checker
│   └── generate-app-icons.js                 # Automated multi-density app icon generator
├── .env                                      # Central environment variables & Supabase credentials
├── .env.example                              # Template environment configuration
├── ARCHITECTURE.md                           # Comprehensive architecture and directory roadmap
└── package.json                              # Monorepo workspaces coordinator
```

---

## 📦 Package 1: Admin Panel (`packages/admin-web`)

The administrative dashboard provides governance over bookings, service providers, KYC verifications, financial payouts, catalog items, and marketing promotions.

```
packages/admin-web/
├── public/
│   └── logo.png                              # Web brand asset
├── src/
│   ├── api.ts                                # Central API Client with Supabase & REST integrations
│   ├── supabase.ts                           # Supabase client with service role authentication
│   ├── App.tsx                               # Primary layout with Sidebar, Header & Tab Router
│   ├── main.tsx                              # React DOM root entry
│   ├── index.css                             # Tailwind CSS styles & typography
│   ├── components/
│   │   ├── Header.tsx                        # Global top bar, notification badge, admin avatar
│   │   └── Sidebar.tsx                       # Collapsible navigation matching screenshots
│   └── pages/                                # Categorized domain subdirectories & barrel export
│       ├── index.ts                          # Unified barrel exports for all admin pages
│       ├── auth/
│       │   ├── LoginPage.tsx                 # Clean text-based admin login
│       │   └── AdminProfilePage.tsx          # Profile details, password, 2FA, active sessions
│       ├── dashboard/
│       │   ├── DashboardPage.tsx             # 6 dynamic KPI cards & live appointments
│       │   └── ReportsPage.tsx               # Analytics, exports & operational breakdowns
│       ├── management/
│       │   ├── CustomersPage.tsx             # Live customer accounts directory & status toggles
│       │   ├── ProvidersPage.tsx             # Provider accounts, verification status & details
│       │   ├── VerificationPage.tsx          # Document review, HD clarity requests, approvals
│       │   └── AdminUsersPage.tsx            # Role management (Super Admin, Ops, Support, etc.)
│       ├── catalog/
│       │   ├── CatalogPage.tsx               # Categories & service catalog CRUD
│       │   ├── RateCardPage.tsx              # Provider rate approvals and decisions
│       │   └── ServiceLocationsPage.tsx      # Admin-managed popular cities & coverage
│       ├── appointments/
│       │   └── BookingsPage.tsx              # Appointment lifecycle, filter tabs & status updates
│       ├── finance/
│       │   ├── FinancePage.tsx               # Live revenue calculations, payouts & donut charts
│       │   ├── PayoutsPage.tsx               # T+1 settlement batches and bank UTR verification
│       │   └── RefundsPage.tsx               # 100% gateway refunds and cancellation processing
│       ├── marketing/
│       │   ├── OffersCouponsPage.tsx         # Database coupons and promotional deals
│       │   ├── BannersPage.tsx               # Home screen banner management & scheduling
│       │   └── NotificationsPage.tsx         # Push notification broadcasts to apps
│       ├── support/
│       │   ├── SupportPage.tsx               # Customer & provider support tickets desk
│       │   ├── ReviewsRatingsPage.tsx        # Customer ratings, feedback & admin responses
│       │   └── AuditPage.tsx                 # Immutable compliance audit trails
│       └── settings/
│           └── SettingsPage.tsx              # General, Payment (Razorpay), Booking & App settings
```

---

## 📱 Package 2: Customer & Provider Mobile App (`packages/customer-provider-mobile`)

A dual-role mobile application supporting both customer service booking and service provider business management.

```
packages/customer-provider-mobile/
├── assets/                                   # Native application icons & splash screens
│   ├── adaptive-icon.png
│   ├── icon.png
│   ├── splash.png
│   └── splash-logo.png
├── public/
│   ├── logo.png                              # Quick Appointments brand emblem
│   └── splash.png
├── src/
│   ├── api.ts                                # Mobile client with live Supabase & REST calls
│   ├── supabase.ts                           # Supabase client with realtime subscriptions
│   ├── theme.ts                              # Design system tokens (#16A34A, #FDFCF4, #111111)
│   ├── App.tsx                               # Multi-role orchestrator & phone frame wrapper
│   ├── main.tsx                              # Web / native mount entry
│   ├── components/                           # Shared interactive modals & UI elements
│   │   ├── AlternativeProvidersModal.tsx     # Smart reassignment when provider is busy
│   │   ├── AwaitingProviderModal.tsx         # Live countdown timer for provider acceptance
│   │   ├── BookingModal.tsx                  # Date, slot & payment selection dialog
│   │   ├── BookingOtpModal.tsx               # Secure 4-digit arrival verification OTP
│   │   ├── IncomingRequestModal.tsx          # Real-time incoming booking popup for providers
│   │   ├── LanguageModal.tsx                 # 10-language Indian regional language switcher
│   │   ├── LeavesDecoration.tsx              # Organic leaf graphic background decoration
│   │   └── ReviewModal.tsx                   # Post-service star rating & feedback submission
│   ├── context/
│   │   └── AuthContext.tsx                   # User session, role switcher (Customer <-> Provider)
│   ├── i18n/
│   │   ├── LanguageContext.tsx               # Multilingual translation provider
│   │   ├── translations.ts                   # English, Hindi, Telugu, Tamil, Kannada, etc.
│   │   └── types.ts                          # Localization string interfaces
│   └── screens/                              # Categorized flow screens & barrel export
│       ├── index.ts                          # Clean screen exports
│       ├── onboarding/
│       │   ├── SplashScreen.tsx              # Cold-start branding splash
│       │   ├── OnboardingScreen.tsx          # 3-step value proposition carousel
│       │   ├── SelectLocationScreen.tsx      # Map illustration, GPS detection & 2x2 cities
│       │   └── AuthScreen.tsx                # General user & 4-step provider registration
│       ├── customer/
│       │   ├── CustomerHomeScreen.tsx        # Banners, category grid & top-rated providers
│       │   ├── CategoryProvidersScreen.tsx   # Providers list by category with pricing
│       │   ├── SearchScreen.tsx              # Live keyword search & city filter
│       │   ├── CustomerBookingsScreen.tsx    # Active & past appointment cards with OTP
│       │   ├── CustomerProfileScreen.tsx     # Profile, address, language & role toggle
│       │   └── CustomerSupportScreen.tsx     # Direct chat & complaint ticket submission
│       └── provider/
│           ├── ProviderDashboardScreen.tsx   # Duty toggle, revenue & upcoming appointments
│           ├── ProviderAvailabilityScreen.tsx# Calendar slot & working hours configuration
│           ├── ProviderEarningsScreen.tsx    # Daily earnings & payout history
│           ├── ProviderProfileScreen.tsx     # Business profile, branches & staff links
│           ├── ProviderReviewsScreen.tsx     # Customer feedback and rating responses
│           ├── ProviderBranchesScreen.tsx    # Multi-location salon/service branches
│           ├── ProviderStaffScreen.tsx       # Team member assignment to services
│           ├── ProviderBusinessDetailsScreen.tsx # Business address & working profile
│           ├── ProviderKycUploadScreen.tsx   # HD document camera & file upload
│           └── ProviderKycStatusScreen.tsx   # Verification status tracking & resubmission
```

---

## ⚡ Package 3: Backend API (`packages/backend-api`)

Production-ready REST API built with Express, Prisma ORM, and background workers.

```
packages/backend-api/
├── prisma/
│   ├── dev.db                                # SQLite local development database
│   └── schema.prisma                         # Prisma data model & relational mapping
└── src/
    ├── prisma.ts                             # Singleton PrismaClient instance
    ├── server.ts                             # Express server & route registration
    ├── supabase.ts                           # Supabase admin integration
    ├── middleware/
    │   └── auth.ts                           # JWT authentication & RBAC role guards
    └── services/
        ├── adminService.ts                   # KYC audits, compliance & ledger operations
        ├── authService.ts                    # OTP generation, verification & session handling
        ├── availabilityService.ts            # Slot generation, buffers & conflict checks
        ├── bookingService.ts                 # Atomic bookings & OTP verification
        ├── catalogService.ts                 # Category, service & city management
        ├── paymentService.ts                 # Razorpay order creation & webhook handlers
        └── slotCleanupWorker.ts              # Background worker expiring stale pending holds
```

---

## 📚 Package 4: Shared Types (`packages/shared-types`)

Zero-dependency type definitions shared across admin panel, mobile application, and backend.

```
packages/shared-types/
└── src/
    ├── index.ts                              # Unified type exports
    ├── enums.ts                              # UserRole, BookingStatus, ProviderType, etc.
    ├── models.ts                             # User, ProviderProfile, Booking, Category, Review
    ├── schemas.ts                            # Zod input validation schemas
    └── tokens.ts                             # Auth payload & token interfaces
```

---

## 🚀 Build & Verification Commands

All packages can be built individually or simultaneously from the project root:

```bash
# Build all workspaces
npm run build

# Build individual packages
npm --prefix packages/admin-web run build
npm --prefix packages/customer-provider-mobile run build
npm --prefix packages/backend-api run build
npm --prefix packages/shared-types run build
```

