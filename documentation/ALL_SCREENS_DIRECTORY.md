# QUICK APPOINTMENTS — COMPLETE SCREENS & WORKFLOW DIRECTORY

A complete catalog of all implemented screens, modal flows, and operational cockpits across the **Admin Web Application** and the **Customer & Provider Mobile Application**.

---

## Part 1: Admin Web Application (`packages/admin-web`)

| Screen / View Name | Route / Identifier | Key Features & Functional Controls | Connected Backend APIs |
| :--- | :--- | :--- | :--- |
| **1. Executive Dashboard** | `currentTab === 'dashboard'` | • **6 Primary KPI Cards**: Gross Processed Volume, Platform Commission (10%), Total Appointments, Pending KYC Count, Active Providers, Total Customers.<br/>• **Pending KYC Warning Banner**: Direct shortcut to compliance desk.<br/>• **Recent Appointments Feed**: Real-time table with reference IDs, gross amount, and fee split. | `GET /api/admin/metrics`<br/>`GET /api/admin/bookings` |
| **2. Provider KYC & Verification Desk** | `currentTab === 'verification'` | • **Split Master-Detail Layout**: Pending queue on left, document inspector on right.<br/>• **Document Inspector**: Government ID Proofs (Aadhaar/PAN), Trade Licenses with status stamps.<br/>• **Administrative Decision Buttons**: 1-click **Approve & Go Live** or **Reject Application**.<br/>• **Rejection Reason Modal**: Captures audit reason and dispatches notification to provider. | `GET /api/admin/providers`<br/>`POST /api/admin/providers/:id/verify` |
| **3. Master Bookings & Appointments Ledger** | `currentTab === 'bookings'` | • **Status Filter Tabs**: `ALL`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.<br/>• **Global Search**: Search by reference ID (`QA-XXXXXX-XXX`), customer phone, or provider name.<br/>• **Financial Split Columns**: Customer total, 10% platform commission, net provider credit. | `GET /api/admin/bookings` |
| **4. Registered Service Providers Directory** | `currentTab === 'providers'` | • **Provider Directory Grid**: Individual and Business cards with rating averages, review count, and city.<br/>• **Live Acceptance Status**: Displays whether provider slots are currently active or paused.<br/>• **Filter & Search Bar**: Search by business name, city, or phone. | `GET /api/admin/providers` |
| **5. Dynamic Category & Catalog Manager** | `currentTab === 'catalog'` | • **4 Launch Categories**: Salon & Grooming, Healthcare & Wellness, Home Repairs & AC, Auto Care & Detailing.<br/>• **Live Service Cards**: Base prices, duration minutes, active bookable indicators. | `GET /api/catalog/categories`<br/>`GET /api/catalog/services` |
| **6. Commissions, Revenue & Financials** | `currentTab === 'finance'` | • **Platform Financial Totals**: Gross processed volume vs net platform take-rate.<br/>• **Dynamic Commission Rule Engine**: Numeric percentage slider/input to adjust platform take-rate without hardcoded constants.<br/>• **Rate Rule History Ledger**: Immutable logs of past effective commission rates. | `GET /api/admin/metrics`<br/>`GET /api/admin/commission`<br/>`POST /api/admin/commission` |
| **7. System Compliance Audit Logs** | `currentTab === 'audit'` | • **Immutable Security Log Table**: Action name (`PROVIDER_APPROVED`, `REFUND_ISSUED`), target entity ID, actor name, timestamp, and JSON audit payload. | `GET /api/admin/audit-logs` |
| **8. System & Platform Settings** | `currentTab === 'settings'` | • **Platform Configuration**: Concurrency hold duration (10 minutes), SMS OTP gateway parameters, payment signature verifier, and encryption protocols. | Platform configuration state |
| **9. Navigation Sidebar & App Header** | Shared Layout | • **Official Brand Logo Header** (`/logo.png`).<br/>• **Pending KYC Counter Badge**.<br/>• **Live Core API Status Pill** (`Connected` / `Offline`). | `GET /api/health` |

---

## Part 2: Customer Mobile Application (`packages/customer-provider-mobile`)

Operates in **Customer Mode** when `activeRole === 'CUSTOMER'`:

