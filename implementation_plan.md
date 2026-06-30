# Implementation Plan — Complete Production Features

We will implement Firebase Cloud Messaging (FCM), PhonePe Payment Gateway integration (Webhook & Initiation), Expo Router Protected Guards for the Rider App, and the complete NativeWind Driver Dashboard with daily earnings cards and status telemetry.

## Proposed Changes

### Component 1: Server Backend

#### [NEW] [fcm.ts](file:///h:/Users/manoj/Downloads/namma/apps/server/src/services/fcm.ts)
- Create Firebase Admin Singleton and messaging dispatch service.
- Handle ride offers to drivers, status updates to riders, and generic notification broadcasts.
- Prune stale FCM tokens on failure.

#### [NEW] [phonepe.ts](file:///h:/Users/manoj/Downloads/namma/apps/server/src/services/phonepe.ts)
- Verify X-VERIFY signature from PhonePe webhook.
- Generate PhonePe payment initiation payloads (wallet top-ups).

#### [NEW] [auth.ts](file:///h:/Users/manoj/Downloads/namma/apps/server/src/middleware/auth.ts)
- Implement `authGuard` middleware for JWT verification in Hono.

#### [NEW] [payment.ts](file:///h:/Users/manoj/Downloads/namma/apps/server/src/routes/payment.ts)
- Implement PhonePe/Razorpay Webhooks and Wallet Top-up initiation / FCM registration endpoints.

#### [MODIFY] [index.ts](file:///h:/Users/manoj/Downloads/namma/apps/server/src/index.ts)
- Register `paymentRouter` at `/api/payments`.
- Implement authenticated `/api/driver/dashboard`, `/api/driver/status`, and `/api/driver/location` endpoints.

---

### Component 2: Rider App (Expo Router Restructuring)

#### [NEW] [storage.ts](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/src/lib/storage.ts)
- Utility for session tokens and user data using AsyncStorage with in-memory/web support.

#### [NEW] [auth-context.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/src/lib/auth-context.tsx)
- Session provider wrapping JWT validation, base64 decoding helper, and state management.

#### [NEW] [ProtectedRoute.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/src/components/ProtectedRoute.tsx)
- Route guard component redirecting unauthorized or wrong-role users.

#### [NEW] [_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/_layout.tsx)
- Root Expo Router stack routing.

#### [NEW] [(auth)/_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(auth)/_layout.tsx)
- Layout for guest screens (login / OTP verification).

#### [NEW] [(auth)/index.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(auth)/index.tsx)
- Phone authentication screen.

#### [NEW] [(auth)/verify.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(auth)/verify.tsx)
- OTP verification screen.

#### [NEW] [(tabs)/_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(tabs)/_layout.tsx)
- Layout for authenticated tabs.

#### [NEW] [(tabs)/home.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(tabs)/home.tsx)
- Rider booking screen (migrated from old index.tsx).

#### [NEW] [(tabs)/bookings.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(tabs)/bookings.tsx)
- Trips history list.

#### [NEW] [(tabs)/profile.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/(tabs)/profile.tsx)
- Rider profile details and logout button.

#### [NEW] [track.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/track.tsx)
- Live ride tracking screen.

#### [NEW] [sos.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/sos.tsx)
- SOS screen.

#### [NEW] [payment.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/payment.tsx)
- Complete payment view.

#### [DELETE] [index.tsx](file:///h:/Users/manoj/Downloads/namma/apps/rider-app/app/index.tsx)
- Remove single-screen mock since router takes over.

---

### Component 3: Driver App (Expo Router Restructuring)

#### [NEW] [storage.ts](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/src/lib/storage.ts)
- Session token and profile helper.

#### [NEW] [api.ts](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/src/lib/api.ts)
- API client handling auth headers.

#### [NEW] [auth-context.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/src/lib/auth-context.tsx)
- Session provider for the driver.

#### [NEW] [ProtectedRoute.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/src/components/ProtectedRoute.tsx)
- Route guard component redirecting unauthorized or wrong-role drivers.

#### [NEW] [_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/_layout.tsx)
- Root layout router configuration.

#### [NEW] [(auth)/_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(auth)/_layout.tsx)
- Driver guest navigation.

#### [NEW] [(auth)/index.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(auth)/index.tsx)
- Driver phone authentication screen.

#### [NEW] [(auth)/verify.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(auth)/verify.tsx)
- Driver OTP verification screen.

#### [NEW] [(tabs)/_layout.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(tabs)/_layout.tsx)
- Driver authenticated tab shell.

#### [NEW] [(tabs)/index.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(tabs)/index.tsx)
- Full Driver Dashboard with earnings, status, and alerts.

#### [NEW] [(tabs)/wallet.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(tabs)/wallet.tsx)
- Wallet balance, transaction history, and PhonePe initiation.

#### [NEW] [(tabs)/kyc.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(tabs)/kyc.tsx)
- KYC verification page.

#### [NEW] [(tabs)/profile.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/(tabs)/profile.tsx)
- Driver profile and log out option.

#### [DELETE] [index.tsx](file:///h:/Users/manoj/Downloads/namma/apps/driver-app/app/index.tsx)
- Remove single-screen mock.

---

## Verification Plan

### Automated Verification
- Verify that code builds successfully across the monorepo.
- Ensure typechecking passes.

### Manual Verification
- Verify Hono endpoints:
  - Token registration `/api/payments/fcm/register`
  - PhonePe initiate topup `/api/payments/wallet/topup/initiate`
  - Webhook `/api/payments/phonepe/webhook`
- Verify Expo Router navigation logic.
