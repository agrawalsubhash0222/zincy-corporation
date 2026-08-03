package com.zincycorporation.dto;

import com.zincycorporation.enums.BillingType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerSetupRequest {

    private Long onboardingRequestId;

    private String serverName;

    private BillingType billingType;

    private Boolean skipped;
}
