package com.zincycorporation.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RazorpayRefundClient {

    public enum FailureKind {
        DEFINITIVE,
        RETRYABLE,
        AMBIGUOUS
    }

    public static final class RefundGatewayException extends RuntimeException {
        private final FailureKind kind;
        private final String gatewayCode;

        RefundGatewayException(
                FailureKind kind,
                String gatewayCode,
                String message,
                Throwable cause) {
            super(message, cause);
            this.kind = kind;
            this.gatewayCode = gatewayCode;
        }

        public FailureKind getKind() {
            return kind;
        }

        public String getGatewayCode() {
            return gatewayCode;
        }
    }

    public record RefundResult(
            String refundId,
            String state,
            long amountPaise,
            String failureCode,
            String failureReason) {
    }

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.enabled:false}")
    private boolean enabled;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Value("${razorpay.api-base-url:https://api.razorpay.com}")
    private String apiBaseUrl;

    public RazorpayRefundClient() {
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

    public RefundResult createFullRefund(
            String providerPaymentId,
            long amountPaise,
            String idempotencyKey,
            String merchantRefundId) {
        ensureConfigured();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("speed", "normal");
        body.put("receipt", merchantRefundId);
        body.put(
                "notes",
                Map.of("zincyMerchantRefundId", merchantRefundId));

        try {
            String responseBody = restClient.post()
                    .uri(apiBaseUrl
                            + "/v1/payments/"
                            + providerPaymentId
                            + "/refund")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        headers.setBasicAuth(keyId, keySecret);
                    })
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return parseRefund(responseBody);
        } catch (RestClientResponseException exception) {
            throw responseFailure(exception);
        } catch (RestClientException exception) {
            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_NETWORK_ERROR",
                    "Razorpay refund service could not be reached",
                    exception);
        }
    }

    /**
     * Recovers the result of an ambiguous POST using Razorpay's documented
     * payment-refund collection and our unique receipt. Razorpay treats the
     * receipt as the refund idempotency key.
     */
    public RefundResult findRefundByReceipt(
            String providerPaymentId,
            String merchantRefundId) {
        ensureConfigured();
        try {
            String responseBody = restClient.get()
                    .uri(apiBaseUrl
                            + "/v1/payments/"
                            + providerPaymentId
                            + "/refunds?count=100&skip=0")
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                    .retrieve()
                    .body(String.class);
            if (responseBody == null || responseBody.isBlank()) {
                throw new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_LOOKUP_EMPTY",
                        "Razorpay returned an empty refund lookup response",
                        null);
            }
            JsonNode response = objectMapper.readTree(responseBody);
            for (JsonNode item : response.path("items")) {
                if (merchantRefundId.equals(text(item, "receipt"))
                        || merchantRefundId.equals(
                                text(item.path("notes"),
                                        "zincyMerchantRefundId"))) {
                    return parseRefund(item.toString());
                }
            }
            return null;
        } catch (RestClientResponseException exception) {
            throw responseFailure(exception);
        } catch (RestClientException | JsonProcessingException exception) {
            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_LOOKUP_UNAVAILABLE",
                    "Razorpay refund lookup could not be completed",
                    exception);
        }
    }

    public RefundResult getRefundStatus(String providerRefundId) {
        ensureConfigured();

        try {
            String responseBody = restClient.get()
                    .uri(apiBaseUrl + "/v1/refunds/" + providerRefundId)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                    .retrieve()
                    .body(String.class);
            return parseRefund(responseBody);
        } catch (RestClientResponseException exception) {
            throw responseFailure(exception);
        } catch (RestClientException exception) {
            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_NETWORK_ERROR",
                    "Razorpay refund service could not be reached",
                    exception);
        }
    }

    private RefundResult parseRefund(String body) {
        if (body == null || body.isBlank()) {
            throw gatewayFailure("Razorpay returned an empty refund response");
        }

        try {
            JsonNode response = objectMapper.readTree(body);
            String refundId = text(response, "id");
            String state = text(response, "status");
            if (refundId == null || state == null) {
                throw gatewayFailure(
                        "Razorpay returned an incomplete refund response");
            }

            return new RefundResult(
                    refundId,
                    state,
                    response.path("amount").asLong(0),
                    text(response, "error_code"),
                    text(response, "error_description"));
        } catch (JsonProcessingException exception) {
            throw gatewayFailure(
                    "Razorpay returned an invalid refund response",
                    exception);
        }
    }

    private void ensureConfigured() {
        if (!enabled) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Card payments are not enabled");
        }
        if (isBlank(keyId) || isBlank(keySecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay refunds are not configured");
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() || value.asText().isBlank()
                ? null
                : value.asText();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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

    private RefundGatewayException responseFailure(
            RestClientResponseException exception) {
        int status = exception.getStatusCode().value();
        FailureKind kind = status == 408 || status == 409 || status == 429
                ? FailureKind.RETRYABLE
                : status >= 500
                        ? FailureKind.AMBIGUOUS
                        : FailureKind.DEFINITIVE;
        String code = "RAZORPAY_HTTP_" + status;
        String description = "Razorpay rejected the refund request";
        try {
            JsonNode error = objectMapper
                    .readTree(exception.getResponseBodyAsString())
                    .path("error");
            code = firstNonBlank(text(error, "code"), code);
            description = firstNonBlank(
                    text(error, "description"),
                    description);
        } catch (JsonProcessingException ignored) {
            // Preserve the HTTP-derived fallback without exposing raw HTML.
        }
        return new RefundGatewayException(
                kind,
                code,
                description,
                exception);
    }

    private String firstNonBlank(String first, String second) {
        return first == null || first.isBlank() ? second : first;
    }
}
