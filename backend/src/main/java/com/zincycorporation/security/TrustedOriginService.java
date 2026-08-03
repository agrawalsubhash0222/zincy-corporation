package com.zincycorporation.security;

import java.net.URI;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class TrustedOriginService {

    private final boolean required;
    private final Set<String> allowedOrigins;

    public TrustedOriginService(
            @Value("${app.security.require-trusted-origin:false}")
            boolean required,
            @Value("${app.frontend-url}")
            String frontendUrls) {
        this.required = required;
        this.allowedOrigins = Arrays.stream(frontendUrls.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isTrusted(HttpServletRequest request) {
        if (!required) {
            return true;
        }

        String origin = request.getHeader("Origin");

        if (origin != null && !origin.isBlank()) {
            return isAllowed(origin);
        }

        String referer = request.getHeader("Referer");

        return referer != null
                && !referer.isBlank()
                && isAllowed(referer);
    }

    private boolean isAllowed(String value) {
        try {
            return allowedOrigins.contains(normalizeOrigin(value));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String normalizeOrigin(String value) {
        URI uri = URI.create(value.trim());

        if (uri.getScheme() == null || uri.getHost() == null) {
            throw new IllegalArgumentException("Invalid frontend origin");
        }

        String scheme = uri.getScheme().toLowerCase();
        String host = uri.getHost().toLowerCase();
        int port = uri.getPort();

        return scheme + "://" + host + (port == -1 ? "" : ":" + port);
    }
}
