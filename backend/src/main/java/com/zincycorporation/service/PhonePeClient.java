package com.zincycorporation.service;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PhonePeClient {

    public record CreatedOrder(
            String orderId,
            String state,
            LocalDateTime expiresAt,
            String redirectUrl) {
    }

    public record OrderStatus(
            String orderId,
            String state,
            long amountPaise,
            String transactionId,
            String paymentMode,
            String failureCode,
            String failureReason) {
    }

    private record AccessToken(String value, long expiresAtEpochSeconds) {
    }

    private static final long TOKEN_REFRESH_SAFETY_SECONDS = 300;

    static boolean isUpiPaymentMode(String paymentMode) {
        if (paymentMode == null) {
            return false;
        }

        return switch (paymentMode.trim().toUpperCase(Locale.ROOT)) {
            case "UPI_INTENT", "UPI_QR", "UPI_COLLECT" -> true;
            default -> false;
        };
    }

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private volatile AccessToken accessToken;

    @Value("${phonepe.enabled:false}")
    private boolean enabled;

    @Value("${phonepe.client-id:}")
    private String clientId;

    @Value("${phonepe.client-secret:}")
    private String clientSecret;

    @Value("${phonepe.client-version:1}")
    private String clientVersion;

    @Value("${phonepe.oauth-url}")
    private String oauthUrl;

    @Value("${phonepe.api-base-url}")
    private String apiBaseUrl;

    @Value("${phonepe.webhook.username:}")
    private String webhookUsername;

    @Value("${phonepe.webhook.password:}")
    private String webhookPassword;

    public PhonePeClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(20));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public CreatedOrder createPayment(
            String merchantOrderId,
            long amountPaise,
            String redirectUrl,
            String mobile) {
        ensureConfigured();

        Map<String, Object> paymentModeConfig = new LinkedHashMap<>();
        paymentModeConfig.put("version", "V2");
        paymentModeConfig.put(
                "enabledPaymentModes",
                List.of(Map.of(
                        "type", "UPI",
                        "flows", List.of("INTENT", "QR", "COLLECT"))));

        Map<String, Object> paymentFlow = new LinkedHashMap<>();
        paymentFlow.put("type", "PG_CHECKOUT");
        paymentFlow.put(
                "merchantUrls",
                Map.of("redirectUrl", redirectUrl));
        paymentFlow.put("paymentModeConfig", paymentModeConfig);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("merchantOrderId", merchantOrderId);
        body.put("amount", amountPaise);
        body.put("expireAfter", 1200);
        body.put("paymentFlow", paymentFlow);
        body.put("disablePaymentRetry", false);
        body.put(
                "metaInfo",
                Map.of("udf1", merchantOrderId));

        if (mobile != null && !mobile.isBlank()) {
            body.put(
                    "prefillUserLoginDetails",
                    Map.of("phoneNumber", mobile));
        }

        try {
            String responseBody = restClient.post()
                    .uri(apiBaseUrl + "/checkout/v2/pay")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            "O-Bearer " + token())
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode response = parseJson(
                    responseBody,
                    "PhonePe returned an invalid order response");

            if (response == null
                    || text(response, "orderId") == null
                    || text(response, "redirectUrl") == null) {
                throw gatewayFailure("PhonePe returned an incomplete order");
            }

            return new CreatedOrder(
                    text(response, "orderId"),
                    text(response, "state"),
                    toDateTime(response.path("expireAt").asLong(0)),
                    text(response, "redirectUrl"));
        } catch (RestClientResponseException exception) {
            throw gatewayFailure(
                    "PhonePe rejected the payment request",
                    exception);
        } catch (RestClientException exception) {
            throw gatewayFailure(
                    "PhonePe payment service could not be reached",
                    exception);
        }
    }

    public OrderStatus getOrderStatus(String merchantOrderId) {
        ensureConfigured();

        String url = apiBaseUrl
                + "/checkout/v2/order/"
                + merchantOrderId
                + "/status?details=true&errorContext=true";

        try {
            String responseBody = restClient.get()
                    .uri(url)
                    .accept(MediaType.APPLICATION_JSON)
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            "O-Bearer " + token())
                    .retrieve()
                    .body(String.class);
            JsonNode response = parseJson(
                    responseBody,
                    "PhonePe returned an invalid status response");

            if (response == null || text(response, "state") == null) {
                throw gatewayFailure("PhonePe returned an incomplete status");
            }

            JsonNode latestCompleted = null;
            JsonNode paymentDetails = response.path("paymentDetails");

            if (paymentDetails.isArray()) {
                for (JsonNode attempt : paymentDetails) {
                    if ("COMPLETED".equalsIgnoreCase(
                            text(attempt, "state"))) {
                        latestCompleted = attempt;
                    }
                }
            }

            JsonNode errorContext = response.path("errorContext");

            return new OrderStatus(
                    text(response, "orderId"),
                    text(response, "state"),
                    response.path("amount").asLong(0),
                    latestCompleted == null
                            ? null
                            : text(latestCompleted, "transactionId"),
                    latestCompleted == null
                            ? null
                            : text(latestCompleted, "paymentMode"),
                    firstNonBlank(
                            text(errorContext, "errorCode"),
                            text(errorContext, "detailedErrorCode")),
                    firstNonBlank(
                            text(errorContext, "errorDescription"),
                            text(errorContext, "detailedErrorDescription")));
        } catch (RestClientResponseException exception) {
            throw gatewayFailure(
                    "PhonePe payment status could not be verified",
                    exception);
        } catch (RestClientException exception) {
            throw gatewayFailure(
                    "PhonePe payment service could not be reached",
                    exception);
        }
    }

    public boolean verifyWebhookAuthorization(String authorization) {
        if (webhookUsername == null || webhookUsername.isBlank()
                || webhookPassword == null || webhookPassword.isBlank()
                || authorization == null || authorization.isBlank()) {
            return false;
        }

        String received = authorization.trim();
        int separator = received.indexOf(' ');
        if (separator >= 0) {
            received = received.substring(separator + 1).trim();
        }

        return MessageDigest.isEqual(
                sha256Hex(webhookUsername + ":" + webhookPassword)
                        .getBytes(StandardCharsets.UTF_8),
                received.getBytes(StandardCharsets.UTF_8));
    }

    private String token() {
        AccessToken cached = accessToken;
        long now = Instant.now().getEpochSecond();

        if (cached != null
                && now < cached.expiresAtEpochSeconds()
                        - TOKEN_REFRESH_SAFETY_SECONDS) {
            return cached.value();
        }

        synchronized (this) {
            cached = accessToken;
            now = Instant.now().getEpochSecond();

            if (cached != null
                    && now < cached.expiresAtEpochSeconds()
                            - TOKEN_REFRESH_SAFETY_SECONDS) {
                return cached.value();
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("client_id", clientId);
            form.add("client_version", clientVersion);
            form.add("client_secret", clientSecret);
            form.add("grant_type", "client_credentials");

            try {
                String responseBody = restClient.post()
                        .uri(oauthUrl)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(String.class);
                JsonNode response = parseJson(
                        responseBody,
                        "PhonePe authorization returned an invalid response");

                String value = response == null
                        ? null
                        : text(response, "access_token");
                long expiresAt = response == null
                        ? 0
                        : response.path("expires_at").asLong(0);

                if (value == null || expiresAt <= now) {
                    throw gatewayFailure(
                            "PhonePe authorization returned an invalid token");
                }

                accessToken = new AccessToken(value, expiresAt);
                return value;
            } catch (RestClientResponseException exception) {
                throw gatewayFailure(
                        "PhonePe authorization failed",
                        exception);
            } catch (RestClientException exception) {
                throw gatewayFailure(
                        "PhonePe authorization service could not be reached",
                        exception);
            }
        }
    }

    private JsonNode parseJson(String body, String failureMessage) {
        if (body == null || body.isBlank()) {
            throw gatewayFailure(failureMessage);
        }

        try {
            return objectMapper.readTree(body);
        } catch (JsonProcessingException exception) {
            throw gatewayFailure(failureMessage, exception);
        }
    }

    private void ensureConfigured() {
        if (!enabled) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "PhonePe payments are not enabled");
        }

        if (clientId == null || clientId.isBlank()
                || clientSecret == null || clientSecret.isBlank()
                || clientVersion == null || clientVersion.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "PhonePe payments are not configured");
        }
    }

    private ResponseStatusException gatewayFailure(String message) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
    }

    private ResponseStatusException gatewayFailure(
            String message,
            Exception cause) {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                message,
                cause);
    }

    private String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        JsonNode value = node.get(field);
        return value == null || value.isNull() || value.asText().isBlank()
                ? null
                : value.asText();
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private LocalDateTime toDateTime(long epochMillis) {
        if (epochMillis <= 0) {
            return null;
        }

        return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(epochMillis),
                ZoneOffset.UTC);
    }

    private String sha256Hex(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte item : hash) {
                hex.append(String.format("%02x", item));
            }
            return hex.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
