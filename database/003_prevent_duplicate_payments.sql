-- Keep the earliest completed payment as the canonical payment.
-- Any later completed payment must be reviewed and refunded if necessary.
CREATE TEMPORARY TABLE duplicate_paid_payment_ids (
    id BIGINT NOT NULL PRIMARY KEY
);

INSERT INTO duplicate_paid_payment_ids (id)
SELECT ranked.id
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY onboarding_request_id
            ORDER BY COALESCE(paid_at, created_at), id
        ) AS payment_rank
    FROM payment_orders
    WHERE status = 'PAID'
) ranked
WHERE ranked.payment_rank > 1;

UPDATE payment_orders payment
JOIN duplicate_paid_payment_ids duplicate_payment
    ON duplicate_payment.id = payment.id
SET
    payment.status = 'REVIEW_REQUIRED',
    payment.failure_code = 'DUPLICATE_CAPTURE',
    payment.failure_reason =
        'Another payment is already completed for this onboarding request; refund review is required';

DROP TEMPORARY TABLE duplicate_paid_payment_ids;

-- A completed payment makes every unfinished attempt for that onboarding
-- request obsolete.
UPDATE payment_orders active_payment
JOIN (
    SELECT DISTINCT onboarding_request_id
    FROM payment_orders
    WHERE status = 'PAID'
) completed_payment
    ON completed_payment.onboarding_request_id =
        active_payment.onboarding_request_id
SET
    active_payment.status = 'EXPIRED',
    active_payment.provider_state = 'SUPERSEDED_BY_PAID_ORDER',
    active_payment.failure_code = 'PAYMENT_ALREADY_COMPLETED',
    active_payment.failure_reason =
        'Another payment was completed for this onboarding request'
WHERE active_payment.status IN ('CREATED', 'PENDING');

-- If old application versions created several unfinished attempts, retain only
-- the latest one before adding the database uniqueness guard.
CREATE TEMPORARY TABLE duplicate_active_payment_ids (
    id BIGINT NOT NULL PRIMARY KEY
);

INSERT INTO duplicate_active_payment_ids (id)
SELECT ranked.id
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY onboarding_request_id
            ORDER BY created_at DESC, id DESC
        ) AS payment_rank
    FROM payment_orders
    WHERE status IN ('CREATED', 'PENDING')
) ranked
WHERE ranked.payment_rank > 1;

UPDATE payment_orders payment
JOIN duplicate_active_payment_ids duplicate_payment
    ON duplicate_payment.id = payment.id
SET
    payment.status = 'EXPIRED',
    payment.provider_state = 'SUPERSEDED_ATTEMPT',
    payment.failure_code = 'DUPLICATE_ATTEMPT',
    payment.failure_reason =
        'A newer payment attempt exists for this onboarding request';

DROP TEMPORARY TABLE duplicate_active_payment_ids;

-- MySQL unique indexes permit multiple NULL values. The generated column is
-- populated only while an order is CREATED, PENDING, or PAID, which guarantees
-- that at most one payable/completed order exists per onboarding request.
SET @guard_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND column_name = 'active_onboarding_request_id'
);

SET @add_guard_column_sql = IF(
    @guard_column_exists = 0,
    'ALTER TABLE payment_orders ADD COLUMN active_onboarding_request_id BIGINT GENERATED ALWAYS AS (CASE WHEN status IN (''CREATED'', ''PENDING'', ''PAID'') THEN onboarding_request_id ELSE NULL END) STORED',
    'SELECT 1'
);

PREPARE add_guard_column_statement FROM @add_guard_column_sql;
EXECUTE add_guard_column_statement;
DEALLOCATE PREPARE add_guard_column_statement;

SET @guard_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND index_name = 'uk_payment_active_onboarding'
);

SET @add_guard_index_sql = IF(
    @guard_index_exists = 0,
    'ALTER TABLE payment_orders ADD UNIQUE INDEX uk_payment_active_onboarding (active_onboarding_request_id)',
    'SELECT 1'
);

PREPARE add_guard_index_statement FROM @add_guard_index_sql;
EXECUTE add_guard_index_statement;
DEALLOCATE PREPARE add_guard_index_statement;
