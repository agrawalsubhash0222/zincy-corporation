package com.zincycorporation.service.otp;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class OtpServiceWhatsapp {

    private record OtpData(
            String otp,
            Instant expiresAt,
            Instant sentAt,
            int failedAttempts) {
    }

    private final RestClient restClient = RestClient.create();
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Value("${whatsapp.api-url}")
    private String apiUrl;

    @Value("${whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${whatsapp.access-token}")
    private String accessToken;

    @Value("${whatsapp.template-name}")
    private String templateName;

    @Value("${whatsapp.template-language}")
    private String templateLanguage;

    @Value("${whatsapp.otp.expiry-minutes}")
    private long expiryMinutes;

    @Value("${whatsapp.otp.max-verification-attempts}")
    private int maxVerificationAttempts;

    @Value("${whatsapp.otp.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    public synchronized void sendOtp(String mobile) {
        ensureConfigured();

        String normalizedMobile = normalizeIndianMobile(mobile);
        Instant now = Instant.now();
        OtpData existingOtp = otpStore.get(normalizedMobile);

        if (existingOtp != null
                && now.isBefore(existingOtp.sentAt()
                        .plusSeconds(resendCooldownSeconds))) {
            throw new IllegalStateException(
                    "Please wait before requesting another OTP");
        }

        String otp = generateOtp();

        sendWhatsAppTemplate(normalizedMobile, otp);

        otpStore.put(
                normalizedMobile,
                new OtpData(
                        otp,
                        now.plusSeconds(expiryMinutes * 60),
                        now,
                        0));
    }

    public synchronized boolean verifyOtp(String mobile, String otp) {
        String normalizedMobile = normalizeIndianMobile(mobile);
        OtpData otpData = otpStore.get(normalizedMobile);

        if (otpData == null) {
            return false;
        }

        if (Instant.now().isAfter(otpData.expiresAt())) {
            otpStore.remove(normalizedMobile);
            return false;
        }

        if (otpData.failedAttempts() >= maxVerificationAttempts) {
            otpStore.remove(normalizedMobile);
            return false;
        }

        if (otpData.otp().equals(otp)) {
            otpStore.remove(normalizedMobile);
            return true;
        }

        int failedAttempts = otpData.failedAttempts() + 1;

        if (failedAttempts >= maxVerificationAttempts) {
            otpStore.remove(normalizedMobile);
        } else {
            otpStore.put(
                    normalizedMobile,
                    new OtpData(
                            otpData.otp(),
                            otpData.expiresAt(),
                            otpData.sentAt(),
                            failedAttempts));
        }

        return false;
    }

    private void sendWhatsAppTemplate(String mobile, String otp) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";

        List<Map<String, Object>> components = List.of(
                Map.of(
                        "type", "body",
                        "parameters", List.of(
                                Map.of(
                                        "type", "text",
                                        "text", otp))),
                Map.of(
                        "type", "button",
                        "sub_type", "url",
                        "index", "0",
                        "parameters", List.of(
                                Map.of(
                                        "type", "text",
                                        "text", otp))));

        Map<String, Object> requestBody = Map.of(
                "messaging_product", "whatsapp",
                "recipient_type", "individual",
                "to", mobile,
                "type", "template",
                "template", Map.of(
                        "name", templateName,
                        "language", Map.of(
                                "code", templateLanguage),
                        "components", components));

        try {
            restClient.post()
                    .uri(url)
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            "Bearer " + accessToken)
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException(
                    "WhatsApp could not send the OTP",
                    exception);
        }
    }

    private String generateOtp() {
        return String.valueOf(
                100000 + secureRandom.nextInt(900000));
    }

    private String normalizeIndianMobile(String mobile) {
        if (mobile == null) {
            throw new IllegalArgumentException(
                    "Mobile number is required");
        }

        String cleaned = mobile.replaceAll("\\D", "");

        if (cleaned.length() == 10
                && cleaned.matches("[6-9]\\d{9}")) {
            return "91" + cleaned;
        }

        if (cleaned.length() == 12
                && cleaned.startsWith("91")
                && cleaned.substring(2).matches("[6-9]\\d{9}")) {
            return cleaned;
        }

        throw new IllegalArgumentException(
                "Invalid Indian mobile number");
    }

    private void ensureConfigured() {
        if (phoneNumberId == null || phoneNumberId.isBlank()
                || accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException(
                    "WhatsApp is not configured");
        }
    }
}