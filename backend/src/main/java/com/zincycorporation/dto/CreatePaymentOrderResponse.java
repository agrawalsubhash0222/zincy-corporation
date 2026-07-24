package com.zincycorporation.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreatePaymentOrderResponse {
    private Long paymentRecordId;
    private String keyId;
    private String orderId;
    private Long amountPaise;
    private BigDecimal amount;
    private String currency;
    private String businessName;
    private String description;
}
