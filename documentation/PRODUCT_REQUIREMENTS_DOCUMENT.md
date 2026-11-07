# QUICK APPOINTMENTS — PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Version**: 2.0  
**Scope**: Pan-India Multi-Role Booking Platform  
**Target Entities**: Customer Mobile, Provider Mobile, Admin Web Console, Backend Cloud API  

---

## 1. System Vision & Architecture
Quick Appointments delivers an enterprise appointment reservation network across India. The ecosystem consists of:
1. **Customer Application**: Discovery across 4 launch categories (*Saloon & Beauty*, *Healthcare*, *Education & Coaching*, *Skilled Workers*), real-time slot calendar, 5-minute request hold, multiple payment gateways, and OTP-based service receipt.
2. **Provider Application & Cockpit**: Solo specialist and registered business workflows, multi-staff calendar allocation, multi-branch geofencing, 5-minute request acceptance alert, OTP service verification, and T+1 financial payouts.
3. **Admin Web Console**: Four-tier governance (`SUPERADMIN`, `OPERATIONS_ADMIN`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`), Aadhaar/GST/Education KYC audit desk, service catalog curation, 5% commission engine, and 48-hour 100% refund processor.

---

## 2. Launch Categories & Service Structure
| Category Name | Slug | Typical Services Included |
|---|---|---|
| **Saloon & Beauty** | `saloon-and-beauty` | Haircut, beard styling, facial treatment, bridal makeup, salon spa |
| **Healthcare (Doctor Appointment)** | `healthcare-doctor-appointment` | General physician, pediatrics, physiotherapy, nutrition, dental consultation |
| **Education & Coaching** | `education-coaching` | 1-on-1 tutoring, competitive exam prep, language coaching, music/arts lessons |
| **Skilled Workers** | `skilled-workers` | Electricians, plumbers, HVAC technicians, carpentry, appliance maintenance |

---

## 3. High-Concurrency Slot Reservation & Provider SLA
- **5-Minute Reservation Mutex**: When a customer initiates a booking, a pessimistic mutex locks the provider slot for exactly **300 seconds** (`expires_at = NOW() + 5 minutes`).
- **5-Minute Manual Provider SLA**: Providers receive an instant push notification with a 5-minute countdown timer to accept or reject the booking.
- **Auto-Expiration & Alternative Recommendations**: If the provider does not respond within 300 seconds, the slot hold is released, the booking transitions to `EXPIRED`, and the customer is presented with alternative available providers in the same category and vicinity.
- **Double Booking Guard**: The backend re-checks slot availability atomically upon final confirmation, rejecting any conflicting reservation with HTTP 409 Conflict.

---

## 4. Anti-Fraud OTP Service Protocol
1. Upon booking confirmation, the customer app generates a secure 6-digit **Service Verification OTP** (`service_otp`).
2. When the provider arrives / begins service delivery, the provider enters the customer's OTP into their mobile cockpit.
3. Successful OTP verification transitions the booking to `IN_PROGRESS` or `COMPLETED`.
4. Only verified `COMPLETED` bookings unlock provider earnings in the payout ledger and allow customer reviews.

---

## 5. Financial Architecture & Commission Model
- **Platform Fee**: **5.00% Default Commission** on the post-discount booking amount:
  $$\text{Platform Commission} = (\text{Service Price} - \text{Discounts}) \times 0.05$$
  $$\text{Provider Earnings} = (\text{Service Price} - \text{Discounts}) - \text{Platform Commission}$$
- **Rate Locking**: Confirmed bookings permanently retain the commission rate active at confirmation time.
- **Cancellation & 100% Refund**: Customers can cancel before service completion and receive a 100% refund processed within 48 hours to their original payment source.
- **Provider Settlement**: Net provider balance is disbursed on a T+1 (next day) schedule via the Admin Finance Console.
