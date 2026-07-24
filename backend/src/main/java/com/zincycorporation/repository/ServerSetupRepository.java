package com.zincycorporation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.ServerSetup;

public interface ServerSetupRepository
        extends JpaRepository<ServerSetup, Long> {

    Optional<ServerSetup> findByOnboardingRequestId(
        Long onboardingRequestId
    );

    boolean existsByOnboardingRequestId(
        Long onboardingRequestId
    );
}