package com.zincycorporation.dto;

import com.zincycorporation.enums.OnboardingNextStep;
import com.zincycorporation.enums.OnboardingStatus;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CustomerLatestOnboardingResponse {

    Long id;

    String businessName;
    String ownerName;

    String mobile;
    String userMobile;
    String email;

    String projectTypes;
    String requirement;
    String budget;
    String timeline;

    OnboardingStatus status;

    boolean clientSetupCompleted;
    boolean serverSetupCompleted;
    boolean maintenanceSetupCompleted;

    OnboardingNextStep nextStep;
}