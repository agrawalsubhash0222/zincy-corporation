package com.zincycorporation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.RefundReason;
import com.zincycorporation.enums.RefundStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RefundResponse {
    private Long id;
    private Long paymentOrderId;
    private Long onboardingRequestId;
    private PaymentProvider provider;
    private RefundReason reason;
    private RefundStatus status;
    private BigDecimal amount;
    private String currency;
    private String merchantRefundId;
    private String providerRefundId;
    private String providerState;
    private String failureCode;
    private String failureReason;
    private Integer reconcileAttempts;
    private LocalDateTime nextReconcileAt;
    private LocalDateTime lastReconciledAt;
    private boolean automatic;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
