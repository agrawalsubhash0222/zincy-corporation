# Phase 2 Hotfix 1

Extract this archive at the ZincyCorporation repository root and replace the
two existing files.

Changes:

- Parse PhonePe HTTP responses as text before using the project's Jackson 2
  parser. This avoids Spring Boot 4 / Jackson 3 RestClient conversion errors.
- Convert PhonePe connection failures into controlled gateway errors.
- Discard a failed frontend idempotency key so a retry creates a fresh order.

No credential, database, or payment amount changes are included.
