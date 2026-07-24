package com.zincycorporation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.BillingType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerSetupResponse {

    private Long id;

    private Long onboardingRequestId;

    private String serverName;

    private BillingType billingType;

    private BigDecimal baseAmount;

    private BigDecimal gstAmount;

    private BigDecimal totalAmount;

    private Boolean skipped;

    private Boolean serverSetupCompleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}