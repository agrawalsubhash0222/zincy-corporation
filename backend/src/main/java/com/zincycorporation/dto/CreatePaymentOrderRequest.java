package com.zincycorporation.dto;

import com.zincycorporation.enums.PaymentMethod;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentOrderRequest {
    private Long onboardingRequestId;
    private PaymentMethod preferredMethod;
    private String idempotencyKey;
}
