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
            @Value("${app.security.require-trusted-origin:false}") boolean required,
            @Value("${app.frontend-url}") String frontendUrls) {
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

        // Browser requests must always come from an explicitly trusted origin.
        // Never allow a client header to override an invalid browser Origin.
        if (origin != null && !origin.isBlank()) {
            return isAllowed(origin);
        }

        String referer = request.getHeader("Referer");

        if (referer != null && !referer.isBlank()) {
            return isAllowed(referer);
        }

        // Native Android/iOS requests normally do not send Origin or Referer.
        // They must explicitly identify themselves as the Zincy native client.
        String client = request.getHeader("X-Zincy-Client");

        return client != null
                && "native".equalsIgnoreCase(client.trim());
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
