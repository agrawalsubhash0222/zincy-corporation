-- Phase 3: full-refund lifecycle, immutable refund audit events, and
-- reconciliation scheduling. This migration is safe to run more than once.

SET @payment_reconcile_attempts_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND column_name = 'reconcile_attempts'
);

SET @add_payment_reconcile_attempts_sql = IF(
    @payment_reconcile_attempts_exists = 0,
    'ALTER TABLE payment_orders ADD COLUMN reconcile_attempts INT NOT NULL DEFAULT 0 AFTER last_webhook_at',
    'SELECT 1'
);

PREPARE add_payment_reconcile_attempts_statement
    FROM @add_payment_reconcile_attempts_sql;
EXECUTE add_payment_reconcile_attempts_statement;
DEALLOCATE PREPARE add_payment_reconcile_attempts_statement;

SET @payment_next_reconcile_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND column_name = 'next_reconcile_at'
);

SET @add_payment_next_reconcile_sql = IF(
    @payment_next_reconcile_exists = 0,
    'ALTER TABLE payment_orders ADD COLUMN next_reconcile_at DATETIME(6) NULL AFTER reconcile_attempts',
    'SELECT 1'
);

PREPARE add_payment_next_reconcile_statement
    FROM @add_payment_next_reconcile_sql;
EXECUTE add_payment_next_reconcile_statement;
DEALLOCATE PREPARE add_payment_next_reconcile_statement;

SET @payment_last_reconciled_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND column_name = 'last_reconciled_at'
);

SET @add_payment_last_reconciled_sql = IF(
    @payment_last_reconciled_exists = 0,
    'ALTER TABLE payment_orders ADD COLUMN last_reconciled_at DATETIME(6) NULL AFTER next_reconcile_at',
    'SELECT 1'
);

PREPARE add_payment_last_reconciled_statement
    FROM @add_payment_last_reconciled_sql;
EXECUTE add_payment_last_reconciled_statement;
DEALLOCATE PREPARE add_payment_last_reconciled_statement;

SET @payment_reconcile_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_orders'
      AND index_name = 'idx_payment_status_next_reconcile'
);

SET @add_payment_reconcile_index_sql = IF(
    @payment_reconcile_index_exists = 0,
    'ALTER TABLE payment_orders ADD INDEX idx_payment_status_next_reconcile (status, next_reconcile_at)',
    'SELECT 1'
);

PREPARE add_payment_reconcile_index_statement
    FROM @add_payment_reconcile_index_sql;
EXECUTE add_payment_reconcile_index_statement;
DEALLOCATE PREPARE add_payment_reconcile_index_statement;

CREATE TABLE IF NOT EXISTS payment_refunds (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_order_id BIGINT NOT NULL,
    onboarding_request_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    reason VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    amount_paise BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    merchant_refund_id VARCHAR(63) NOT NULL,
    provider_refund_id VARCHAR(120) NULL,
    provider_state VARCHAR(50) NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    requested_by_user_id BIGINT NULL,
    automatic_refund BOOLEAN NOT NULL DEFAULT FALSE,
    request_note VARCHAR(500) NULL,
    failure_code VARCHAR(100) NULL,
    failure_reason VARCHAR(500) NULL,
    reconcile_attempts INT NOT NULL DEFAULT 0,
    next_reconcile_at DATETIME(6) NULL,
    last_reconciled_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,
    last_webhook_event VARCHAR(120) NULL,
    last_webhook_at DATETIME(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_refund_payment_order UNIQUE (payment_order_id),
    CONSTRAINT uk_refund_merchant_refund UNIQUE (merchant_refund_id),
    CONSTRAINT uk_refund_idempotency UNIQUE (idempotency_key),
    CONSTRAINT uk_refund_provider_refund
        UNIQUE (provider, provider_refund_id),
    INDEX idx_refund_status_next (status, next_reconcile_at),
    INDEX idx_refund_payment_order (payment_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_refund_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    refund_id BIGINT NOT NULL,
    payment_order_id BIGINT NOT NULL,
    source VARCHAR(30) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NULL,
    gateway_event_id VARCHAR(120) NULL,
    details VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_refund_event_gateway
        UNIQUE (source, gateway_event_id),
    INDEX idx_refund_event_refund (refund_id, created_at),
    INDEX idx_refund_event_payment (payment_order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Begin polling unfinished orders shortly after this migration. Terminal and
-- manual-review records are intentionally excluded.
UPDATE payment_orders
SET next_reconcile_at = COALESCE(next_reconcile_at, NOW(6))
WHERE status IN ('CREATED', 'PENDING')
   OR (
       status IN ('FAILED', 'EXPIRED')
       AND created_at >= DATE_SUB(NOW(6), INTERVAL 24 HOUR)
       AND provider_order_id IS NOT NULL
   );
