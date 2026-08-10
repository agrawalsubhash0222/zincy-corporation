# Phase 3 — Refunds, failures, pending payments, and reconciliation

This package must be applied **after Phase 2 and migration 003** on branch
`feature/payment-refunds-reconciliation`.

It adds a production-oriented, full-refund workflow for both existing payment
providers:

- PhonePe Standard Checkout (UPI only)
- Razorpay Checkout (credit/debit cards only)
- automatic reconciliation of pending, failed, and locally expired payments
- automatic full refunds for duplicate captures, forbidden payment methods,
  and captures discovered after a local failure/expiry
- admin-created full refunds for customer or service cancellation
- refund polling, webhook handling, retry controls, and immutable audit events

## Safety rules

1. The frontend never decides that money was paid or refunded. The backend
   verifies every final state directly with the gateway.
2. A browser error, redirect failure, or timeout never starts a refund by
   itself. The backend first confirms that the gateway actually captured the
   payment.
3. A genuine failed payment is not refunded because there is no confirmed
   capture to refund. Failed/expired attempts with a gateway order are polled
   for 24 hours so a late capture is still discovered.
4. A captured payment remains blocked while its refund is REQUESTED, PENDING,
   FAILED, or REVIEW_REQUIRED. The payment becomes REFUNDED only after the
   gateway confirms the full refund.
5. Only one logical refund record is allowed for a payment. Gateway request
   identifiers are unique, and retries are idempotent.
6. Amount, currency, order, payment, and refund-reference mismatches stop in
   REVIEW_REQUIRED. The code does not blindly refund an unverified reference.
7. Refunds in this phase are full refunds only. Partial refunds are
   intentionally not exposed.

## State outcomes

| Situation | Payment state | Refund action | Customer action |
|---|---|---|---|
| Gateway confirms payment failure | FAILED | No refund; keep reconciling during grace window | Retry only after the active attempt is released |
| Gateway is still processing | PENDING | No refund | Wait or use Check payment status |
| Browser shows failure but gateway later confirms capture | REVIEW_REQUIRED | Automatic full refund | Do not pay again until refund finishes |
| Duplicate payment captured | REVIEW_REQUIRED for duplicate | Automatic full refund of duplicate | Existing canonical PAID order remains valid |
| PhonePe uses a non-UPI method | REVIEW_REQUIRED | Automatic full refund | Retry using the permitted method after refund |
| Admin cancels a captured order | PAID while refund is open | Admin full refund | Wait for gateway confirmation |
| Refund still processing | PAID or REVIEW_REQUIRED | Poll/webhooks continue | Do not pay again |
| Refund failed | PAID or REVIEW_REQUIRED | Admin investigation/retry | Contact support; do not pay again |
| Gateway confirms refund | REFUNDED | Audit event recorded | A permitted new payment may be attempted |

## Files added or changed

- `database/004_payment_refunds_reconciliation.sql`
- refund entities, enums, repositories, DTOs, service, controller, and tests
- provider refund clients for PhonePe and Razorpay
- scheduled payment/refund reconciliation
- payment webhook routing for refund events
- payment-success UI for pending/refund/review states
- reconciliation properties and Compose environment forwarding

## Step 1 — Extract at repository root

Extract the Phase 3 zip into:

```text
C:\Personal\Work\ZincyCorporation
```

Choose **Replace files in the destination**. The archive contains only files
that belong at or below the repository root.

Then verify:

```bash
cd /c/Personal/Work/ZincyCorporation

test -f database/004_payment_refunds_reconciliation.sql \
  && echo "Refund migration present"

test -f backend/src/main/java/com/zincycorporation/service/PaymentRefundService.java \
  && echo "Refund service present"

test -f backend/src/main/java/com/zincycorporation/service/PaymentReconciliationService.java \
  && echo "Reconciliation service present"

git status --short
```

Do not copy `.env.local` into Git and do not put gateway secrets in any Java,
TypeScript, properties, SQL, or README file.

## Step 2 — Run the local migration

Run this from the repository root while the local MySQL container is running:

```bash
cd /c/Personal/Work/ZincyCorporation

docker exec -i zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  < database/004_payment_refunds_reconciliation.sql
```

