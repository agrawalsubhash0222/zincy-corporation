# Razorpay Refund Safety Hotfix

## What this fixes

- Removes the undocumented `X-Refund-Idempotency` refund header.
- Uses Razorpay's documented unique `receipt` as the idempotency key.
- Preserves Razorpay's actual error code and description.
- Marks definite 4xx rejections as `FAILED` instead of retrying forever.
- Keeps network/5xx/timeout outcomes `PENDING` because submission is uncertain.
- Before retrying an uncertain submission, fetches the payment's refunds and
  recovers the existing refund by its unique receipt.
- A captured payment remains `PAID` until the gateway confirms the refund as
  `processed`; only then does it become `REFUNDED`.

## Existing local refund id 1

After rebuilding the backend, the scheduler will safely reconcile refund 1.
It first searches Razorpay for its `merchant_refund_id`. If Razorpay accepted
the original request, the existing provider refund is attached. If Razorpay
definitively rejected it, the real reason is stored and the refund becomes
`FAILED`. Do not create another refund record.

## Verification

Run backend tests, rebuild the local backend, and query refund 1:

```bash
cd /c/Personal/Work/ZincyCorporation/backend
mvn clean test

cd /c/Personal/Work/ZincyCorporation
docker compose --env-file .env.local -f compose.yml \
  -f docker-compose.local.yml up -d --build backend

docker exec zincy-local-mysql \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "
    SELECT id, payment_order_id, status, provider_refund_id,
           failure_code, failure_reason, reconcile_attempts,
           next_reconcile_at, completed_at
    FROM payment_refunds WHERE id = 1;
    SELECT id, status FROM payment_orders WHERE id = 5;
  "'
```

Expected terminal outcomes:

- `COMPLETED` + provider refund id; payment 5 is `REFUNDED`.
- `FAILED` + the real Razorpay reason; payment 5 stays `PAID`. Correct the
  stated Razorpay account problem, then use the existing admin retry endpoint
  once. Do not POST a second new refund.
- `PENDING`; the gateway lookup itself is temporarily unavailable. The
  scheduler will retry safely using the same receipt.
