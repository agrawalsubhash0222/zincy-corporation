package com.zincycorporation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.BillingType;
import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;
import com.zincycorporation.enums.OnboardingStatus;

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
public class AdminOnboardingDetailsResponse {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestDetails {
        private Long id;
        private String businessName;
        private String ownerName;
        private String mobile;
        private String userMobile;
        private String email;
        private String projectTypes;
        private String requirement;
        private String budget;
        private String timeline;
        private OnboardingStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientSetupDetails {
        private Long id;
        private Long onboardingRequestId;
        private String businessName;
        private String ownerName;
        private String ownerContact;
        private String ownerEmail;
        private String secondaryContact;
        private String contacts;
        private String businessEmail;
        private String whatsappContact;
        private String businessType;
        private String businessLogoUrl;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String pincode;
        private Boolean gstRegistered;
        private String gstNumber;
        private String panNumber;
        private String udyamNumber;
        private String fssaiLicenseNumber;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServerSetupDetails {
        private Long id;
        private Long onboardingRequestId;
        private String serverName;
        private BillingType billingType;
        private BigDecimal baseAmount;
        private BigDecimal gstAmount;
        private BigDecimal totalAmount;
        private Boolean skipped;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceSetupDetails {
        private Long id;
        private Long onboardingRequestId;
        private MaintenanceType maintenanceType;
        private MaintenanceBillingType billingType;
        private BigDecimal baseAmount;
        private BigDecimal gstAmount;
        private BigDecimal totalAmount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    private RequestDetails onboardingRequest;

    private boolean clientSetupCompleted;
    private ClientSetupDetails clientSetup;

    private boolean serverSetupCompleted;

    private ServerSetupDetails serverSetup;

    private boolean maintenanceSetupCompleted;

    private MaintenanceSetupDetails maintenanceSetup;
}
