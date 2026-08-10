# Zincy payments — Phase 2 gateway integration

This phase implements the approved provider split:

| UI choice | Provider | Allowed instrument |
| --- | --- | --- |
| PhonePe | PhonePe Standard Checkout | PhonePe UPI intent only |
| Credit / Debit Card | Razorpay Standard Checkout | Card only |
| Google Pay | None | Disabled — Coming soon |

The backend calculates the payable amount from the saved onboarding, server,
and maintenance records. The browser never decides the amount and cannot mark
a payment successful. A payment is successful only after signed callback or
webhook verification and a matching provider order, amount, currency, and
instrument.

## 1. Apply and verify the files

Start from an up-to-date `develop` branch and create a dedicated Phase 2
feature branch. Extract the Phase 2 package at the repository root, where
`backend`, `frontend`, `database`, and `compose.yml` are located.

```bash
cd /c/Personal/Work/ZincyCorporation
git status --short
git switch develop
git pull --ff-only origin develop
git switch -c feature/payment-gateways-phase-2
```

Do not extract over a dirty worktree. After extraction, review the changed
files before running the builds.

Run:

```bash
cd backend
mvn test

cd ../frontend
npm ci
npx tsc --noEmit
```

## 2. Create the payment table

Phase 2 uses a new `payment_orders` table. The existing
`payment_transactions` table is intentionally not renamed or deleted.

Local Docker:

```bash
cd /c/Personal/Work/ZincyCorporation
docker exec -i zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  < database/002_payment_orders.sql
```

The SQL uses `CREATE TABLE IF NOT EXISTS`, so it is also safe when Hibernate
has already created the table. Back up Dev and Production before applying it
there.

## 3. Add local test credentials

Put these in the backend Compose environment file (`.env.local`). Never add
real values to Git, Expo variables, `app.json`, frontend code, screenshots, or
chat messages.

```dotenv
PAYMENT_FRONTEND_BASE_URL=http://localhost:8084

PHONEPE_ENABLED=true
PHONEPE_CLIENT_ID=replace_with_phonepe_test_client_id
PHONEPE_CLIENT_SECRET=replace_with_phonepe_test_client_secret
PHONEPE_CLIENT_VERSION=replace_with_portal_client_version
PHONEPE_WEBHOOK_USERNAME=replace_with_your_random_webhook_username
PHONEPE_WEBHOOK_PASSWORD=replace_with_your_random_webhook_password

RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=replace_with_razorpay_test_key_id
RAZORPAY_KEY_SECRET=replace_with_razorpay_test_key_secret
RAZORPAY_WEBHOOK_SECRET=replace_with_a_separate_random_webhook_secret
```

`PHONEPE_CLIENT_VERSION` must match the version displayed with the test
credentials. The `local` and `dev` Spring profiles use PhonePe pre-production
URLs. Do not override those URLs unless PhonePe support instructs you to.

Generate separate webhook secrets, for example:

```bash
openssl rand -hex 32
```

## 4. Configure Test-mode webhooks

Localhost cannot receive provider webhooks. Configure test webhooks against
the public Dev environment:

- PhonePe: `https://dev.zincycorp.in/api/payments/phonepe/webhook`
- Razorpay: `https://dev.zincycorp.in/api/payments/razorpay/webhook`

For PhonePe, select SHA authentication and configure the exact username and
password used in the Dev backend environment. Enable:

- `checkout.order.completed`
- `checkout.order.failed`

For Razorpay, use the exact separate webhook secret from the Dev backend.
Enable:

- `payment.captured`
- `payment.failed`

In Razorpay Test mode, enable automatic payment capture. Zincy deliberately
does not treat an `authorized` card payment as paid; the provider status must
be `captured`.

## 5. Local test

Rebuild the backend after adding credentials:

```bash
cd /c/Personal/Work/ZincyCorporation
docker compose \
  --env-file .env.local \
  -f compose.yml \
  -f docker-compose.local.yml \
  up -d --build mysql backend
```

