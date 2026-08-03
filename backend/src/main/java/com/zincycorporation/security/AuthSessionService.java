package com.zincycorporation.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zincycorporation.entity.AuthSession;
import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.AuthSessionRepository;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration LAST_SEEN_WRITE_INTERVAL = Duration.ofMinutes(15);

    private final AuthSessionRepository sessionRepository;

    @Value("${app.session.cookie-name:ZINCY_SESSION}")
    private String cookieName;

    @Value("${app.session.duration-hours:168}")
    private long durationHours;

    @Value("${app.session.secure:false}")
    private boolean secureCookie;

    @Value("${app.session.same-site:Lax}")
    private String sameSite;

    @Transactional
    public String createSessionCookie(Users user) {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(tokenBytes);

        Instant now = Instant.now();

        sessionRepository.save(
                AuthSession.builder()
                        .user(user)
                        .tokenHash(hash(rawToken))
                        .expiresAt(now.plus(Duration.ofHours(durationHours)))
                        .lastSeenAt(now)
                        .build());

        return buildCookie(rawToken, Duration.ofHours(durationHours));
    }

    @Transactional
    public Optional<Users> authenticate(HttpServletRequest request) {
        String rawToken = readToken(request);

        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        Instant now = Instant.now();

        return sessionRepository
                .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(
                        hash(rawToken),
                        now)
                .map(session -> {
                    if (session.getLastSeenAt()
                            .isBefore(now.minus(LAST_SEEN_WRITE_INTERVAL))) {
                        session.setLastSeenAt(now);
                    }

                    return session.getUser();
                });
    }

    @Transactional
    public void revoke(HttpServletRequest request) {
        String rawToken = readToken(request);

        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        sessionRepository
                .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(
                        hash(rawToken),
                        Instant.now())
                .ifPresent(session -> session.setRevokedAt(Instant.now()));
    }

    public String clearSessionCookie() {
        return buildCookie("", Duration.ZERO);
    }

    private String readToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring("Bearer ".length()).trim();
        }

        return null;
    }

    private String buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/api")
                .maxAge(maxAge)
                .build()
                .toString();
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
