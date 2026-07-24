package com.zincycorporation.dto;

import java.math.BigDecimal;

import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;

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
public class MaintenanceSetupResponse {

    private Long id;

    private Long onboardingRequestId;

    private MaintenanceType maintenanceType;

    private MaintenanceBillingType billingType;

    private BigDecimal baseAmount;

    private BigDecimal gstAmount;

    private BigDecimal totalAmount;

    private Boolean maintenanceSetupCompleted;
}