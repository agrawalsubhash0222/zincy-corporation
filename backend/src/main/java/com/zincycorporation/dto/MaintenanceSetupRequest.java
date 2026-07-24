package com.zincycorporation.dto;

import java.math.BigDecimal;

import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaintenanceSetupRequest {

    private Long onboardingRequestId;

    private MaintenanceType maintenanceType;

    private MaintenanceBillingType billingType;

    private BigDecimal baseAmount;
}