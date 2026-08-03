# Phase 2 Hotfix 2 — Razorpay Web Reconciliation

This hotfix recovers a successful Razorpay card payment when Razorpay closes
its web checkout without invoking the JavaScript success handler.

Security behaviour:

- The backend fetches payments directly from Razorpay using the stored order ID.
- A payment is accepted only after the stored order ID, amount, currency and
  card method match the Razorpay response.
- Only a Razorpay `captured` payment is marked `PAID`.
- No database row is manually promoted to `PAID`.

Files changed:

- `backend/src/main/java/com/zincycorporation/service/PaymentService.java`
- `frontend/app/client-setup/payment/payment.tsx`
- `frontend/src/utils/razorpayWeb.ts`

No database migration or environment-variable change is required.
