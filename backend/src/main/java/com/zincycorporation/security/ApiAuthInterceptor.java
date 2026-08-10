package com.zincycorporation.security;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zincycorporation.entity.Users;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ApiAuthInterceptor implements HandlerInterceptor {

    public static final String AUTHENTICATED_USER_ATTRIBUTE =
            ApiAuthInterceptor.class.getName() + ".USER";

    private final AuthSessionService authSessionService;
    private final TrustedOriginService trustedOriginService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws IOException {

        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        if (isUnsafeMethod(request)
                && !isPaymentWebhook(request)
                && !trustedOriginService.isTrusted(request)) {
            writeError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "Request origin is not allowed");
            return false;
        }

        if (isPublicEndpoint(request)) {
            return true;
        }

        Users user = authSessionService.authenticate(request)
                .orElse(null);

        if (user == null) {
            writeError(
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required");
            return false;
        }

        if (isAdminEndpoint(request.getRequestURI())
                && !isAdmin(user)) {
            writeError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "Administrator access is required");
            return false;
        }

        request.setAttribute(AUTHENTICATED_USER_ATTRIBUTE, user);
        return true;
    }

    private boolean isPublicEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();

        if (path.equals("/api/auth/whatsapp/send-otp")
                || path.equals("/api/auth/whatsapp/verify-otp")
                || path.equals("/api/auth/send-otp-twilio")
                || path.equals("/api/auth/verify-otp-twilio")
                || path.equals("/api/auth/logout")
                || path.equals("/api/payments/phonepe/webhook")
                || path.equals("/api/payments/razorpay/webhook")) {
            return true;
        }

        return path.equals("/api/enquiries")
                && HttpMethod.POST.matches(request.getMethod());
    }

    private boolean isUnsafeMethod(HttpServletRequest request) {
        return !HttpMethod.GET.matches(request.getMethod())
                && !HttpMethod.HEAD.matches(request.getMethod())
                && !HttpMethod.OPTIONS.matches(request.getMethod());
    }

    private boolean isPaymentWebhook(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/payments/phonepe/webhook")
                || path.equals("/api/payments/razorpay/webhook");
    }

    private boolean isAdminEndpoint(String path) {
        return path.startsWith("/api/admin/")
                || path.startsWith("/api/onboarding-requests/admin");
    }

    private boolean isAdmin(Users user) {
        return user.getRole() != null
                && user.getRole().equalsIgnoreCase("ADMIN");
    }

    private void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(
                response.getWriter(),
                Map.of(
                        "status", status.value(),
                        "error", status.getReasonPhrase(),
                        "message", message));
    }
}