Start the frontend as usual on port 8084. Log in, use an onboarding request
that has completed server and maintenance setup, and open the payment page.

Verify all of the following:

1. Google Pay is disabled and displays `COMING SOON`.
2. PhonePe redirects to PhonePe Standard Checkout and shows only the PhonePe
   UPI intent route.
3. Card opens Razorpay and shows only credit/debit card entry.
4. Cancelling checkout does not show a successful payment.
5. Editing route query parameters cannot change the amount or success state.
6. The success screen requests `/api/payments/{id}/status` and shows success
   only when the backend returns `PAID`.

Inspect payment records without exposing credentials:

```bash
docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SELECT id, provider, payment_method, amount, currency, status, provider_state, paid_at FROM payment_orders ORDER BY id DESC LIMIT 10;"'
```

An unsigned webhook request must be rejected:

```bash
curl -i -X POST http://localhost:8083/api/payments/razorpay/webhook \
  -H 'Content-Type: application/json' \
  --data '{}'
```

Expected result: `401 Unauthorized` (or `503` while its webhook secret is
intentionally absent). Use each provider dashboard to perform the real signed
webhook test on Dev.

## 6. Dev deployment

Add the same variables to the Dev server environment, using only test keys and
`PAYMENT_FRONTEND_BASE_URL=https://dev.zincycorp.in`. Deploy `develop`, then
test a PhonePe sandbox payment and Razorpay test-card payment end to end.

Confirm:

```bash
curl -i https://dev.zincycorp.in/api/auth/session
```

Without a login cookie, `401` is correct. Then log in through the browser and
confirm the payment flow. Check backend logs for errors, but never log or paste
gateway secrets, checkout signatures, raw session cookies, card data, OTP, or
UPI PIN.

## 7. Production go-live

Only after Dev passes:

1. Back up Production MySQL.
2. Apply `database/002_payment_orders.sql`.
3. Configure the two Production webhook URLs under `https://zincycorp.in`.
4. Replace test credentials with live credentials.
5. Use separate live webhook secrets.
6. Set `PAYMENT_FRONTEND_BASE_URL=https://zincycorp.in`.
7. Set `PHONEPE_ENABLED=true` and `RAZORPAY_ENABLED=true` only when each live
   provider and webhook is ready.
8. Deploy `main` and make one small live payment through each provider.
9. Reconcile the Zincy row, provider dashboard order, captured amount, and
   bank settlement.

The `prod` profile already selects PhonePe's production OAuth and PG base URLs.
Disabling either `PHONEPE_ENABLED` or `RAZORPAY_ENABLED` is the immediate,
non-destructive payment kill switch.

## Security controls included

- HttpOnly authenticated session and ownership checks from Phase 1.
- Server-calculated amount in paise and INR currency validation.
- Per-attempt idempotency key and unique merchant/provider order IDs.
- Razorpay checkout signature verification plus raw-body webhook HMAC.
- PhonePe webhook credential-hash verification.
- Provider/order/amount/currency/instrument verification.
- Completed PhonePe payments must report the `UPI_INTENT` payment mode.
- Card-only and PhonePe-only gateway allowlists.
- Webhook event replay-safe state updates and optimistic row versioning.
- A backend-verified status screen; no success based on URL values.
- Authenticated per-user rate limiting on payment-order creation.
- No card number, CVV, OTP, UPI PIN, client secret, or webhook secret stored in
  the frontend or `payment_orders`.

## Official references

- PhonePe authorization: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/authorization
- PhonePe create payment: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment/initiate-payment
- PhonePe payment-mode V2: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment/configure-payment-modes
- PhonePe status: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/order-status
- PhonePe webhooks: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/webhook
- Razorpay Standard Checkout: https://razorpay.com/docs/developer-tools/integrations/standard-checkout/
- Razorpay webhook validation: https://razorpay.com/docs/webhooks/validate-test/
