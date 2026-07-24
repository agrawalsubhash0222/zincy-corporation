package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zincycorporation.dto.ServerSetupRequest;
import com.zincycorporation.dto.ServerSetupResponse;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.ServerSetup;
import com.zincycorporation.repository.OnboardingRequestRepository;
import com.zincycorporation.repository.ServerSetupRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServerSetupService {

        private static final BigDecimal GST_RATE = new BigDecimal("0.18");

        private final ServerSetupRepository serverSetupRepository;
        private final OnboardingRequestRepository onboardingRequestRepository;

        @Transactional
        public ServerSetupResponse save(ServerSetupRequest dto) {
                validate(dto);

                OnboardingRequest onboardingRequest = onboardingRequestRepository
                                .findById(dto.getOnboardingRequestId())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Onboarding request not found: "
                                                                                + dto.getOnboardingRequestId()));

                boolean skipped = Boolean.TRUE.equals(dto.getSkipped());

                ServerSetup serverSetup = serverSetupRepository
                                .findByOnboardingRequestId(
                                                dto.getOnboardingRequestId())
                                .orElseGet(ServerSetup::new);

                serverSetup.setOnboardingRequest(onboardingRequest);
                serverSetup.setSkipped(skipped);

                if (skipped) {
                        applySkippedSetup(serverSetup);
                } else {
                        applySelectedPlan(serverSetup, dto);
                }

                /*
                 * The step is complete whether the user selected
                 * a plan or deliberately skipped it.
                 */
                onboardingRequest.setServerSetupCompleted(true);

                ServerSetup saved = serverSetupRepository.save(serverSetup);

                /*
                 * This save is acceptable. Inside a transactional method,
                 * JPA dirty checking would also update the loaded entity.
                 */
                onboardingRequestRepository.save(onboardingRequest);

                return mapToResponse(saved, onboardingRequest);
        }

        @Transactional(readOnly = true)
        public ServerSetupResponse getByOnboardingRequestId(
                        Long onboardingRequestId) {
                if (onboardingRequestId == null) {
                        throw new IllegalArgumentException(
                                        "onboardingRequestId is required");
                }

                ServerSetup serverSetup = serverSetupRepository
                                .findByOnboardingRequestId(onboardingRequestId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Server setup not found for onboarding request: "
                                                                                + onboardingRequestId));

                return mapToResponse(
                                serverSetup,
                                serverSetup.getOnboardingRequest());
        }

        private void applySkippedSetup(
                        ServerSetup serverSetup) {
                serverSetup.setServerName("SKIPPED");
                serverSetup.setBillingType(null);

                serverSetup.setBaseAmount(BigDecimal.ZERO);
                serverSetup.setGstAmount(BigDecimal.ZERO);
                serverSetup.setTotalAmount(BigDecimal.ZERO);
        }

        private void applySelectedPlan(
                        ServerSetup serverSetup,
                        ServerSetupRequest dto) {
                BigDecimal baseAmount = dto.getAmount().setScale(
                                2,
                                RoundingMode.HALF_UP);

                BigDecimal gstAmount = baseAmount
                                .multiply(GST_RATE)
                                .setScale(
                                                2,
                                                RoundingMode.HALF_UP);

                BigDecimal totalAmount = baseAmount
                                .add(gstAmount)
                                .setScale(
                                                2,
                                                RoundingMode.HALF_UP);

                serverSetup.setServerName(
                                dto.getServerName().trim());

                serverSetup.setBillingType(
                                dto.getBillingType());

                serverSetup.setBaseAmount(baseAmount);
                serverSetup.setGstAmount(gstAmount);
                serverSetup.setTotalAmount(totalAmount);
        }

        private void validate(ServerSetupRequest dto) {
                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Request body is required");
                }

                if (dto.getOnboardingRequestId() == null) {
                        throw new IllegalArgumentException(
                                        "onboardingRequestId is required");
                }

                boolean skipped = Boolean.TRUE.equals(dto.getSkipped());

                if (skipped) {
                        return;
                }

                if (dto.getServerName() == null
                                || dto.getServerName().isBlank()) {
                        throw new IllegalArgumentException(
                                        "serverName is required");
                }

                if (dto.getBillingType() == null) {
                        throw new IllegalArgumentException(
                                        "billingType is required");
                }

                if (dto.getAmount() == null
                                || dto.getAmount().compareTo(
                                                BigDecimal.ZERO) <= 0) {
                        throw new IllegalArgumentException(
                                        "amount must be greater than zero");
                }
        }

        private ServerSetupResponse mapToResponse(
                        ServerSetup serverSetup,
                        OnboardingRequest onboardingRequest) {
                return ServerSetupResponse.builder()
                                .id(serverSetup.getId())
                                .onboardingRequestId(
                                                onboardingRequest.getId())
                                .serverName(
                                                serverSetup.getServerName())
                                .billingType(
                                                serverSetup.getBillingType())
                                .baseAmount(
                                                serverSetup.getBaseAmount())
                                .gstAmount(
                                                serverSetup.getGstAmount())
                                .totalAmount(
                                                serverSetup.getTotalAmount())
                                .skipped(
                                                serverSetup.getSkipped())
                                .serverSetupCompleted(
                                                onboardingRequest
                                                                .getServerSetupCompleted())
                                .createdAt(
                                                serverSetup.getCreatedAt())
                                .updatedAt(
                                                serverSetup.getUpdatedAt())
                                .build();
        }
}