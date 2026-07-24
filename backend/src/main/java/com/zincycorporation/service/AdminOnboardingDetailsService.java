package com.zincycorporation.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.zincycorporation.dto.AdminOnboardingDetailsResponse;
import com.zincycorporation.dto.AdminOnboardingDetailsResponse.ClientSetupDetails;
import com.zincycorporation.dto.AdminOnboardingDetailsResponse.MaintenanceSetupDetails;
import com.zincycorporation.dto.AdminOnboardingDetailsResponse.RequestDetails;
import com.zincycorporation.dto.AdminOnboardingDetailsResponse.ServerSetupDetails;
import com.zincycorporation.entity.ClientBusinessSetup;
import com.zincycorporation.entity.MaintenanceSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.ServerSetup;
import com.zincycorporation.repository.ClientBusinessSetupRepository;
import com.zincycorporation.repository.MaintenanceSetupRepository;
import com.zincycorporation.repository.OnboardingRequestRepository;
import com.zincycorporation.repository.ServerSetupRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminOnboardingDetailsService {

    private final OnboardingRequestRepository onboardingRequestRepository;
    private final ClientBusinessSetupRepository clientBusinessSetupRepository;
    private final ServerSetupRepository serverSetupRepository;
    private final MaintenanceSetupRepository maintenanceSetupRepository;

    @Transactional(readOnly = true)
    public AdminOnboardingDetailsResponse getDetails(Long onboardingRequestId) {
        if (onboardingRequestId == null || onboardingRequestId <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A valid onboarding request ID is required"
            );
        }

        OnboardingRequest request = onboardingRequestRepository
            .findById(onboardingRequestId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Onboarding request not found: " + onboardingRequestId
            ));

        ClientBusinessSetup clientSetup = clientBusinessSetupRepository
            .findByOnboardingRequestId(onboardingRequestId)
            .orElse(null);

        ServerSetup serverSetup = serverSetupRepository
            .findByOnboardingRequestId(onboardingRequestId)
            .orElse(null);

        MaintenanceSetup maintenanceSetup = maintenanceSetupRepository
            .findByOnboardingRequestId(onboardingRequestId)
            .orElse(null);

        /*
         * Use both the completion flags and actual rows.
         * This prevents a stale flag from hiding saved data.
         */
        boolean clientCompleted =
            request.isClientSetupCompleted() || clientSetup != null;

        boolean serverCompleted =
            request.isServerSetupCompleted() || serverSetup != null;

        boolean maintenanceCompleted =
            request.isMaintenanceSetupCompleted() || maintenanceSetup != null;

        return AdminOnboardingDetailsResponse.builder()
            .onboardingRequest(toRequestDetails(request))
            .clientSetupCompleted(clientCompleted)
            .clientSetup(toClientSetupDetails(clientSetup))
            .serverSetupCompleted(serverCompleted)
            .serverSetup(toServerSetupDetails(serverSetup))
            .maintenanceSetupCompleted(maintenanceCompleted)
            .maintenanceSetup(toMaintenanceSetupDetails(maintenanceSetup))
            .build();
    }

    private RequestDetails toRequestDetails(OnboardingRequest request) {
        return RequestDetails.builder()
            .id(request.getId())
            .businessName(request.getBusinessName())
            .ownerName(request.getOwnerName())
            .mobile(request.getMobile())
            .userMobile(request.getUserMobile())
            .email(request.getEmail())
            .projectTypes(request.getProjectTypes())
            .requirement(request.getRequirement())
            .budget(request.getBudget())
            .timeline(request.getTimeline())
            .status(request.getStatus())
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .build();
    }

    private ClientSetupDetails toClientSetupDetails(ClientBusinessSetup setup) {
        if (setup == null) {
            return null;
        }

        return ClientSetupDetails.builder()
            .id(setup.getId())
            .onboardingRequestId(setup.getOnboardingRequestId())
            .businessName(setup.getBusinessName())
            .ownerName(setup.getOwnerName())
            .ownerContact(setup.getOwnerContact())
            .ownerEmail(setup.getOwnerEmail())
            .secondaryContact(setup.getSecondaryContact())
            .contacts(setup.getContacts())
            .businessEmail(setup.getBusinessEmail())
            .whatsappContact(setup.getWhatsappContact())
            .businessType(setup.getBusinessType())
            .businessLogoUrl(setup.getBusinessLogoUrl())
            .addressLine1(setup.getAddressLine1())
            .addressLine2(setup.getAddressLine2())
            .city(setup.getCity())
            .state(setup.getState())
            .pincode(setup.getPincode())
            .gstRegistered(setup.getGstRegistered())
            .gstNumber(setup.getGstNumber())
            .panNumber(setup.getPanNumber())
            .udyamNumber(setup.getUdyamNumber())
            .fssaiLicenseNumber(setup.getFssaiLicenseNumber())
            .status(setup.getStatus())
            .createdAt(setup.getCreatedAt())
            .updatedAt(setup.getUpdatedAt())
            .build();
    }

    private ServerSetupDetails toServerSetupDetails(ServerSetup setup) {
        if (setup == null) {
            return null;
        }

        return ServerSetupDetails.builder()
            .id(setup.getId())
            .onboardingRequestId(setup.getOnboardingRequest().getId())
            .serverName(setup.getServerName())
            .billingType(setup.getBillingType())
            .baseAmount(setup.getBaseAmount())
            .gstAmount(setup.getGstAmount())
            .totalAmount(setup.getTotalAmount())
            .skipped(Boolean.TRUE.equals(setup.getSkipped()))
            .createdAt(setup.getCreatedAt())
            .updatedAt(setup.getUpdatedAt())
            .build();
    }

    private MaintenanceSetupDetails toMaintenanceSetupDetails(
        MaintenanceSetup setup
    ) {
        if (setup == null) {
            return null;
        }

        return MaintenanceSetupDetails.builder()
            .id(setup.getId())
            .onboardingRequestId(setup.getOnboardingRequest().getId())
            .maintenanceType(setup.getMaintenanceType())
            .billingType(setup.getBillingType())
            .baseAmount(setup.getBaseAmount())
            .gstAmount(setup.getGstAmount())
            .totalAmount(setup.getTotalAmount())
            .createdAt(setup.getCreatedAt())
            .updatedAt(setup.getUpdatedAt())
            .build();
    }
}
