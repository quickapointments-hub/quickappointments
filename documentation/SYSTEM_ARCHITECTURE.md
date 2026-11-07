# QUICK APPOINTMENTS — TECHNICAL SYSTEM ARCHITECTURE

## 1. System Topology Overview

```mermaid
flowchart TD
    subgraph Clients["Frontend Clients"]
        MobileApp["Customer & Provider App (React Native / Web Responsive)<br/>• Role Switcher (Customer & Provider)<br/>• Service Discovery & Slot Booking<br/>• Provider Cockpit & Schedule Management"]
        AdminWeb["Admin Web Console (React + Vite + Tailwind)<br/>• KYC Verification & Providers<br/>• Catalog & Commission Engine<br/>• Financials & Audit Logs"]
    end

    subgraph API_Gateway["Central Backend API (Node.js + Express + TypeScript)"]
        AuthModule["Auth & Session Guard (JWT + Refresh + OTP)"]
        CatalogModule["Dynamic Catalog & Categories"]
        AvailabilityModule["Slot Availability Engine"]
        BookingEngine["Booking Engine & Concurrency Lock"]
        PaymentModule["Payment & Webhook Reconciliation"]
        NotificationModule["In-App Notification Dispatcher"]
        AdminModule["SuperAdmin & Reporting Module"]
    end

    subgraph Persistence["Storage & Database Layer"]
        DB[("Relational Database (Prisma ORM)<br/>Users, Roles, Slots, Bookings, Payments, Audits")]
        Storage[("Secure Document Storage<br/>KYC ID Proofs, Service Photos")]
    end

    MobileApp -->|REST / JSON API| API_Gateway
    AdminWeb -->|Admin REST API| API_Gateway
    API_Gateway --> DB
    API_Gateway --> Storage
```

---

## 2. Monorepo Structure

```
quick-appointments/
├── assets/
│   └── branding/
│       └── logo.png              # Official extracted brand logo
├── documentation/                # Complete technical and product docs
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   └── DESIGN_SYSTEM.md
├── packages/
│   ├── shared-types/             # Universal DTOs, Enums, Zod validation schemas, Design Tokens
│   │   ├── src/
│   │   │   ├── tokens.ts         # Brand colors, typography & spacing tokens
│   │   │   ├── models.ts         # User, Provider, Booking, Service interfaces
│   │   │   └── schemas.ts        # Zod request validators
│   │   └── package.json
│   ├── backend-api/              # Node.js + Express + TypeScript + Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Relational schema with migrations
│   │   ├── src/
│   │   │   ├── controllers/      # Handlers for Auth, Catalog, Bookings, Admin
│   │   │   ├── middleware/       # RBAC, Rate-Limiting, Concurrency lock
│   │   │   ├── services/         # Booking transaction & Slot reservation engine
│   │   │   └── server.ts         # Entry point & API routes
│   │   └── package.json
│   ├── admin-web/                # Modern React + Vite + Tailwind + Lucide SaaS Admin
│   │   ├── src/
│   │   │   ├── components/       # Shadcn UI-styled tables, modals, charts
│   │   │   ├── pages/            # Dashboard, KYC, Catalog, Bookings, Finance
│   │   │   ├── hooks/            # TanStack Query data hooks
│   │   │   └── App.tsx
│   │   └── package.json
│   └── customer-provider-mobile/ # Dual-mode Customer/Provider Mobile application
│       ├── src/
│       │   ├── customer/         # Discovery, Catalog, Slot picker, Checkout
│       │   ├── provider/         # Schedule settings, KYC status, Earnings, Bookings
│       │   ├── shared/           # Auth screen, Role Switcher, UI components
│       │   └── App.tsx
│       └── package.json
└── package.json                  # Root workspace configuration
```

---

## 3. High-Concurrency Slot Reservation Flow

To satisfy **Rule 9 & Rule 10 (Prevent double booking through concurrency-safe transactions & temporary reservations with expiration)**:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer App
    participant API as Backend API
    participant Lock as Concurrency / Reservation Engine
    participant DB as Relational Database
    actor Provider as Provider App

    Customer->>API: GET /api/providers/:id/slots?date=YYYY-MM-DD
    API->>DB: Query working hours, breaks & existing reservations
    DB-->>API: Active slots & booked slots
    API-->>Customer: Returns available time slots

    Customer->>API: POST /api/bookings/reserve (providerId, serviceId, slotTime)
    critical Concurrency Check & Temporary Hold
        API->>DB: Begin Serializable Transaction
        API->>DB: SELECT * FROM slot_reservations WHERE slot_time = X FOR UPDATE
        alt Slot Already Reserved or Confirmed
            API-->>Customer: 409 Conflict: "Slot just booked by another user"
        else Slot Free
            API->>DB: INSERT INTO slot_reservations (expires_at = NOW() + 10 MINS)
            API->>DB: Commit Transaction
            API-->>Customer: 201 Created: Reservation Token (10m countdown)
        end
    end

    Customer->>API: POST /api/bookings/confirm (reservationToken, paymentMethod)
    API->>DB: Verify reservation token has not expired
    API->>DB: Convert reservation into CONFIRMED Booking & generate Invoice
    API-->>Customer: 200 OK: Booking Confirmed & Ref #
    API--)Provider: Instant Push & In-App Notification of new appointment
```