The migration is designed to be safe if it is accidentally run again.

Verify it:

```bash
docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
    SHOW TABLES LIKE '\''payment_refunds'\'';
    SHOW TABLES LIKE '\''payment_refund_events'\'';
    SHOW COLUMNS FROM payment_orders LIKE '\''next_reconcile_at'\'';
    SHOW INDEX FROM payment_refunds WHERE Key_name IN (
      '\''uk_refund_payment_order'\'',
      '\''uk_refund_idempotency'\'',
      '\''uk_refund_provider_refund'\''
    );
  "'
```

## Step 3 — Check local environment values

Phase 2 gateway variables remain required. Phase 3 adds optional reconciliation
settings; the shown defaults are recommended initially:

```dotenv
PAYMENT_RECONCILIATION_ENABLED=true
PAYMENT_RECONCILIATION_INTERVAL_MS=15000
PAYMENT_RECONCILIATION_INITIAL_DELAY_MS=15000
PAYMENT_RECONCILIATION_TERMINAL_GRACE_HOURS=24
```

Check names without displaying secret values:

```bash
cd /c/Personal/Work/ZincyCorporation

grep -E '^(PHONEPE_ENABLED|PHONEPE_CLIENT_ID|PHONEPE_CLIENT_SECRET|PHONEPE_WEBHOOK_USERNAME|PHONEPE_WEBHOOK_PASSWORD|RAZORPAY_ENABLED|RAZORPAY_KEY_ID|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET)=.+' \
  .env.local | cut -d= -f1 | sort
```

## Step 4 — Run clean tests

```bash
cd /c/Personal/Work/ZincyCorporation/backend
mvn clean test

cd /c/Personal/Work/ZincyCorporation/frontend
npx tsc --noEmit
EXPO_NO_TELEMETRY=1 npx expo export --platform web
```

Expected backend result includes:

- `PricingCatalogTest`
- `PhonePeClientTest`
- `PaymentServiceDuplicatePaymentTest`
- `PaymentRefundServiceTest`

## Step 5 — Rebuild local backend

```bash
cd /c/Personal/Work/ZincyCorporation

docker compose \
  --env-file .env.local \
  -f compose.yml \
  -f docker-compose.local.yml \
  up -d --build backend

docker compose \
  --env-file .env.local \
  -f compose.yml \
  -f docker-compose.local.yml \
  ps mysql backend

curl -i http://localhost:8083/actuator/health
```

## Step 6 — Configure refund webhooks in test dashboards

Use the same authenticated webhook endpoints already configured for Phase 2:

```text
PhonePe:  https://dev.zincycorp.in/api/payments/phonepe/webhook
Razorpay: https://dev.zincycorp.in/api/payments/razorpay/webhook
```

Subscribe to payment and refund lifecycle events supported by each dashboard.
Keep the existing PhonePe webhook username/password and Razorpay webhook secret.
Never reuse the test values in production.

The scheduler is a fallback for missing/delayed webhooks; webhooks remain the
fast path.

## Step 7 — Test normal pending and failure behavior

Use a new onboarding request with server and maintenance setup, then create a
test payment without completing it.

Verify that:

- a PENDING row is reused and a second gateway order is not created;
- after local expiry the row becomes EXPIRED;
- a genuine gateway FAILED result creates no `payment_refunds` row;
- a payment with an open refund cannot create another payment.

Database inspection:

```bash
docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
    SELECT id, onboarding_request_id, provider, status, provider_state,
           failure_code, reconcile_attempts, next_reconcile_at,
           last_reconciled_at
    FROM payment_orders
    ORDER BY id DESC
    LIMIT 10;
  "'
```

Use only the official PhonePe UAT simulator/cases and Razorpay test-mode
success/failure cards. Never use a real card or real UPI account for this test.

## Step 8 — Test an admin-requested full refund

First complete one sandbox payment and note its `payment_orders.id`. Log in as
an ADMIN in the local web app, open DevTools Console on `localhost:8084`, and
run the following after replacing `PAYMENT_ID`:

