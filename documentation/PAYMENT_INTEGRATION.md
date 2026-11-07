# QUICK APPOINTMENTS — PAYMENT GATEWAY INTEGRATION

## 1. Razorpay Gateway Architecture
- **Order Creation**: Generated exclusively by backend server (`POST /api/payments/create-order`). Mobile clients never generate order amounts or fee calculations.
- **Cryptographic Signature Verification**:
  $$\text{HMAC-SHA256}(\text{order\_id} \mathbin{\Vert} \text{payment\_id},\; \text{secret})$$
- **Webhook Processing**:
  - Validates `x-razorpay-signature` against raw payload.
  - Idempotency guard: Checks transaction table for order ID. If already marked `PAID`, duplicate webhooks return success without double-crediting.
  - Event `payment.captured`: Updates booking status to `PAID` and sets payment reference.
  - Event `payment.failed`: Flags transaction as `FAILED`.
- **Refund Policy & Reversal**:
  - Full refund reverses the booking status to `REFUNDED`.
  - Reverses provider earnings ledger to prevent payout for unfulfilled appointments.

