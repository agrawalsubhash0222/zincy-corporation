package com.zincycorporation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zincycorporation.entity.MaintenanceSetup;

@Repository
public interface MaintenanceSetupRepository
        extends JpaRepository<MaintenanceSetup, Long> {

    Optional<MaintenanceSetup> findByOnboardingRequestId(
        Long onboardingRequestId
    );
}