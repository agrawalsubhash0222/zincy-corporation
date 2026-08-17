package com.zincycorporation.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

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

    /**
     * Creates a full Razorpay refund.
     *
     * The same idempotency key MUST be reused when retrying the same refund
     * request. Razorpay documents X-Refund-Idempotency for this purpose.
     *
     * A network failure, 409, or 5xx is never treated as a definitive
     * rejection because Razorpay may already have accepted the refund.
     */
    public RefundResult createFullRefund(
            String providerPaymentId,
            long amountPaise,
            String idempotencyKey,
            String merchantRefundId) {

        ensureConfigured();

        if (isBlank(providerPaymentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay payment reference is required");
        }

        if (amountPaise <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay refund amount must be greater than zero");
        }

        if (isBlank(idempotencyKey)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay refund idempotency key is required");
        }

        if (isBlank(merchantRefundId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay merchant refund reference is required");
        }

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("amount", amountPaise);
        body.put("speed", "normal");

        /*
         * Razorpay documents receipt as a unique merchant-provided
         * identifier for the refund. It also treats duplicate receipts
         * for the same payment as duplicate refund requests.
         */
        body.put("receipt", merchantRefundId);

        body.put(
                "notes",
                Map.of(
                        "zincyMerchantRefundId",
                        merchantRefundId));

        try {

            String responseBody = restClient.post()
                    .uri(
                            apiBaseUrl
                                    + "/v1/payments/"
                                    + providerPaymentId
                                    + "/refund")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        headers.setBasicAuth(keyId, keySecret);
                        headers.set(
                                "X-Refund-Idempotency",
                                idempotencyKey);
                    })
                    .body(body)
                    .retrieve()
                    .body(String.class);

            RefundResult result = parseRefund(responseBody);

            /*
             * A successful gateway response must contain a positive refund
             * amount matching the requested refund.
             */
            if (result.amountPaise() != amountPaise) {

                throw new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_REFUND_AMOUNT_MISMATCH",
                        "Razorpay refund amount does not match the requested amount",
                        null);
            }

            return result;

        } catch (RestClientResponseException exception) {

            throw createResponseFailure(exception);

        } catch (RestClientException exception) {

            /*
             * The POST may have reached Razorpay even if the response was
             * lost. Never classify this as a definitive failure.
             */
            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_NETWORK_ERROR",
                    "Razorpay refund service could not be reached",
                    exception);
        }
    }

    /**
     * Attempts to recover a previously-created refund using the stable
     * merchant refund reference.
     *
     * This is used before creating another refund after an ambiguous
     * submission.
     */
    public RefundResult findRefundByReceipt(
            String providerPaymentId,
            String merchantRefundId) {

        ensureConfigured();

        if (isBlank(providerPaymentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay payment reference is required");
        }

        if (isBlank(merchantRefundId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay merchant refund reference is required");
        }

        try {

            String responseBody = restClient.get()
                    .uri(
                            apiBaseUrl
                                    + "/v1/payments/"
                                    + providerPaymentId
                                    + "/refunds?count=100&skip=0")
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers ->
                            headers.setBasicAuth(keyId, keySecret))
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {

                throw new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_LOOKUP_EMPTY",
                        "Razorpay returned an empty refund lookup response",
                        null);
            }

            JsonNode response;

            try {
                response = objectMapper.readTree(responseBody);
            } catch (JsonProcessingException exception) {

                throw new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_LOOKUP_INVALID_RESPONSE",
                        "Razorpay refund lookup returned an invalid response",
                        exception);
            }

            JsonNode items = response.path("items");

            if (!items.isArray()) {

                throw new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_LOOKUP_INVALID_RESPONSE",
                        "Razorpay refund lookup did not contain a refund collection",
                        null);
            }

            for (JsonNode item : items) {

                String receipt = text(
                        item,
                        "receipt");

                String noteReference = text(
                        item.path("notes"),
                        "zincyMerchantRefundId");

                if (merchantRefundId.equals(receipt)
                        || merchantRefundId.equals(noteReference)) {

                    RefundResult result = parseRefund(item.toString());

                    /*
                     * The refund must belong to the payment for which we
                     * are currently reconciling.
                     */
                    String returnedPaymentId = text(
                            item,
                            "payment_id");

                    if (!isBlank(returnedPaymentId)
                            && !providerPaymentId.equals(returnedPaymentId)) {

                        throw new RefundGatewayException(
                                FailureKind.AMBIGUOUS,
                                "RAZORPAY_REFUND_PAYMENT_MISMATCH",
                                "Recovered Razorpay refund belongs to another payment",
                                null);
                    }

                    return result;
                }
            }

            /*
             * No matching refund was found.
             *
             * This does NOT prove that no refund exists because the
             * collection may be temporarily stale or the gateway may not
             * have indexed the refund yet.
             */
            return null;

        } catch (RestClientResponseException exception) {

            throw lookupResponseFailure(exception);

        } catch (RefundGatewayException exception) {

            throw exception;

        } catch (RestClientException exception) {

            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_LOOKUP_UNAVAILABLE",
                    "Razorpay refund lookup could not be completed",
                    exception);
        }
    }

    /**
     * Retrieves a specific Razorpay refund.
     *
     * A missing refund cannot safely be interpreted as a failed refund.
     */
    public RefundResult getRefundStatus(
            String providerRefundId) {

        ensureConfigured();

        if (isBlank(providerRefundId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay refund reference is required");
        }

        try {

            String responseBody = restClient.get()
                    .uri(
                            apiBaseUrl
                                    + "/v1/refunds/"
                                    + providerRefundId)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers ->
                            headers.setBasicAuth(keyId, keySecret))
                    .retrieve()
                    .body(String.class);

            return parseRefund(responseBody);

        } catch (RestClientResponseException exception) {

            throw statusResponseFailure(exception);

        } catch (RestClientException exception) {

            throw new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_NETWORK_ERROR",
                    "Razorpay refund status could not be verified",
                    exception);
        }
    }

    private RefundResult parseRefund(
            String body) {

        if (body == null || body.isBlank()) {

            throw gatewayFailure(
                    "Razorpay returned an empty refund response");
        }

        try {

            JsonNode response = objectMapper.readTree(body);

            String refundId = text(
                    response,
                    "id");

            String state = text(
                    response,
                    "status");

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
                    "Razorpay payments are not enabled");
        }

        if (isBlank(keyId) || isBlank(keySecret)) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay refunds are not configured");
        }

        if (isBlank(apiBaseUrl)) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay API endpoint is not configured");
        }
    }

    private String text(
            JsonNode node,
            String field) {

        JsonNode value = node == null
                ? null
                : node.get(field);

        return value == null
                || value.isNull()
                || value.asText().isBlank()
                        ? null
                        : value.asText();
    }

    private boolean isBlank(
            String value) {

        return value == null
                || value.isBlank();
    }

    private ResponseStatusException gatewayFailure(
            String message) {

        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                message);
    }

    private ResponseStatusException gatewayFailure(
            String message,
            Exception cause) {

        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                message,
                cause);
    }

    /**
     * Classifies an HTTP response received while creating a refund.
     *
     * Important:
     *
     * 409 is AMBIGUOUS, not RETRYABLE.
     *
     * Razorpay documents 409 for an idempotent refund request that is
     * already being processed. The caller must reconcile/retry with the
     * SAME idempotency key rather than treating it as a definitive failure.
     */
    private RefundGatewayException createResponseFailure(
            RestClientResponseException exception) {

        int status = exception.getStatusCode().value();

        FailureKind kind;

        if (status == 409) {

            kind = FailureKind.AMBIGUOUS;

        } else if (status == 408 || status == 429) {

            kind = FailureKind.RETRYABLE;

        } else if (status >= 500) {

            kind = FailureKind.AMBIGUOUS;

        } else {

            kind = FailureKind.DEFINITIVE;
        }

        String code = "RAZORPAY_HTTP_" + status;

        String description =
                "Razorpay rejected the refund request";

        try {

            JsonNode error = objectMapper
                    .readTree(
                            exception.getResponseBodyAsString())
                    .path("error");

            code = firstNonBlank(
                    text(error, "code"),
                    code);

            description = firstNonBlank(
                    text(error, "description"),
                    description);

        } catch (JsonProcessingException ignored) {
            /*
             * Preserve the HTTP-derived fallback without exposing raw
             * gateway response content.
             */
        }

        return new RefundGatewayException(
                kind,
                code,
                description,
                exception);
    }

    /**
     * Classifies errors encountered while searching for a previously-created
     * refund.
     *
     * A lookup failure must never authorize creation of another refund.
     */
    private RefundGatewayException lookupResponseFailure(
            RestClientResponseException exception) {

        int status = exception.getStatusCode().value();

        if (status == 408 || status == 429) {

            return new RefundGatewayException(
                    FailureKind.RETRYABLE,
                    "RAZORPAY_HTTP_" + status,
                    "Razorpay refund lookup should be retried",
                    exception);
        }

        if (status == 404) {

            return new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_REFUND_LOOKUP_NOT_FOUND",
                    "Razorpay refund lookup could not confirm the refund",
                    exception);
        }

        if (status >= 500) {

            return new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_HTTP_" + status,
                    "Razorpay refund lookup could not be completed",
                    exception);
        }

        return new RefundGatewayException(
                FailureKind.DEFINITIVE,
                "RAZORPAY_HTTP_" + status,
                "Razorpay rejected the refund lookup request",
                exception);
    }

    /**
     * Classifies errors encountered while retrieving a known refund.
     *
     * A 404 is deliberately AMBIGUOUS. The local application must not mark
     * a previously-submitted refund as FAILED merely because Razorpay could
     * not return it at that moment.
     */
    private RefundGatewayException statusResponseFailure(
            RestClientResponseException exception) {

        int status = exception.getStatusCode().value();

        if (status == 404) {

            return new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_REFUND_NOT_FOUND",
                    "Razorpay could not confirm the refund status",
                    exception);
        }

        if (status == 408 || status == 429) {

            return new RefundGatewayException(
                    FailureKind.RETRYABLE,
                    "RAZORPAY_HTTP_" + status,
                    "Razorpay refund status request should be retried",
                    exception);
        }

        if (status >= 500) {

            return new RefundGatewayException(
                    FailureKind.AMBIGUOUS,
                    "RAZORPAY_HTTP_" + status,
                    "Razorpay refund status could not be confirmed",
                    exception);
        }

        return new RefundGatewayException(
                FailureKind.DEFINITIVE,
                "RAZORPAY_HTTP_" + status,
                "Razorpay rejected the refund status request",
                exception);
    }

    private String firstNonBlank(
            String first,
            String second) {

        return first == null || first.isBlank()
                ? second
                : first;
    }
}