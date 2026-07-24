package com.zincycorporation.dto;

import java.math.BigDecimal;

import com.zincycorporation.enums.BillingType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerSetupRequest {

    private Long onboardingRequestId;

    private String serverName;

    private BillingType billingType;

    /**
     * Price before GST.
     */
    private BigDecimal amount;

    private Boolean skipped;
}