package com.zincycorporation.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.zincycorporation.entity.AuthSession;

public interface AuthSessionRepository
        extends JpaRepository<AuthSession, Long> {

    @EntityGraph(attributePaths = "user")
    Optional<AuthSession> findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            Instant now);
}
