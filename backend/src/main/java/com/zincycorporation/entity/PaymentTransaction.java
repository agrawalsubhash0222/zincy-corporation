package com.zincycorporation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_orders", uniqueConstraints = {
                @UniqueConstraint(name = "uk_payment_merchant_order", columnNames = "merchant_order_id"),

                @UniqueConstraint(name = "uk_payment_idempotency", columnNames = "idempotency_key"),

                @UniqueConstraint(name = "uk_payment_provider_order", columnNames = {
                                "provider",
                                "provider_order_id"
                }),

                @UniqueConstraint(name = "uk_payment_provider_payment", columnNames = {
                                "provider",
                                "provider_payment_id"
                })
}, indexes = {
                @Index(name = "idx_payment_onboarding", columnList = "onboarding_request_id"),

                @Index(name = "idx_payment_created_by", columnList = "created_by_user_id"),

                @Index(name = "idx_payment_status", columnList = "status"),

                @Index(name = "idx_payment_status_next_reconcile", columnList = "status,next_reconcile_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "onboarding_request_id", nullable = false)
        private Long onboardingRequestId;

        @Column(name = "created_by_user_id", nullable = false)
        private Long createdByUserId;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        private PaymentProvider provider;

        @Enumerated(EnumType.STRING)
        @Column(name = "payment_method", nullable = false, length = 20)
        private PaymentMethod preferredMethod;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 30)
        private PaymentStatus status;

        @Column(nullable = false, precision = 12, scale = 2)
        private BigDecimal amount;

        @Column(name = "amount_paise", nullable = false)
        private Long amountPaise;

        @Column(nullable = false, length = 3)
        private String currency;

        @Column(name = "merchant_order_id", nullable = false, length = 63)
        private String merchantOrderId;

        @Column(name = "provider_order_id", length = 120)
        private String providerOrderId;

        @Column(name = "provider_payment_id", length = 120)
        private String providerPaymentId;

        @Column(name = "provider_state", length = 50)
        private String providerState;

        @Column(name = "checkout_url", length = 2048)
        private String checkoutUrl;

        @Column(name = "idempotency_key", nullable = false, length = 64)
        private String idempotencyKey;

        @Column(name = "failure_code", length = 100)
        private String failureCode;

        @Column(name = "failure_reason", length = 500)
        private String failureReason;

        @Column(name = "expires_at")
        private LocalDateTime expiresAt;

        @Column(name = "paid_at")
        private LocalDateTime paidAt;

        @Column(name = "last_webhook_event", length = 100)
        private String lastWebhookEvent;

        @Column(name = "last_webhook_at")
        private LocalDateTime lastWebhookAt;

        @Column(name = "reconcile_attempts", nullable = false)
        private Integer reconcileAttempts;

        @Column(name = "next_reconcile_at")
        private LocalDateTime nextReconcileAt;

        @Column(name = "last_reconciled_at")
        private LocalDateTime lastReconciledAt;

        /**
         * Optimistic locking.
         *
         * This prevents two concurrent payment/webhook/reconciliation
         * operations from silently overwriting each other's changes.
         */
        @Version
        @Column(nullable = false)
        private Long version;

        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @Column(name = "updated_at", nullable = false)
        private LocalDateTime updatedAt;

        @PrePersist
        void onCreate() {
                LocalDateTime now = LocalDateTime.now();

                createdAt = now;
                updatedAt = now;

                if (reconcileAttempts == null) {
                        reconcileAttempts = 0;
                }

                /*
                 * Explicit initialization is useful when this entity is
                 * inserted into a database where the version column has
                 * no database-side default.
                 */
                if (version == null) {
                        version = 0L;
                }
        }

        @PreUpdate
        void onUpdate() {
                updatedAt = LocalDateTime.now();
        }
}