```javascript
const paymentId = PAYMENT_ID;
const idempotencyKey = `refund_${crypto.randomUUID().replaceAll('-', '')}`;

fetch(`http://localhost:8083/api/admin/payments/${paymentId}/refunds`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: 'CUSTOMER_CANCELLATION',
    idempotencyKey,
    note: 'Local sandbox full-refund test'
  })
}).then(async response =>
  console.log(response.status, await response.text())
);
```

Expected HTTP status is `202`. `PENDING` is a valid initial response; it must
not be manually changed to COMPLETED.

List the operations queue:

```javascript
fetch('http://localhost:8083/api/admin/payment-refunds', {
  credentials: 'include'
}).then(async response =>
  console.log(response.status, await response.text())
);
```

Refresh one refund from the gateway:

```javascript
fetch('http://localhost:8083/api/admin/payment-refunds/REFUND_ID?refresh=true', {
  credentials: 'include'
}).then(async response =>
  console.log(response.status, await response.text())
);
```

Retry is allowed only for a FAILED refund (or an ambiguous refund without a
gateway reference):

```javascript
fetch('http://localhost:8083/api/admin/payment-refunds/REFUND_ID/retry', {
  method: 'POST',
  credentials: 'include'
}).then(async response =>
  console.log(response.status, await response.text())
);
```

## Step 9 — Verify payment, refund, and audit rows

```bash
docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
    SELECT id, payment_order_id, provider, reason, status, amount,
           merchant_refund_id, provider_refund_id, provider_state,
           automatic_refund, failure_code, reconcile_attempts,
           next_reconcile_at, completed_at
    FROM payment_refunds
    ORDER BY id DESC
    LIMIT 10;

    SELECT id, refund_id, payment_order_id, source, event_type,
           old_status, new_status, gateway_event_id, created_at
    FROM payment_refund_events
    ORDER BY id DESC
    LIMIT 30;
  "'
```

Success means all three facts agree:

- gateway refund status is completed/processed;
- `payment_refunds.status = 'COMPLETED'`;
- `payment_orders.status = 'REFUNDED'`.

## Step 10 — Controlled late-capture test

This test intentionally submits a real **sandbox** full refund. Run it only in
the local database, only for a newly captured sandbox payment, and only after
recording its payment ID.

After the test payment is PAID, simulate the local application having recorded
an expiry while retaining the real gateway references:

```bash
docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
    UPDATE payment_orders
    SET status = '\''EXPIRED'\'',
        provider_state = '\''EXPIRED_LOCALLY'\'',
        failure_code = '\''ORDER_EXPIRED'\'',
        failure_reason = '\''Controlled local late-capture test'\'',
        next_reconcile_at = NOW(6)
    WHERE id = PAYMENT_ID
      AND status = '\''PAID'\'';
  "'
```

Within the reconciliation interval the backend should rediscover the gateway
capture, set the payment to REVIEW_REQUIRED with `LATE_CAPTURE`, and create one
automatic full refund. It must never create two refund rows.

Do not run this test against Dev or Production data.

## Step 11 — Production operating rules

- Never tell a customer to pay again while payment/refund status is PENDING or
  REVIEW_REQUIRED.
- Never mark a refund completed manually based on a screenshot or customer
  statement.
- For FAILED refunds, verify the gateway dashboard/reference first, then use
  the admin retry endpoint. Retry keeps a new idempotency reference and the old
  reference in audit history.
- For REVIEW_REQUIRED refunds, investigate amount/order/payment-reference
  mismatches. The API intentionally blocks blind retry.
- A bank debit with a gateway FAILED state may be an automatic bank reversal,
  not a captured payment. Keep reconciliation running; refund only after the
  gateway confirms capture.
- Alert operations when a payment or refund remains PENDING beyond the gateway
  SLA, when any refund is FAILED/REVIEW_REQUIRED, or when reconciliation errors
  continue.

## Step 12 — Commit only after all checks pass

```bash
cd /c/Personal/Work/ZincyCorporation

git diff --check
git status --short
git add .
git --no-pager diff --cached --stat

git commit -m "Add payment refunds and gateway reconciliation"
git push origin feature/payment-refunds-reconciliation
git status -sb
```

Do not merge into `develop` until the local sandbox payment, normal refund,
pending display, failed-payment no-refund rule, duplicate protection, and
late-capture automatic-refund test have all been verified.
