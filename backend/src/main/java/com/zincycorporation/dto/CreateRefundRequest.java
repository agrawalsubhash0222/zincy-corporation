package com.zincycorporation.dto;

import com.zincycorporation.enums.RefundReason;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRefundRequest {
    private RefundReason reason;
    private String idempotencyKey;
    private String note;
}
