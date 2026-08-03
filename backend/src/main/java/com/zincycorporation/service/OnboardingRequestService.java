package com.zincycorporation.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.zincycorporation.dto.CustomerLatestOnboardingResponse;
import com.zincycorporation.dto.OnboardingRequestDto;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.OnboardingNextStep;
import com.zincycorporation.enums.OnboardingStatus;
import com.zincycorporation.repository.OnboardingRequestRepository;
import com.zincycorporation.security.CurrentUserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OnboardingRequestService {

        private final OnboardingRequestRepository repository;
        private final CurrentUserService currentUserService;
        private final OnboardingAccessService onboardingAccessService;

        @Transactional
        public OnboardingRequest submit(
                        OnboardingRequestDto dto) {
                String formMobile = normalizeMobile(dto.getMobile());
                Users currentUser = currentUserService.requireUser();
                String loggedInUserMobile = currentUser.getMobile();

                OnboardingRequest request = OnboardingRequest.builder()
                                .businessName(
                                                normalizeText(
                                                                dto.getBusinessName()))
                                .ownerName(
                                                normalizeText(
                                                                dto.getOwnerName()))
                                .mobile(formMobile)
                                .userMobile(loggedInUserMobile)
                                .email(
                                                normalizeText(
                                                                dto.getEmail()))
                                .projectTypes(
                                                dto.getProjectTypes() == null
                                                                ? ""
                                                                : String.join(
                                                                                ", ",
                                                                                dto.getProjectTypes()))
                                .requirement(
                                                normalizeText(
                                                                dto.getRequirement()))
                                .budget(
                                                normalizeText(
                                                                dto.getBudget()))
                                .timeline(
                                                normalizeText(
                                                                dto.getTimeline()))
                                .status(
                                                OnboardingStatus.SUBMITTED)
                                .clientSetupCompleted(false)
                                .serverSetupCompleted(false)
                                .maintenanceSetupCompleted(false)
                                .build();

                return repository.save(request);
        }

        @Transactional(readOnly = true)
        public List<OnboardingRequest> getAll() {
                return repository
                                .findAllByOrderByCreatedAtDesc();
        }

        @Transactional
        public OnboardingRequest updateStatus(
                        Long id,
                        String status) {
                OnboardingRequest request = findRequest(id);

                OnboardingStatus nextStatus = parseStatus(status);

                OnboardingStatus currentStatus = request.getStatus();

                if (currentStatus == null) {
                        currentStatus = OnboardingStatus.SUBMITTED;

                        request.setStatus(currentStatus);
                }

                if (currentStatus == nextStatus) {
                        return request;
                }

                if (!isValidTransition(
                                currentStatus,
                                nextStatus)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Status cannot be changed from "
                                                        + currentStatus
                                                        + " to "
                                                        + nextStatus);
                }

                request.setStatus(nextStatus);

                return repository.save(request);
        }

        @Transactional(readOnly = true)
        public List<CustomerLatestOnboardingResponse> getCustomerRequests() {
                String normalizedMobile = currentUserService
                                .requireUser()
                                .getMobile();

                return repository
                                .findByUserMobileOrderByCreatedAtDesc(
                                                normalizedMobile)
                                .stream()
                                .map(this::toCustomerResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public CustomerLatestOnboardingResponse getCustomerRequestProgress(Long id) {
                return toCustomerResponse(
                                onboardingAccessService.requireOwned(id));
        }

        private CustomerLatestOnboardingResponse toCustomerResponse(
                        OnboardingRequest request) {

                boolean clientCompleted = request.isClientSetupCompleted();

                boolean serverCompleted = request.isServerSetupCompleted();

                boolean maintenanceCompleted = request.isMaintenanceSetupCompleted();

                return CustomerLatestOnboardingResponse
                                .builder()
                                .id(request.getId())
                                .businessName(
                                                request.getBusinessName())
                                .ownerName(
                                                request.getOwnerName())
                                .mobile(request.getMobile())
                                .userMobile(
                                                request.getUserMobile())
                                .email(request.getEmail())
                                .projectTypes(
                                                request.getProjectTypes())
                                .requirement(
                                                request.getRequirement())
                                .budget(request.getBudget())
                                .timeline(request.getTimeline())
                                .status(request.getStatus())
                                .clientSetupCompleted(
                                                clientCompleted)
                                .serverSetupCompleted(
                                                serverCompleted)
                                .maintenanceSetupCompleted(
                                                maintenanceCompleted)
                                .nextStep(
                                                determineNextStep(
                                                                clientCompleted,
                                                                serverCompleted,
                                                                maintenanceCompleted))
                                .build();
        }

        /*
         * Priority is intentionally checked from the final
         * stage backwards.
         */
        private OnboardingNextStep determineNextStep(
                        boolean clientCompleted,
                        boolean serverCompleted,
                        boolean maintenanceCompleted) {
                if (maintenanceCompleted) {
                        return OnboardingNextStep.CHECKOUT;
                }

                if (serverCompleted) {
                        return OnboardingNextStep.SERVER_SETUP_SUCCESS;
                }

                if (clientCompleted) {
                        return OnboardingNextStep.CLIENT_SETUP_SUCCESS;
                }

                return OnboardingNextStep.REQUEST_DETAILS;
        }

        private OnboardingRequest findRequest(Long id) {
                if (id == null || id <= 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "A valid onboarding request ID is required");
                }

                return repository
                                .findById(id)
                                .orElseThrow(
                                                () -> new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Onboarding request not found: "
                                                                                + id));
        }

        private OnboardingStatus parseStatus(
                        String status) {
                if (status == null || status.isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Status is required");
                }

                try {
                        return OnboardingStatus.valueOf(
                                        status
                                                        .trim()
                                                        .toUpperCase(
                                                                        Locale.ROOT));
                } catch (IllegalArgumentException exception) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Invalid onboarding status: "
                                                        + status);
                }
        }

        private boolean isValidTransition(
                        OnboardingStatus currentStatus,
                        OnboardingStatus nextStatus) {
                return switch (currentStatus) {
                        case SUBMITTED ->
                                Set.of(
                                                OnboardingStatus.REVIEW,
                                                OnboardingStatus.REJECTED).contains(nextStatus);

                        case REVIEW ->
                                Set.of(
                                                OnboardingStatus.CONTACTED,
                                                OnboardingStatus.REJECTED).contains(nextStatus);

                        case CONTACTED ->
                                Set.of(
                                                OnboardingStatus.APPROVED,
                                                OnboardingStatus.REJECTED).contains(nextStatus);

                        case APPROVED, REJECTED -> false;
                };
        }

        private String normalizeMobile(
                        String mobile) {
                if (mobile == null ||
                                mobile.isBlank()) {
                        return null;
                }

                String digits = mobile.replaceAll(
                                "[^0-9]",
                                "");

                if (digits.length() == 10) {
                        return "+91" + digits;
                }

                if (digits.length() == 12 &&
                                digits.startsWith("91")) {
                        return "+" + digits;
                }

                return mobile.trim();
        }

        private String normalizeText(
                        String value) {
                return value == null
                                ? null
                                : value.trim();
        }
}
