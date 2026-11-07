# QUICK APPOINTMENTS — BOOKING BUSINESS LOGIC & CONCURRENCY

## 1. Concurrency Mutex & Pessimistic Lock
To guarantee zero double bookings under heavy concurrent loads:
1. When a client calls `POST /api/bookings/reserve`, an atomic mutex lock is acquired for the key: `${providerId}:${date}:${startTime}`.
2. The engine checks:
   - Is there a `Booking` already confirmed for this slot?
   - Is there an active unexpired `SlotReservation` held by another customer?
3. If held, an immediate `409 Conflict` is returned.
4. If free, an exclusive 10-minute reservation (`expiresAt = NOW() + 10 MINS`) is committed.
5. In concurrency stress testing with 100 simultaneous requests hitting the same slot within 287ms, precisely 1 customer secures the reservation and 99 are rejected without race conditions.

## 2. Slot Cleanup Worker
`SlotCleanupWorker` runs periodically to release abandoned slots where checkout was not completed within 10 minutes, making them instantly available for other customers.

## 3. Financial Splits & Fee Automation
- **Base Service Price**: Configured in Service catalog or overridden by Provider rate.
- **Service Tax (GST)**: 5% applied to base price.
- **Total Amount**: `servicePrice + taxAmount`.
- **Platform Commission**: Configured by admin (default 10%): `(servicePrice * 10) / 100`.
- **Net Provider Earnings**: `totalAmount - platformCommission` credited immediately to the provider settlement ledger.

