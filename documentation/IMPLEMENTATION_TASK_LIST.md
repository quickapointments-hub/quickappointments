# Quick Appointments — Implementation Blueprint Task List
**Document Source**: `Quick Appointments — Screen Flow & Implementation Blueprint (Nov 9, 2026 · @pavani)`  
**Current Date**: November 9, 2026  
**Status Key**:
- `[x]` = **Completed & Verified in Full-Stack Codebase**
- `[ ]` = **Pending / To be Implemented**

---

## Phase 1: Foundation & Data Architecture

### 1.1 Database Schema Extensions (Section 8)
- [x] Initial 21 production tables (`users`, `user_roles`, `otp_verifications`, `user_sessions`, `customer_profiles`, `provider_profiles`, `provider_documents`, `provider_working_hours`, `provider_branches`, `provider_staff`, `categories`, `services`, `provider_service_rates`, `slot_reservations`, `bookings`, `booking_status_history`, `payment_transactions`, `provider_earnings`, `commission_settings`, `notifications`, `audit_logs`)
- [x] Table: `reviews` (Rating 1-5, quick tags, text review max 500 chars, bookingId unique, customerId, providerId)
- [x] Table: `coupons` (Code, discount type, value, min order, max discount, usage limits, expiry)
- [x] Table: `refunds` (BookingId, amount, status: REQUESTED/PROCESSING/REFUNDED/FAILED, 48-hour deadline, gateway refund ID, admin remarks)
- [x] Table: `payout_batches` & `payout_items` (Settlement date, total amount, provider bank reference, status: PENDING/PROCESSED/FAILED)
- [x] Table: `provider_bank_accounts` (Account holder, bank name, account number, IFSC code, verified status)
- [x] Table: `cities` & `city_categories` (City name, state, lat/lng, active toggle, city-by-category enable/disable matrix)
- [x] Table: `support_tickets` & `ticket_messages` (Ticket number, user ID, booking reference, category, priority, status: OPEN/RESOLVED/ESCALATED, message thread)
- [x] Table: `device_tokens` (User ID, FCM/APNS token, device type, active toggle)
- [x] Table: `saved_addresses` (Customer ID, label, address line, city, pincode, GPS coordinates)
- [x] Tables: `provider_branches` & `provider_staff` (Multi-branch and multi-specialist staff management)

### 1.2 Shared Mobile Screens (S-01 to S-05)
- [x] **S-01 Splash**: Launch branding, version display, session token validation (`POST /api/auth/refresh`) and auto-routing to active mode
- [x] **S-02 Phone Login**: Mobile input (+91), validation (`^[6-9]\d{9}$`), SMS OTP request (`POST /api/auth/send-otp`)
- [x] **S-03 OTP Verification**: 6-box input, 30s resend timer, 5-attempt rate-limiting lockout (15 minutes)
- [x] **S-04 Profile Setup**: First-time login onboarding (Full name, optional email, city selector, GPS auto-detect, role selection card)
- [x] **S-05 Mode Switcher**: Header component, instant dual-role toggle (`CUSTOMER` ⇄ `PROVIDER`) without session loss

### 1.3 Admin Authentication & RBAC (A-01, A-16)
- [x] **A-01 Admin Login**: Dedicated admin authentication (`POST /api/admin/auth/login`), email & password, JWT + refresh tokens
- [x] **A-16 Admin Users & Roles**: SuperAdmin console to invite admins, assign roles (`SuperAdmin`, `Operations`, `Finance`, `Support`), role-based sidebar permission filtering

---

## Phase 2: Provider Supply & Onboarding (P-02 to P-08, A-03 to A-09)

### 2.1 Provider Mobile Screens
- [x] **P-01 Provider Cockpit / Dashboard**: Online/offline toggle, today's appointments, weekly earnings card, KYC status badge
- [x] **P-02 Onboarding: Business Details**: Entity selector (Individual vs Registered Business), bio, service radius slider, address with pin, email verification (`ProviderBusinessDetailsScreen.tsx`)
- [x] **P-03 Onboarding: KYC Documents**: Upload cards for Aadhaar/GST, PAN, bank account details for settlements (`ProviderKycUploadScreen.tsx`)
- [x] **P-04 KYC Status Tracker**: Stepper with `Pending` ➔ `Under Review` ➔ `Approved` or `Rejected` with admin remarks and re-upload button (`ProviderKycStatusScreen.tsx`)
- [x] **P-05 Branches Management (Businesses)**: Multi-branch list, Add Branch form (name, address, city, phone, active toggle) (`ProviderBranchesScreen.tsx`)
- [x] **P-06 Staff Specialists (Businesses)**: Staff list with photo, specialty, branch assignment, calendar view (`ProviderStaffScreen.tsx`)
- [x] **P-07 Weekly Schedule Engine**: 7-day matrix, open/close hours (09:00 - 19:00), lunch break window (13:00 - 14:00), closed day toggles
- [x] **P-08 My Services & Rates**: Category service list, custom price/duration inputs, two-tier approval chip (`PENDING`, `APPROVED`, `REJECTED`)

