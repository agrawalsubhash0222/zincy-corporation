package com.zincycorporation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreatePaymentOrderResponse {
    private Long paymentRecordId;
    private PaymentProvider provider;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String merchantOrderId;
    private String providerOrderId;
    private String publicKey;
    private String checkoutUrl;
    private Long amountPaise;
    private BigDecimal amount;
    private String currency;
    private String businessName;
    private String description;
    private LocalDateTime expiresAt;
}
