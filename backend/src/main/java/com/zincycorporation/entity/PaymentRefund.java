package com.zincycorporation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.RefundReason;
import com.zincycorporation.enums.RefundStatus;

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
@Table(name = "payment_refunds", uniqueConstraints = {
        @UniqueConstraint(
                name = "uk_refund_payment_order",
                columnNames = "payment_order_id"),
        @UniqueConstraint(
                name = "uk_refund_merchant_refund",
                columnNames = "merchant_refund_id"),
        @UniqueConstraint(
                name = "uk_refund_idempotency",
                columnNames = "idempotency_key"),
        @UniqueConstraint(
                name = "uk_refund_provider_refund",
                columnNames = { "provider", "provider_refund_id" })
}, indexes = {
        @Index(name = "idx_refund_status_next", columnList = "status,next_reconcile_at"),
        @Index(name = "idx_refund_payment_order", columnList = "payment_order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRefund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_order_id", nullable = false)
    private Long paymentOrderId;

    @Column(name = "onboarding_request_id", nullable = false)
    private Long onboardingRequestId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundReason reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "merchant_refund_id", nullable = false, length = 63)
    private String merchantRefundId;

    @Column(name = "provider_refund_id", length = 120)
    private String providerRefundId;

    @Column(name = "provider_state", length = 50)
    private String providerState;

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    @Column(name = "automatic_refund", nullable = false)
    private Boolean automaticRefund;

    @Column(name = "request_note", length = 500)
    private String requestNote;

    @Column(name = "failure_code", length = 100)
    private String failureCode;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "reconcile_attempts", nullable = false)
    private Integer reconcileAttempts;

    @Column(name = "next_reconcile_at")
    private LocalDateTime nextReconcileAt;

    @Column(name = "last_reconciled_at")
    private LocalDateTime lastReconciledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "last_webhook_event", length = 120)
    private String lastWebhookEvent;

    @Column(name = "last_webhook_at")
    private LocalDateTime lastWebhookAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (automaticRefund == null) {
            automaticRefund = false;
        }
        if (reconcileAttempts == null) {
            reconcileAttempts = 0;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
