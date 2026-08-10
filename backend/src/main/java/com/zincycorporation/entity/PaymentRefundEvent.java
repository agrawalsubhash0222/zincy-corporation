package com.zincycorporation.entity;

import java.time.LocalDateTime;

import com.zincycorporation.enums.RefundSource;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payment_refund_events", indexes = {
        @Index(name = "idx_refund_event_refund", columnList = "refund_id,created_at"),
        @Index(name = "idx_refund_event_payment", columnList = "payment_order_id,created_at")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRefundEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "refund_id", nullable = false)
    private Long refundId;

    @Column(name = "payment_order_id", nullable = false)
    private Long paymentOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundSource source;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private RefundStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30)
    private RefundStatus newStatus;

    @Column(name = "gateway_event_id", length = 120)
    private String gatewayEventId;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
