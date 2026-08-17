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
                        String redirectUrl,
                        String sdkToken) {
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

        public record RefundResult(
                        String refundId,
                        String state,
                        long amountPaise,
                        String failureCode,
                        String failureReason) {
        }

        public enum RefundFailureKind {
                DEFINITIVE,
                RETRYABLE,
                AMBIGUOUS
        }

        public static final class RefundGatewayException
                        extends RuntimeException {

                private final RefundFailureKind kind;
                private final String gatewayCode;

                public RefundGatewayException(
                                RefundFailureKind kind,
                                String gatewayCode,
                                String message,
                                Throwable cause) {
                        super(message, cause);
                        this.kind = kind;
                        this.gatewayCode = gatewayCode;
                }

                public RefundFailureKind getKind() {
                        return kind;
                }

                public String getGatewayCode() {
                        return gatewayCode;
                }
        }

        private record AccessToken(
                        String value,
                        long expiresAtEpochSeconds) {
        }

        /*
         * Refresh the token before its actual expiry so an API request is
         * not started with a token that is about to expire.
         */
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

        /*
         * volatile is required because the cached token is accessed from
         * multiple request threads.
         */
        private volatile AccessToken accessToken;

        @Value("${phonepe.enabled:false}")
        private boolean enabled;

        @Value("${phonepe.client-id:}")
        private String clientId;

        @Value("${phonepe.client-secret:}")
        private String clientSecret;

        @Value("${phonepe.client-version:1}")
        private String clientVersion;

        @Value("${phonepe.merchant-id:${phonepe.client-id:}}")
        private String merchantId;

        @Value("${phonepe.environment:}")
        private String configuredEnvironment;

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

                JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);

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

                if (merchantOrderId == null || merchantOrderId.isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe merchant order ID is required");
                }

                if (amountPaise <= 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe payment amount must be greater than zero");
                }

                Map<String, Object> paymentModeConfig = new LinkedHashMap<>();

                paymentModeConfig.put("version", "V2");

                paymentModeConfig.put(
                                "enabledPaymentModes",
                                List.of(Map.of(
                                                "type", "UPI",
                                                "flows", List.of("INTENT"),
                                                "apps", List.of("phonepe"),
                                                "instruments",
                                                List.of("BANK_ACCOUNT"))));

                Map<String, Object> paymentFlow = new LinkedHashMap<>();

                paymentFlow.put("type", "PG_CHECKOUT");

                paymentFlow.put(
                                "merchantUrls",
                                Map.of("redirectUrl", redirectUrl));

                paymentFlow.put(
                                "paymentModeConfig",
                                paymentModeConfig);

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

                                throw gatewayFailure(
                                                "PhonePe returned an incomplete order");
                        }

                        return new CreatedOrder(
                                        text(response, "orderId"),
                                        text(response, "state"),
                                        toDateTime(
                                                        response.path("expireAt")
                                                                        .asLong(0)),
                                        text(response, "redirectUrl"),
                                        null);

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

        public CreatedOrder createSdkPayment(
                        String merchantOrderId,
                        long amountPaise) {

                ensureConfigured();

                if (merchantOrderId == null || merchantOrderId.isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe merchant order ID is required");
                }

                if (amountPaise <= 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe payment amount must be greater than zero");
                }

                Map<String, Object> paymentModeConfig = new LinkedHashMap<>();

                paymentModeConfig.put(
                                "enabledPaymentModes",
                                List.of(Map.of(
                                                "type",
                                                "UPI_INTENT")));

                Map<String, Object> paymentFlow = new LinkedHashMap<>();

                paymentFlow.put(
                                "type",
                                "PG_CHECKOUT");

                paymentFlow.put(
                                "paymentModeConfig",
                                paymentModeConfig);

                Map<String, Object> body = new LinkedHashMap<>();

                body.put("merchantOrderId", merchantOrderId);
                body.put("amount", amountPaise);
                body.put("expireAfter", 1200);
                body.put("disablePaymentRetry", true);
                body.put("paymentFlow", paymentFlow);

                body.put(
                                "metaInfo",
                                Map.of("udf1", merchantOrderId));

                try {
                        String responseBody = restClient.post()
                                        .uri(apiBaseUrl + "/checkout/v2/sdk/order")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .header(
                                                        HttpHeaders.AUTHORIZATION,
                                                        "O-Bearer " + token())
                                        .body(body)
                                        .retrieve()
                                        .body(String.class);

                        JsonNode response = parseJson(
                                        responseBody,
                                        "PhonePe returned an invalid mobile order response");

                        if (response == null
                                        || text(response, "orderId") == null
                                        || text(response, "token") == null) {

                                throw gatewayFailure(
                                                "PhonePe returned an incomplete mobile order");
                        }

                        return new CreatedOrder(
                                        text(response, "orderId"),
                                        text(response, "state"),
                                        toDateTime(
                                                        response.path("expireAt")
                                                                        .asLong(0)),
                                        null,
                                        text(response, "token"));

                } catch (RestClientResponseException exception) {

                        throw gatewayFailure(
                                        "PhonePe rejected the mobile payment request",
                                        exception);

                } catch (RestClientException exception) {

                        throw gatewayFailure(
                                        "PhonePe mobile payment service could not be reached",
                                        exception);
                }
        }

        public String merchantId() {
                ensureConfigured();

                if (merchantId == null || merchantId.isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "PhonePe merchant ID is not configured");
                }

                return merchantId.trim();
        }

        public String sdkEnvironment() {

                if (configuredEnvironment != null
                                && !configuredEnvironment.isBlank()) {

                        return "SANDBOX".equalsIgnoreCase(
                                        configuredEnvironment)
                                                        ? "SANDBOX"
                                                        : "PRODUCTION";
                }

                String baseUrl = apiBaseUrl == null
                                ? ""
                                : apiBaseUrl.toLowerCase(Locale.ROOT);

                return baseUrl.contains("preprod")
                                || baseUrl.contains("sandbox")
                                                ? "SANDBOX"
                                                : "PRODUCTION";
        }

        public OrderStatus getOrderStatus(
                        String merchantOrderId) {

                ensureConfigured();

                if (merchantOrderId == null
                                || merchantOrderId.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe merchant order ID is required");
                }

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

                        if (response == null
                                        || text(response, "state") == null) {

                                throw gatewayFailure(
                                                "PhonePe returned an incomplete status");
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
                                                        : text(
                                                                        latestCompleted,
                                                                        "transactionId"),

                                        latestCompleted == null
                                                        ? null
                                                        : text(
                                                                        latestCompleted,
                                                                        "paymentMode"),

                                        firstNonBlank(
                                                        text(
                                                                        errorContext,
                                                                        "errorCode"),
                                                        text(
                                                                        errorContext,
                                                                        "detailedErrorCode")),

                                        firstNonBlank(
                                                        text(
                                                                        errorContext,
                                                                        "errorDescription"),
                                                        text(
                                                                        errorContext,
                                                                        "detailedErrorDescription")));

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

        /**
         * Creates a PhonePe refund.
         *
         * IMPORTANT:
         *
         * If this request reaches PhonePe but the HTTP response is lost,
         * we must NOT report a definitive failure. The caller must reconcile
         * using the stable merchantRefundId before attempting another POST.
         */
        public RefundResult createRefund(
                        String merchantRefundId,
                        String originalMerchantOrderId,
                        long amountPaise) {

                ensureConfigured();

                validateRefundArguments(
                                merchantRefundId,
                                originalMerchantOrderId,
                                amountPaise);

                Map<String, Object> body = new LinkedHashMap<>();

                body.put(
                                "merchantRefundId",
                                merchantRefundId);

                body.put(
                                "originalMerchantOrderId",
                                originalMerchantOrderId);

                body.put(
                                "amount",
                                amountPaise);

                try {

                        String responseBody = restClient.post()
                                        .uri(apiBaseUrl + "/payments/v2/refund")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .header(
                                                        HttpHeaders.AUTHORIZATION,
                                                        "O-Bearer " + token())
                                        .body(body)
                                        .retrieve()
                                        .body(String.class);

                        RefundResult result = parseRefund(responseBody);

                        /*
                         * PhonePe should echo the amount. If it does not,
                         * the caller must not treat the refund as safely
                         * completed.
                         */
                        if (result.amountPaise() <= 0) {

                                throw new RefundGatewayException(
                                                RefundFailureKind.AMBIGUOUS,
                                                "PHONEPE_REFUND_AMOUNT_MISSING",
                                                "PhonePe refund response did not contain a valid refund amount",
                                                null);
                        }

                        if (result.amountPaise() != amountPaise) {

                                throw new RefundGatewayException(
                                                RefundFailureKind.AMBIGUOUS,
                                                "PHONEPE_REFUND_AMOUNT_MISMATCH",
                                                "PhonePe refund amount does not match the requested amount",
                                                null);
                        }

                        return result;

                } catch (RestClientResponseException exception) {

                        throw refundResponseFailure(exception);

                } catch (RestClientException exception) {

                        /*
                         * Network/read timeout is AMBIGUOUS.
                         *
                         * The POST may have reached PhonePe even though
                         * our application did not receive the response.
                         */
                        throw new RefundGatewayException(
                                        RefundFailureKind.AMBIGUOUS,
                                        "PHONEPE_NETWORK_ERROR",
                                        "PhonePe refund service could not be reached",
                                        exception);
                }
        }

        /**
         * Retrieves the current PhonePe refund status using the stable
         * merchantRefundId.
         *
         * This method is deliberately separate from createRefund().
         *
         * Reconciliation must call this before creating another refund
         * when the original submission outcome is uncertain.
         */
        public RefundResult getRefundStatus(
                        String merchantRefundId) {

                ensureConfigured();

                if (merchantRefundId == null
                                || merchantRefundId.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe merchant refund ID is required");
                }

                try {

                        String responseBody = restClient.get()
                                        .uri(
                                                        apiBaseUrl
                                                                        + "/payments/v2/refund/"
                                                                        + merchantRefundId
                                                                        + "/status")
                                        .accept(MediaType.APPLICATION_JSON)
                                        .header(
                                                        HttpHeaders.AUTHORIZATION,
                                                        "O-Bearer " + token())
                                        .retrieve()
                                        .body(String.class);

                        return parseRefund(responseBody);

                } catch (RestClientResponseException exception) {

                        throw refundStatusFailure(exception);

                } catch (RestClientException exception) {

                        /*
                         * A status lookup failure cannot safely tell us
                         * whether the refund exists.
                         */
                        throw new RefundGatewayException(
                                        RefundFailureKind.AMBIGUOUS,
                                        "PHONEPE_NETWORK_ERROR",
                                        "PhonePe refund status could not be verified",
                                        exception);
                }
        }

        public boolean verifyWebhookAuthorization(
                        String authorization) {

                if (webhookUsername == null
                                || webhookUsername.isBlank()
                                || webhookPassword == null
                                || webhookPassword.isBlank()
                                || authorization == null
                                || authorization.isBlank()) {

                        return false;
                }

                String received = authorization.trim();

                /*
                 * Existing configuration accepts either:
                 *
                 * SHA256(username:password)
                 *
                 * or a scheme followed by that hash.
                 *
                 * Keep this compatibility behavior while ensuring the
                 * credential itself is compared in constant time.
                 */
                int separator = received.indexOf(' ');

                if (separator >= 0) {
                        received = received
                                        .substring(separator + 1)
                                        .trim();
                }

                if (received.isBlank()) {
                        return false;
                }

                byte[] expected = sha256Hex(
                                webhookUsername + ":" + webhookPassword)
                                .getBytes(
                                                StandardCharsets.UTF_8);

                byte[] actual = received.getBytes(
                                StandardCharsets.UTF_8);

                /*
                 * Do not use String.equals() for the credential comparison.
                 */
                return MessageDigest.isEqual(
                                expected,
                                actual);
        }

        /**
         * Classifies an HTTP error returned while creating a refund.
         */
        private RefundGatewayException refundResponseFailure(
                        RestClientResponseException exception) {

                int status = exception.getStatusCode().value();

                RefundFailureKind kind;

                /*
                 * 408 / 429:
                 *
                 * The operation may not have completed or may be temporarily
                 * unavailable. Reconciliation should happen before another
                 * submission.
                 */
                if (status == 408 || status == 429) {

                        kind = RefundFailureKind.RETRYABLE;

                        /*
                         * 409 is particularly important for an idempotent
                         * refund.
                         *
                         * It may mean PhonePe already knows the
                         * merchantRefundId. Therefore we cannot safely call it
                         * a normal rejection.
                         */
                } else if (status == 409) {

                        kind = RefundFailureKind.AMBIGUOUS;

                        /*
                         * 5xx means PhonePe may have received and processed the
                         * request even though our application received an
                         * error.
                         */
                } else if (status >= 500) {

                        kind = RefundFailureKind.AMBIGUOUS;

                        /*
                         * 4xx other than 408/409/429 is treated as a
                         * definitive rejection of the request.
                         */
                } else {

                        kind = RefundFailureKind.DEFINITIVE;
                }

                String gatewayCode = "PHONEPE_HTTP_" + status;

                return new RefundGatewayException(
                                kind,
                                gatewayCode,
                                "PhonePe rejected the refund request",
                                exception);
        }

        /**
         * Classifies an HTTP error while checking an existing refund.
         */
        private RefundGatewayException refundStatusFailure(
                        RestClientResponseException exception) {

                int status = exception.getStatusCode().value();

                /*
                 * A 404 during reconciliation can mean the refund does not
                 * exist, but depending on gateway timing/API semantics we
                 * should not automatically turn that into permission to
                 * create another refund at this layer.
                 *
                 * The service layer decides whether a subsequent submission
                 * is safe.
                 */
                if (status == 404) {

                        return new RefundGatewayException(
                                        RefundFailureKind.AMBIGUOUS,
                                        "PHONEPE_REFUND_NOT_FOUND",
                                        "PhonePe could not find the refund while its status was being verified",
                                        exception);
                }

                if (status == 408
                                || status == 429) {

                        return new RefundGatewayException(
                                        RefundFailureKind.RETRYABLE,
                                        "PHONEPE_HTTP_" + status,
                                        "PhonePe refund status request should be retried",
                                        exception);
                }

                if (status >= 500) {

                        return new RefundGatewayException(
                                        RefundFailureKind.AMBIGUOUS,
                                        "PHONEPE_HTTP_" + status,
                                        "PhonePe refund status could not be confirmed",
                                        exception);
                }

                return new RefundGatewayException(
                                RefundFailureKind.DEFINITIVE,
                                "PHONEPE_HTTP_" + status,
                                "PhonePe rejected the refund status request",
                                exception);
        }

        private RefundResult parseRefund(
                        String body) {

                JsonNode response = parseJson(
                                body,
                                "PhonePe returned an invalid refund response");

                if (response == null || !response.isObject()) {

                        throw gatewayFailure(
                                        "PhonePe returned an invalid refund response");
                }

                String refundId = text(
                                response,
                                "refundId");

                String state = text(
                                response,
                                "state");

                if (refundId == null
                                || state == null) {

                        throw gatewayFailure(
                                        "PhonePe returned an incomplete refund response");
                }

                long amountPaise = response
                                .path("amount")
                                .asLong(0);

                if (amountPaise < 0) {

                        throw gatewayFailure(
                                        "PhonePe returned an invalid refund amount");
                }

                JsonNode errorContext = response.path("errorContext");

                String failureCode = firstNonBlank(
                                text(
                                                errorContext,
                                                "errorCode"),
                                text(
                                                response,
                                                "errorCode"));

                String failureReason = firstNonBlank(
                                text(
                                                errorContext,
                                                "errorDescription"),
                                firstNonBlank(
                                                text(
                                                                errorContext,
                                                                "detailedErrorDescription"),
                                                text(
                                                                response,
                                                                "errorDescription")));

                return new RefundResult(
                                refundId,
                                state,
                                amountPaise,
                                failureCode,
                                failureReason);
        }

        private void validateRefundArguments(
                        String merchantRefundId,
                        String originalMerchantOrderId,
                        long amountPaise) {

                if (merchantRefundId == null
                                || merchantRefundId.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe merchant refund ID is required");
                }

                if (originalMerchantOrderId == null
                                || originalMerchantOrderId.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe original merchant order ID is required");
                }

                if (amountPaise <= 0) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PhonePe refund amount must be greater than zero");
                }
        }

        /**
         * OAuth token cache.
         *
         * synchronized only surrounds the refresh path, so normal requests
         * do not block each other unnecessarily.
         */
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

                        form.add(
                                        "client_id",
                                        clientId);

                        form.add(
                                        "client_version",
                                        clientVersion);

                        form.add(
                                        "client_secret",
                                        clientSecret);

                        form.add(
                                        "grant_type",
                                        "client_credentials");

                        try {

                                String responseBody = restClient.post()
                                                .uri(oauthUrl)
                                                .contentType(
                                                                MediaType.APPLICATION_FORM_URLENCODED)
                                                .body(form)
                                                .retrieve()
                                                .body(String.class);

                                JsonNode response = parseJson(
                                                responseBody,
                                                "PhonePe authorization returned an invalid response");

                                String value = response == null
                                                ? null
                                                : text(
                                                                response,
                                                                "access_token");

                                long expiresAt = response == null
                                                ? 0
                                                : response.path(
                                                                "expires_at")
                                                                .asLong(0);

                                if (value == null
                                                || expiresAt <= now) {

                                        throw gatewayFailure(
                                                        "PhonePe authorization returned an invalid token");
                                }

                                accessToken = new AccessToken(
                                                value,
                                                expiresAt);

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

        private JsonNode parseJson(
                        String body,
                        String failureMessage) {

                if (body == null || body.isBlank()) {

                        throw gatewayFailure(
                                        failureMessage);
                }

                try {

                        return objectMapper.readTree(body);

                } catch (JsonProcessingException exception) {

                        throw gatewayFailure(
                                        failureMessage,
                                        exception);
                }
        }

        private void ensureConfigured() {

                if (!enabled) {

                        throw new ResponseStatusException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "PhonePe payments are not enabled");
                }

                if (clientId == null
                                || clientId.isBlank()
                                || clientSecret == null
                                || clientSecret.isBlank()
                                || clientVersion == null
                                || clientVersion.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "PhonePe payments are not configured");
                }

                if (oauthUrl == null
                                || oauthUrl.isBlank()
                                || apiBaseUrl == null
                                || apiBaseUrl.isBlank()) {

                        throw new ResponseStatusException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "PhonePe API endpoints are not configured");
                }
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

        private String text(
                        JsonNode node,
                        String field) {

                if (node == null
                                || node.isMissingNode()
                                || node.isNull()) {

                        return null;
                }

                JsonNode value = node.get(field);

                return value == null
                                || value.isNull()
                                || value.asText().isBlank()
                                                ? null
                                                : value.asText();
        }

        private String firstNonBlank(
                        String first,
                        String second) {

                return first != null
                                && !first.isBlank()
                                                ? first
                                                : second;
        }

        private LocalDateTime toDateTime(
                        long epochMillis) {

                if (epochMillis <= 0) {
                        return null;
                }

                return LocalDateTime.ofInstant(
                                Instant.ofEpochMilli(epochMillis),
                                ZoneOffset.UTC);
        }

        private String sha256Hex(
                        String value) {

                try {

                        byte[] hash = MessageDigest.getInstance(
                                        "SHA-256")
                                        .digest(
                                                        value.getBytes(
                                                                        StandardCharsets.UTF_8));

                        StringBuilder hex = new StringBuilder(
                                        hash.length * 2);

                        for (byte item : hash) {

                                hex.append(
                                                String.format(
                                                                "%02x",
                                                                item));
                        }

                        return hex.toString();

                } catch (Exception exception) {

                        throw new IllegalStateException(
                                        "SHA-256 is unavailable",
                                        exception);
                }
        }
}