# QUICK APPOINTMENTS — BUSINESS REQUIREMENTS CLARIFICATION (BRD)
**Document Status**: Official Approved Specification  
**Version**: 2.0  
**Target Coverage**: Pan-India Platform Launch  

---

## 1. Executive Summary & Core Platform Vision
**Quick Appointments** is a multi-sided appointment booking marketplace connecting service seekers (Customers) with qualified service specialists (Providers), managed by a centralized Administrative Console (Admin Web Panel).
- **Customer Application**: Seamless location-based discovery, category browsing, transparent pricing, verified reviews, 5-minute provider request & confirmation, secure payments, and booking management.
- **Provider Cockpit**: Business profile management, Aadhaar/GST/education KYC, service catalog publishing, multi-staff & multi-branch calendar scheduling, 5-minute request acceptance, OTP-verified service delivery, and next-day payout ledger.
- **Admin Console**: Multi-tier RBAC (SuperAdmin, Operations, Finance, Support), KYC audit desk, service publishing approval, booking oversight, 48-hour 100% refund processor, dynamic commission controls (default 5%), and Pan-India category availability.

---

## 2. Definitive Business Clarification Matrix (28 Core Decisions)

### Section A: Launch & Market Expansion
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **1** | **Initial Service Categories** | **4 Launch Categories**: <br>1. *Saloon & Beauty* (`saloon-and-beauty`)<br>2. *Healthcare (Doctor Appointment)* (`healthcare-doctor-appointment`)<br>3. *Education & Coaching* (`education-coaching`)<br>4. *Skilled Workers* (`skilled-workers`) |
| **2** | **Launch Territory** | **Pan-India**: Architecture natively supports multi-state and multi-city operations with manual city selection and auto-GPS proximity discovery. |
| **3** | **Supported Provider Types** | Both **Individual Specialists** (freelancers/solo practitioners) and **Registered Businesses** (salons, clinics, institutes, agency contractors). |
| **4** | **Expansion Strategy** | Phased onboarding across Indian Tier-1, Tier-2, and Tier-3 urban clusters, with dynamic city-level category enabling/disabling in Admin. |

---

### Section B: Applications & Identity Management
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **5** | **Role Switching** | **Unified Single Account**: Users seamlessly toggle between **Customer Mode** and **Provider Mode** inside one mobile app without logging out. |
| **6** | **Mandatory KYC Documents** | Phone number (OTP verified), Google/Email, **GST or Aadhaar Card**, and **Education / Professional Certifications**. |
| **7** | **Service Publishing Approval** | **Two-Tier Verification**: Admin must verify the provider profile **AND** explicitly approve custom services before they become publicly searchable. |
| **8** | **Multi-Staff & Multi-Branch** | Registered businesses can manage **multiple staff members**, individual staff working hours, and **multiple branch locations**. |

---

### Section C: Booking Lifecycle & Concurrency Protocol
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **9** | **Provider Response Window** | **Strict 5-Minute Window**: Provider has 300 seconds to manually accept or reject the customer's appointment request. |
| **10** | **Unresponsive Requests** | **Automatic Expiry**: If no response is received in 5 minutes, request transitions to `EXPIRED` and slot lock is immediately released. |
| **11** | **Slot Reservation Mutex** | **5-Minute Temporary Lock**: Concurrency mutex locks the provider slot for exactly 300 seconds to prevent double-booking collisions while awaiting provider action. |
| **12** | **Alternative Recommendations** | If request is rejected or expires, the customer is instantly recommended **nearby alternative providers** with matching available slots. |
| **13** | **Cancellation & Refund Policy** | **100% Refund Anytime**: Customers can cancel anytime before service delivery and receive a 100% full refund processed within 48 hours to original payment method. |
| **14** | **Review & Rating Eligibility** | Ratings and reviews can **only** be submitted after an appointment is verified as `COMPLETED`. |
| **15** | **OTP-Based Service Completion** | **Anti-Fraud Security**: Service start/completion requires the provider to enter a 6-digit **Customer OTP** generated on the customer's screen. |

---

### Section D: Payments, Financial Ledger & Commissions
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **16** | **Customer Payment Methods** | **All Options Supported**: Full Online Payment (UPI, Cards, Netbanking via Razorpay), Advance Deposit, and Cash on Service. |
| **17** | **Platform Commission Rate** | **5.00% Default Platform Commission** (dynamically adjustable in Admin Panel; revenue-tiered rules supported). |
| **18** | **Commission Calculation Base** | Calculated strictly on **post-discount eligible amount** (`total_amount - discounts`). |
| **19** | **Rate Change Locking** | When platform commission rates change, existing confirmed bookings **permanently retain the rate** locked at confirmation time. |
| **20** | **Provider Settlement Schedule** | Net provider earnings (`Gross - 5% Commission`) settled **Next Day (T+1)** / within 48 hours via Admin Finance Console. |
| **21** | **Platform Monetization** | 1. Booking commission (5%)<br>2. Provider subscription tiers (monthly/annual)<br>3. Paid featured promotions and top-rank placement. |

---

### Section E: Geographic Controls & Discovery
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **22** | **Location Discovery** | Dual-mode: Automatic GPS coordinates lookup + Manual city/postal search bar. |
| **23** | **Provider Service Areas** | Configurable service radius in kilometers (`service_radius_km`) and multi-branch radius geofences. |
| **24** | **Regional Category Toggles** | Admin has granular controls to activate or suspend specific categories per city/state. |

---

### Section F: Admin Console, Security & Governance
| # | Parameter | Clarified Business Decision |
|---|---|---|
| **25** | **Administrative Roles** | 1. **Super Admin** (Full unrestricted platform access)<br>2. **Operations Admin** (KYC verification, category catalog, provider approvals)<br>3. **Finance Admin** (Commissions, provider payouts, 48-hr 100% refund authorization)<br>4. **Support Admin** (Disputes, booking cancellations, customer communication) |
| **26** | **Granular Permissions** | Explicit permission guards for KYC approval, service publishing, refund processing, and payout disbursements. |
| **27** | **Executive KPI Dashboard** | Live metrics: Total & Completed Bookings, Cancellation Rate, Gross Merchandise Value (GMV), 5% Platform Revenue, Net Provider Earnings, and Pending Payouts. |
| **28** | **Promotions Engine** | Native support for promotional promo codes, referral discounts, sponsored provider badges, and seasonal banners. |

