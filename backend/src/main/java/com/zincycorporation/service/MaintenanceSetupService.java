package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zincycorporation.dto.MaintenanceSetupRequest;
import com.zincycorporation.dto.MaintenanceSetupResponse;
import com.zincycorporation.entity.MaintenanceSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;
import com.zincycorporation.repository.MaintenanceSetupRepository;
import com.zincycorporation.repository.OnboardingRequestRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MaintenanceSetupService {

        private static final BigDecimal GST_RATE = new BigDecimal("0.18");

        private final MaintenanceSetupRepository maintenanceSetupRepository;

        private final OnboardingRequestRepository onboardingRequestRepository;

        @Transactional
        public MaintenanceSetupResponse save(
                        MaintenanceSetupRequest dto) {
                validate(dto);

                OnboardingRequest onboardingRequest = onboardingRequestRepository
                                .findById(dto.getOnboardingRequestId())
                                .orElseThrow(
                                                () -> new RuntimeException(
                                                                "Onboarding request not found: "
                                                                                + dto.getOnboardingRequestId()));

                BigDecimal baseAmount = resolveBaseAmount(dto);

                BigDecimal gstAmount = baseAmount
                                .multiply(GST_RATE)
                                .setScale(2, RoundingMode.HALF_UP);

                BigDecimal totalAmount = baseAmount
                                .add(gstAmount)
                                .setScale(2, RoundingMode.HALF_UP);

                MaintenanceBillingType billingType = resolveBillingType(dto);

                MaintenanceSetup maintenanceSetup = maintenanceSetupRepository
                                .findByOnboardingRequestId(
                                                dto.getOnboardingRequestId())
                                .orElseGet(MaintenanceSetup::new);

                maintenanceSetup.setOnboardingRequest(
                                onboardingRequest);

                maintenanceSetup.setMaintenanceType(
                                dto.getMaintenanceType());

                maintenanceSetup.setBillingType(
                                billingType);

                maintenanceSetup.setBaseAmount(
                                baseAmount);

                maintenanceSetup.setGstAmount(
                                gstAmount);

                maintenanceSetup.setTotalAmount(
                                totalAmount);

                MaintenanceSetup saved = maintenanceSetupRepository.save(
                                maintenanceSetup);

                /*
                 * This stores 1 in maintenance_setup_completed.
                 */
                onboardingRequest.setMaintenanceSetupCompleted(
                                true);

                onboardingRequestRepository.save(
                                onboardingRequest);

                return mapResponse(saved);
        }

        @Transactional(readOnly = true)
        public Optional<MaintenanceSetupResponse> findByOnboardingRequestId(
                        Long onboardingRequestId) {

                return maintenanceSetupRepository
                                .findByOnboardingRequestId(onboardingRequestId)
                                .map(this::mapResponse);
        }

        private void validate(
                        MaintenanceSetupRequest dto) {
                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Maintenance setup request is required");
                }

                if (dto.getOnboardingRequestId() == null) {
                        throw new IllegalArgumentException(
                                        "onboardingRequestId is required");
                }

                if (dto.getMaintenanceType() == null) {
                        throw new IllegalArgumentException(
                                        "maintenanceType is required");
                }

                if (dto.getMaintenanceType() == MaintenanceType.ZINCY_MANAGED
                                && (dto.getBillingType() == null
                                                || dto.getBillingType() == MaintenanceBillingType.NA)) {
                        throw new IllegalArgumentException(
                                        "Monthly or yearly billing is required for Zincy Managed Maintenance");
                }
        }

        private BigDecimal resolveBaseAmount(
                        MaintenanceSetupRequest dto) {
                if (dto.getMaintenanceType() != MaintenanceType.ZINCY_MANAGED) {
                        return BigDecimal.ZERO.setScale(2);
                }

                if (dto.getBaseAmount() == null
                                || dto.getBaseAmount()
                                                .compareTo(BigDecimal.ZERO) < 0) {
                        throw new IllegalArgumentException(
                                        "Valid maintenance amount is required");
                }

                return dto.getBaseAmount()
                                .setScale(2, RoundingMode.HALF_UP);
        }

        private MaintenanceBillingType resolveBillingType(
                        MaintenanceSetupRequest dto) {
                if (dto.getMaintenanceType() != MaintenanceType.ZINCY_MANAGED) {
                        return MaintenanceBillingType.NA;
                }

                return dto.getBillingType();
        }

        private MaintenanceSetupResponse mapResponse(
                        MaintenanceSetup setup) {
                return MaintenanceSetupResponse
                                .builder()
                                .id(setup.getId())
                                .onboardingRequestId(
                                                setup.getOnboardingRequest().getId())
                                .maintenanceType(
                                                setup.getMaintenanceType())
                                .billingType(
                                                setup.getBillingType())
                                .baseAmount(
                                                setup.getBaseAmount())
                                .gstAmount(
                                                setup.getGstAmount())
                                .totalAmount(
                                                setup.getTotalAmount())
                                .maintenanceSetupCompleted(true)
                                .build();
        }
}