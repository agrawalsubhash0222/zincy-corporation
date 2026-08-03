package com.zincycorporation.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.OnboardingRequestRepository;
import com.zincycorporation.security.CurrentUserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OnboardingAccessService {

    private final OnboardingRequestRepository onboardingRepository;
    private final CurrentUserService currentUserService;

    public OnboardingRequest requireOwned(Long onboardingRequestId) {
        if (onboardingRequestId == null || onboardingRequestId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid onboarding request ID is required");
        }

        OnboardingRequest onboarding = onboardingRepository
                .findById(onboardingRequestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Onboarding request not found"));

        Users currentUser = currentUserService.requireUser();

        if (onboarding.getUserMobile() == null
                || currentUser.getMobile() == null
                || !onboarding.getUserMobile()
                        .equals(currentUser.getMobile())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access this onboarding request");
        }

        return onboarding;
    }
}
