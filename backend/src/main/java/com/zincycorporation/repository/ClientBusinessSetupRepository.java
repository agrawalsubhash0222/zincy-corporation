package com.zincycorporation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zincycorporation.entity.ClientBusinessSetup;

@Repository
public interface ClientBusinessSetupRepository
                extends JpaRepository<ClientBusinessSetup, Long> {

        Optional<ClientBusinessSetup> findByOnboardingRequestId(
                        Long onboardingRequestId);

        boolean existsByOnboardingRequestId(
                        Long onboardingRequestId);
}