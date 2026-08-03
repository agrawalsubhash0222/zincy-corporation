package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zincycorporation.constants.MaintenancePricingCatalog;
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
        private final OnboardingAccessService onboardingAccessService;

        @Transactional
        public MaintenanceSetupResponse save(
                        MaintenanceSetupRequest dto) {
                validate(dto);

                OnboardingRequest onboardingRequest =
                                onboardingAccessService.requireOwned(
                                                dto.getOnboardingRequestId());

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

                onboardingAccessService.requireOwned(onboardingRequestId);

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
                return MaintenancePricingCatalog.resolve(
                                dto.getMaintenanceType(),
                                dto.getBillingType());
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
