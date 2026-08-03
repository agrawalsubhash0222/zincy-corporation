# Phase 2 duplicate-payment hotfix

This hotfix prevents a customer from creating multiple payable orders for the
same onboarding request.

## Behaviour

- An exact idempotency retry returns the original order.
- A ready, unexpired order is reused when the same gateway is selected again.
- Switching gateways is rejected while another payment is active.
- A new order is rejected after the onboarding payment is already `PAID`.
- The database permits only one `CREATED`, `PENDING`, or `PAID` row per
  onboarding request.
- If a second gateway capture is received unexpectedly, the later transaction
  becomes `REVIEW_REQUIRED` with failure code `DUPLICATE_CAPTURE` so it can be
  reviewed and refunded.

## Required migration

Run `database/003_prevent_duplicate_payments.sql` before restarting the updated
backend. The migration is repeat-safe for its generated column and unique
index. It also normalizes duplicate rows created before this hotfix.
