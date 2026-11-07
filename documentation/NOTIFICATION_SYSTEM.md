# QUICK APPOINTMENTS — NOTIFICATION SYSTEM

## 1. Notification Event Dispatcher
The notification engine generates events across the booking lifecycle:

| Event Trigger | Recipient | Notification Content |
| :--- | :--- | :--- |
| **Booking Confirmed** | Customer | "Appointment Confirmed! Ref: QA-XXXXXX-XXX" |
| **Booking Request** | Provider | "New Booking for [Service] on [Date] @ [Time]" |
| **KYC Approved** | Provider | "Account Verified & Activated! You are now live." |
| **KYC Needs Info** | Provider | "Verification Update: [Reason provided by admin]" |
| **Status Update** | Customer | "Your appointment status is now [COMPLETED/CANCELLED]" |

## 2. Delivery Channels
- **In-App Notification Feed**: Stored in `Notification` table with `isRead` flag and JSON payload.
- **Push Notification Integration**: Ready for Firebase Cloud Messaging (FCM) / Apple APNs.

