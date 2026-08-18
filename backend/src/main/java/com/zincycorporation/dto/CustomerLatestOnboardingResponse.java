package com.zincycorporation.dto;

import com.zincycorporation.enums.OnboardingNextStep;
import com.zincycorporation.enums.OnboardingStatus;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundStatus;
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

    PaymentStatus paymentStatus;
    Long paymentRecordId;
    PaymentProvider paymentProvider;
    PaymentMethod paymentMethod;
    RefundStatus refundStatus;
    OnboardingNextStep nextStep;
}