| Screen / Modal Name | Component File | Key Features & Functional Controls |
| :--- | :--- | :--- |
| **1. Splash Launch Screen** | `SplashScreen.tsx` | • Official 3D perspective calendar logo with Apple green highlight slots.<br/>• Dark obsidian backdrop (`#111114`) with launch animation and session check. |
| **2. Mobile OTP Authentication Screen** | `AuthScreen.tsx` | • Mobile number input (`+91XXXXXXXXXX`) with SMS OTP request.<br/>• 6-digit OTP verification input with dev-mode quick autofill (`123456`).<br/>• Mode preference selector (Customer / Provider). |
| **3. Customer Home Dashboard** | `CustomerHomeScreen.tsx` | • **Top Brand Bar**: Official logo, city location picker (Mumbai, Bengaluru, Delhi NCR, Chennai), and notification bell.<br/>• **Greeting Banner**: Personalized customer greeting with dark card aesthetic.<br/>• **Dynamic Search Bar**: Instant keyword filtering across services.<br/>• **4 Launch Categories**: Salon & Grooming, Healthcare & Wellness, Home Repairs, Auto Care.<br/>• **Popular Services Carousel**: Service price, duration minutes, and "Book" button.<br/>• **Top Verified Providers**: Provider rating stars, review count, and city. |
| **4. Multi-Step Concurrency Booking Modal** | `BookingModal.tsx` | • **Step 1 (Provider & Date)**: Provider card and date selector.<br/>• **Step 2 (Real-Time Slot Matrix)**: Server-generated slots excluding provider lunch breaks (13:00–14:00) and closed days.<br/>• **Step 3 (Pessimistic Concurrency Lock)**: Reserves slot for **10 minutes**; displays active countdown timer (`09:59` → `00:00`).<br/>• **Step 4 (Order Review & Taxes)**: Itemized service price, 5% GST tax calculation, special instruction notes.<br/>• **Step 5 (Payment Selection)**: Pay on Service (Cash) or Razorpay UPI.<br/>• **Step 6 (Confirmation Card)**: Unique reference code (`QA-XXXXXX-XXX`) with instant notification. |
| **5. Customer Appointments Screen** | `CustomerBookingsScreen.tsx` | • **3 Filter Tabs**: `Upcoming`, `Completed`, `Cancelled`.<br/>• **Appointment Cards**: Service name, provider name, date, slot time range, payment status, and total amount. |
| **6. Customer Profile & Role Switcher** | `CustomerProfileScreen.tsx` | • Customer name, phone number, and active role pill.<br/>• **Dual-Role Switcher Card**: 1-tap transition from Customer Mode to Provider Cockpit.<br/>• Security & privacy policies, support link, and logout button. |

---

## Part 3: Provider Mobile Application (`packages/customer-provider-mobile`)

Operates in **Provider Mode** when `activeRole === 'PROVIDER'`:

| Screen / Cockpit Name | Component File | Key Features & Functional Controls |
| :--- | :--- | :--- |
| **1. Provider Operations Cockpit** | `ProviderDashboardScreen.tsx` | • **Active Status Pill**: "Active & Live" verification badge.<br/>• **Total Net Earnings Card**: Displays net earnings with shortcut to financial ledger.<br/>• **Schedule Shortcut**: Quick link to working hours and break settings.<br/>• **Live Appointment Queue**: Real-time incoming bookings with **Mark Completed** and **Cancel** action buttons. |
| **2. Schedule & Availability Manager** | `ProviderAvailabilityScreen.tsx` | • **Weekly Schedule Matrix**: Monday through Saturday working hours (09:00–19:00).<br/>• **Mid-Day Lunch Breaks**: 13:00–14:00 lunch window automatically excluded from customer booking matrix.<br/>• **Closed Day Toggles**: 1-tap button to mark any day open or closed (Sunday closed by default). |
| **3. Earnings & Settlements Ledger** | `ProviderEarningsScreen.tsx` | • **Net Payout Balance**: Total balance available for payout.<br/>• **Financial Breakdown**: Gross customer transaction volume vs 10% platform commission deduction.<br/>• **Settlement Ledger Items**: Individual credit entries mapped to booking reference IDs. |
| **4. Provider Profile & Role Switcher** | `ProviderProfileScreen.tsx` | • Business name, verified specialist badge, and phone number.<br/>• **Dual-Role Switcher Card**: 1-tap transition back to Customer Mode.<br/>• KYC document hub, partner support, and session logout. |

---

## Part 4: Shared Mobile Container & Viewport Controls

| Component | File | Capabilities |
| :--- | :--- | :--- |
| **Device Frame Simulator** | `App.tsx` | • **Phone Shell Toggle**: Switches between realistic iPhone/Android device bezel (with notch and home indicator) and full-width responsive mode.<br/>• **One-Click Role Switcher**: Quick pill in top bar allowing instantaneous toggling between `CUSTOMER` and `PROVIDER` views for reviewers. |
| **Bottom Navigation Tabs** | `App.tsx` | • **Dynamic Navigation**: Automatically switches navigation items based on active role:<br/>- *Customer*: Discover, Bookings, Profile.<br/>- *Provider*: Cockpit, Schedule, Earnings, Account. |
