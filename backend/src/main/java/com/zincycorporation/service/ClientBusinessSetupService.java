package com.zincycorporation.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zincycorporation.dto.ClientBusinessSetupResponseDto;
import com.zincycorporation.entity.ClientBusinessSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.repository.ClientBusinessSetupRepository;
import com.zincycorporation.repository.OnboardingRequestRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClientBusinessSetupService {

        private final ClientBusinessSetupRepository repository;
        private final OnboardingRequestRepository onboardingRequestRepository;
        private final ObjectMapper objectMapper;

        @Transactional
        public ClientBusinessSetup save(
                        ClientBusinessSetupResponseDto dto) {

                if (dto.getOnboardingRequestId() == null) {
                        throw new RuntimeException(
                                        "onboardingRequestId is required");
                }

                OnboardingRequest onboardingRequest = onboardingRequestRepository
                                .findById(dto.getOnboardingRequestId())
                                .orElseThrow(
                                                () -> new RuntimeException(
                                                                "Onboarding request not found: "
                                                                                + dto.getOnboardingRequestId()));

                ClientBusinessSetup setup = repository
                                .findByOnboardingRequestId(
                                                dto.getOnboardingRequestId())
                                .orElseGet(ClientBusinessSetup::new);

                setup.setOnboardingRequestId(
                                dto.getOnboardingRequestId());

                setup.setBusinessName(
                                trimToNull(dto.getBusinessName()));

                setup.setOwnerName(
                                trimToNull(dto.getOwnerName()));

                setup.setOwnerContact(
                                trimToNull(dto.getOwnerContact()));

                setup.setOwnerEmail(
                                trimToNull(dto.getOwnerEmail()));

                setup.setSecondaryContact(
                                trimToNull(dto.getSecondaryContact()));

                setup.setContacts(
                                toJson(dto.getContacts()));

                setup.setBusinessEmail(
                                trimToNull(dto.getEmail()));

                setup.setWhatsappContact(
                                trimToNull(dto.getWhatsappContact()));

                setup.setBusinessType(
                                trimToNull(dto.getBusinessType()));

                setup.setBusinessLogoUrl(
                                trimToNull(dto.getBusinessLogo()));

                setup.setAddressLine1(
                                trimToNull(dto.getAddressLine1()));

                setup.setAddressLine2(
                                trimToNull(dto.getAddressLine2()));

                setup.setCity(
                                trimToNull(dto.getCity()));

                setup.setState(
                                trimToNull(dto.getState()));

                setup.setPincode(
                                trimToNull(dto.getPincode()));

                setup.setGstRegistered(
                                Boolean.TRUE.equals(
                                                dto.getGstRegistered()));

                setup.setGstNumber(
                                Boolean.TRUE.equals(
                                                dto.getGstRegistered())
                                                                ? trimToNull(dto.getGstNumber())
                                                                : null);

                setup.setPanNumber(
                                trimToNull(dto.getPanNumber()));

                setup.setUdyamNumber(
                                trimToNull(dto.getMsmeNumber()));

                setup.setFssaiLicenseNumber(
                                trimToNull(dto.getFssaiNumber()));

                /*
                 * Step 1:
                 * Save client_business_setup first.
                 */
                ClientBusinessSetup savedSetup = repository.saveAndFlush(setup);

                /*
                 * Step 2:
                 * Only after client data is saved successfully,
                 * set onboarding_requests.client_setup_completed = 1.
                 */
                onboardingRequest.setClientSetupCompleted(true);

                onboardingRequestRepository.saveAndFlush(
                                onboardingRequest);

                return savedSetup;
        }

        @Transactional(readOnly = true)
        public ClientBusinessSetupResponseDto getByOnboardingRequestId(
                        Long onboardingRequestId) {

                if (onboardingRequestId == null ||
                                onboardingRequestId <= 0) {
                        throw new RuntimeException(
                                        "Valid onboarding request ID is required");
                }

                ClientBusinessSetup setup = repository
                                .findByOnboardingRequestId(
                                                onboardingRequestId)
                                .orElseThrow(
                                                () -> new RuntimeException(
                                                                "Client business setup not found for onboarding request: "
                                                                                + onboardingRequestId));

                return toResponseDto(setup);
        }

        @Transactional
        public boolean existsByOnboardingRequestId(
                        Long onboardingRequestId) {

                if (onboardingRequestId == null ||
                                onboardingRequestId <= 0) {
                        return false;
                }

                boolean exists = repository.existsByOnboardingRequestId(
                                onboardingRequestId);

                /*
                 * Self-repair the completion flag when the setup row
                 * already exists but onboarding_requests still contains 0.
                 */
                if (exists) {
                        onboardingRequestRepository
                                        .findById(onboardingRequestId)
                                        .ifPresent(onboardingRequest -> {
                                                if (!Boolean.TRUE.equals(
                                                                onboardingRequest
                                                                                .getClientSetupCompleted())) {

                                                        onboardingRequest
                                                                        .setClientSetupCompleted(true);

                                                        onboardingRequestRepository
                                                                        .save(onboardingRequest);
                                                }
                                        });
                }

                return exists;
        }

        private ClientBusinessSetupResponseDto toResponseDto(
                        ClientBusinessSetup setup) {

                return ClientBusinessSetupResponseDto.builder()
                                .id(setup.getId())
                                .onboardingRequestId(
                                                setup.getOnboardingRequestId())

                                .businessName(
                                                setup.getBusinessName())

                                .ownerName(
                                                setup.getOwnerName())
                                .ownerContact(
                                                setup.getOwnerContact())
                                .ownerEmail(
                                                setup.getOwnerEmail())
                                .secondaryContact(
                                                setup.getSecondaryContact())

                                .contacts(
                                                fromJson(setup.getContacts()))

                                .email(
                                                setup.getBusinessEmail())
                                .whatsappContact(
                                                setup.getWhatsappContact())
                                .businessType(
                                                setup.getBusinessType())
                                .businessLogo(
                                                setup.getBusinessLogoUrl())

                                .addressLine1(
                                                setup.getAddressLine1())
                                .addressLine2(
                                                setup.getAddressLine2())
                                .city(
                                                setup.getCity())
                                .state(
                                                setup.getState())
                                .pincode(
                                                setup.getPincode())

                                .gstRegistered(
                                                setup.getGstRegistered())
                                .gstNumber(
                                                setup.getGstNumber())
                                .panNumber(
                                                setup.getPanNumber())
                                .msmeNumber(
                                                setup.getUdyamNumber())
                                .fssaiNumber(
                                                setup.getFssaiLicenseNumber())

                                .createdAt(
                                                setup.getCreatedAt())
                                .updatedAt(
                                                setup.getUpdatedAt())
                                .build();
        }

        private String toJson(List<String> contacts) {
                try {
                        List<String> safeContacts = contacts == null
                                        ? Collections.emptyList()
                                        : contacts;

                        return objectMapper.writeValueAsString(
                                        safeContacts);
                } catch (JsonProcessingException exception) {
                        throw new RuntimeException(
                                        "Unable to convert contacts to JSON",
                                        exception);
                }
        }

        private List<String> fromJson(String value) {
                if (value == null || value.isBlank()) {
                        return Collections.emptyList();
                }

                try {
                        return objectMapper.readValue(
                                        value,
                                        new TypeReference<List<String>>() {
                                        });
                } catch (JsonProcessingException exception) {
                        throw new RuntimeException(
                                        "Unable to read contacts JSON",
                                        exception);
                }
        }

        private String trimToNull(String value) {
                if (value == null) {
                        return null;
                }

                String normalized = value.trim();

                return normalized.isEmpty()
                                ? null
                                : normalized;
        }
}