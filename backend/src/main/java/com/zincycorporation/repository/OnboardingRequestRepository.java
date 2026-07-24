package com.zincycorporation.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.OnboardingRequest;

public interface OnboardingRequestRepository extends JpaRepository<OnboardingRequest, Long> {

    List<OnboardingRequest> findAllByOrderByCreatedAtDesc();

    List<OnboardingRequest> findByUserMobileOrderByCreatedAtDesc(String userMobile);

    Optional<OnboardingRequest> findTopByUserMobileOrderByCreatedAtDesc(String userMobile);
}