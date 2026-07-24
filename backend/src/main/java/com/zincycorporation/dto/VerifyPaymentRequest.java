package com.zincycorporation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPaymentRequest {
    private Long paymentRecordId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