### 2.2 Admin Verification & Catalog Control
- [x] **A-03 KYC Queue**: Provider verification directory, status filter (`UNDER_REVIEW` default), waiting time counter
- [x] **A-04 KYC Review & Audit Desk**: Inline document viewer, checklist, 1-click `Approve`, `Request Info`, `Reject with Reason`, immutable audit entry
- [x] **A-05 Provider Directory**: Directory with filters, suspend/reactivate provider actions
- [x] **A-07 Categories & City Controls**: 4 Category list + second tab with city-by-category enable/disable matrix
- [x] **A-08 Master Services**: Master catalog templates, base price, standard duration, active toggles
- [x] **A-09 Rate Card Approvals Queue**: Queue of provider custom rate changes, price delta %, approve/reject actions

---

## Phase 3: Customer Discovery & 5-Minute Mutex Slot Engine (C-01 to C-05)

### 3.1 Customer Discovery Screens
- [x] **C-01 Home / Discovery Screen**: City selector chip with GPS auto-detect, 4 launch category cards with provider counts, verified provider badges
- [x] **C-02 Category Provider List Screen**: Header with category, filter bar (distance, rating, price, verified only), specialist provider cards (`CategoryProvidersScreen.tsx`)
- [x] **C-03 Search Screen**: Debounced search input (250ms), recent searches, results grouped into Services and Providers (`SearchScreen.tsx`)
- [x] **C-04 Provider Profile Screen**: Bio, experience years, service radius, verified shield, services rate card, reviews preview, "Book Now" sticky CTA
- [x] **C-05 Date & Slot Picker Screen**: Horizontal date strip skipping closed days, 30-min/60-min slot grid excluding lunch breaks and existing bookings

### 3.2 Concurrency Engine & Mutex Lock
- [x] In-memory pessimistic mutex locking (`AvailabilityService.acquireSlotLock`) on `{providerId}:{date}:{startTime}`
- [x] 5-minute temporary reservation hold with `expiresAt` timestamp
- [x] 409 `SLOT_TAKEN` response when a slot is contested simultaneously

---

## Phase 4: Booking Core & 5-Minute Provider SLA (C-06 to C-08, P-09, P-11)

### 4.1 Checkout & Hold
- [x] **C-06 Checkout & 5-Minute Hold Screen**: Active `05:00` countdown timer, booking summary, price breakdown (Base + 5% GST), payment selection
- [x] Coupon code validation (`POST /api/coupons/validate`) and discount deduction before commission
- [x] At-home service address selector (`saved_addresses`)
- [x] Razorpay / Cash on Service order creation & payment authorization workflow

### 4.2 5-Minute SLA Dispatch & Acceptance
- [x] **C-07 Awaiting Provider Screen**: 300-second provider acceptance countdown modal, animated waiting state, 4-second polling (`AwaitingProviderModal.tsx`)
- [x] **P-09 Incoming Request Screen (5-Min SLA)**: Full-screen modal with 300-second countdown ring, Accept / Reject buttons (`IncomingRequestModal.tsx`)
- [x] Atomic booking confirmation transition (`HELD` ➔ `AWAITING` ➔ `CONFIRMED` upon acceptance)

### 4.3 Confirmed Ticket & Anti-Fraud Service OTP
- [x] **C-08 Booking Ticket Screen (Confirmed)**: Prominent 6-digit Customer Service OTP display ("Share this only when provider arrives"), map link, call provider
- [x] **P-11 Booking Detail & OTP Completion**: Provider OTP entry field with numeric keypad, Verify button, 5-wrong-entry 15-minute lock, atomic completion and provider ledger credit (`BookingOtpModal.tsx`)

---

## Phase 5: Failure Paths, Re-Routing & 100% Refunds (C-10, C-11, A-10, A-11)

### 5.1 Failure Paths & Rerouting
- [x] **C-11 Alternative Providers Screen**: Triggered on SLA reject or 300-second expiry, displays "Provider unavailable", recommends nearest available providers, 1-click rebook with fresh hold (`AlternativeProvidersModal.tsx`)
- [x] Background job: 10-second reservation cleanup worker releasing expired holds
- [x] Background job: 10-second SLA timeout worker marking unaccepted requests `EXPIRED` and releasing slot locks

