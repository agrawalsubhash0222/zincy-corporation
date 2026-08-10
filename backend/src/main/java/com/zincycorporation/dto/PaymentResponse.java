package com.zincycorporation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundReason;
import com.zincycorporation.enums.RefundStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponse {
    private Long id;
    private Long onboardingRequestId;
    private PaymentProvider provider;
    private PaymentMethod paymentMethod;
    private String merchantOrderId;
    private String providerOrderId;
    private String providerPaymentId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String providerState;
    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private boolean terminal;
    private boolean successful;
    private Long refundId;
    private RefundStatus refundStatus;
    private RefundReason refundReason;
    private BigDecimal refundAmount;
    private String refundFailureReason;
    private boolean automaticRefund;
    private boolean refundInProgress;
    private LocalDateTime refundCompletedAt;
}
