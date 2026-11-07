# QUICK APPOINTMENTS — REST API SPECIFICATION

## Base URL
`http://localhost:4000/api`

## Authentication
Bearer JWT token in `Authorization: Bearer <TOKEN>` header.

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/otp/request` | Request mobile verification OTP | Public |
| `POST` | `/auth/otp/verify` | Verify OTP & receive JWT access + refresh tokens | Public |
| `POST` | `/auth/switch-role` | Switch between `CUSTOMER` and `PROVIDER` active role | Authenticated |
| `GET` | `/auth/me` | Retrieve profile and role memberships | Authenticated |
| `GET` | `/catalog/categories` | Retrieve 4 launch categories with service count | Public |
| `GET` | `/catalog/services` | Query services by category ID or keyword | Public |
| `GET` | `/providers` | List approved & active providers | Public |
| `GET` | `/providers/:id/slots` | Calculate open time slots for date (excludes breaks) | Public |
| `POST` | `/bookings/reserve` | Hold 10-minute temporary reservation lock | Customer |
| `POST` | `/bookings/confirm` | Confirm booking & generate invoice reference | Customer |
| `GET` | `/bookings/customer` | List authenticated customer bookings | Customer |
| `GET` | `/bookings/provider` | List provider appointment queue | Provider |
| `PATCH` | `/bookings/:id/status`| Update status (`COMPLETED`, `CANCELLED`) | Provider / Admin |
| `GET` | `/provider/earnings` | Net earnings, gross volume & settlement history | Provider |
| `GET` | `/admin/metrics` | SaaS KPIs (Revenue, Commission, KYC count) | Admin |
| `POST` | `/admin/providers/:id/verify` | KYC Approval or Rejection with audit stamp | Admin |
| `POST` | `/payments/webhook` | Gateway webhook with signature & idempotency guard | Public (Signed) |
| `POST` | `/payments/refund` | Issue full or partial refund with ledger reversal | Admin |