### 5.2 Customer Cancellation & 48-Hour 100% Refund
- [x] **C-10 Booking Detail & Cancellation Screen**: Status timeline, price breakdown, 1-click "Cancel Appointment" with 100% refund guarantee (hidden once OTP verified) (`CustomerBookingsScreen.tsx`)
- [x] **A-10 Bookings Master Ledger**: Full appointments table, status filters, pricing breakdown, transaction ID links
- [x] **A-11 Refunds Engine**: 48-hour refund processing, 100% payment gateway refund, automatic provider earning reversal, audit logging (`RefundsPage.tsx`)
- [x] Refund SLA alert: Visual red indicator for refunds pending > 36 hours (`RefundsPage.tsx`)

---

## Phase 6: Financial Settlement & Commission Engine (P-12, A-12, A-13)

### 6.1 Commission & Rates
- [x] 5.00% Platform Take-rate formula (`Eligible Service Amount * 0.05`)
- [x] Historical rate locking: Confirmed bookings preserve their confirmed rate regardless of subsequent platform rate updates
- [x] **A-12 Commission Settings Console**: Editable global rate, revenue-tier / category overrides, calculation preview

### 6.2 Provider Settlements
- [x] **P-12 Provider Earnings & Settlements Screen**: Gross volume, Platform fee (5%), Net balance, completed jobs ledger (`ProviderEarningsScreen.tsx`)
- [x] Netting cash jobs commission against future online payouts
- [x] **A-13 Payouts Management (T+1)**: Batch generation for completed bookings from previous day, bank transfer CSV export, "Mark as Paid" action with bank reference (`PayoutsPage.tsx`)

---

## Phase 7: Governance, Disputes, Reviews & Polish (C-12 to C-14, P-13, P-14, A-02, A-06, A-14, A-15)

### 7.1 Customer Reviews & Support
- [x] **C-12 Rate & Review Screen**: 5-star rating, quick tags ("On time", "Professional", "Clean"), 500-char review, verified completed booking guard (`ReviewModal.tsx`)
- [x] **P-13 Provider Reviews Screen**: Average rating, positive percentage breakdown, customer review list (`ProviderReviewsScreen.tsx`)
- [x] **C-13 In-App Notifications**: Real-time dispatch ledger for booking updates, cancellations, and refunds
- [x] **C-14 Account & Support Screen**: Tickets list, "Raise Support Ticket / Dispute" form, message thread history drawer (`CustomerSupportScreen.tsx`)
- [x] **P-14 Provider More & Settings Screen**: Bank account details, branch management, staff assignments, mode switch (`ProviderProfileScreen.tsx`)

### 7.2 Admin Governance & Support Desk
- [x] **A-02 Executive KPI Dashboard**: Real-time GMV, 5% retained commission, net provider payouts, pending KYC badge, recent bookings
- [x] **A-06 Customer Management Console**: Registered customer table, bookings & refund history, block/unblock actions
- [x] **A-14 Support & Disputes Console**: Dispute ticket queue from C-14, booking context drawer, reply thread, refund/escalate actions (`SupportPage.tsx`)
- [x] **A-15 Immutable Audit Logs**: Read-only log table capturing action, entity, admin ID, IP address, and JSON payload

---

## Phase 8: Hardening, Automated Tests & Verification

### Test Checklist
- [x] **Test 1**: Two simultaneous reserve calls for one slot: exactly one succeeds, the other gets 409 `SLOT_TAKEN`
- [x] **Test 2**: A hold left alone releases the slot at 5 minutes and returns to slot picker
- [x] **Test 3**: A request left alone expires at 300 seconds, voids payment authorization, and displays C-11 alternative providers
- [x] **Test 4**: A coupon of ₹100 on ₹1,000 gives ₹945 paid (with 5% GST), ₹45 commission, and ₹900 provider net
- [x] **Test 5**: A wrong OTP 5 times locks P-11 for 15 minutes; the right OTP completes the booking once only
- [x] **Test 6**: A commission change does not alter any earlier confirmed booking (rate locking)
- [x] **Test 7**: A cancelled booking appears in A-11 with a 48-hour deadline and reverses the provider earning
- [x] **Test 8**: A rejected rate card leaves the previous approved price live on C-04
- [x] **Test 9**: Each admin role sees only its permitted sidebar items, and backend API enforces RBAC
- [x] **Test 10**: Every approval, refund, and rate change creates an immutable `audit_logs` row
