package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.zincycorporation.dto.CreatePaymentOrderRequest;
import com.zincycorporation.dto.CreatePaymentOrderResponse;
import com.zincycorporation.dto.PaymentResponse;
import com.zincycorporation.dto.RefundResponse;
import com.zincycorporation.dto.VerifyPaymentRequest;
import com.zincycorporation.entity.MaintenanceSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.ServerSetup;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundStatus;
import com.zincycorporation.repository.MaintenanceSetupRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;
import com.zincycorporation.repository.ServerSetupRepository;
import com.zincycorporation.security.CurrentUserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final BigDecimal ADVANCE_AMOUNT = new BigDecimal("5000.00");
    private static final String CURRENCY = "INR";
    private static final int MAX_ORDER_REQUESTS_PER_MINUTE = 10;
    private static final int ACTIVE_ORDER_TTL_MINUTES = 15;
    private static final String PHONEPE_SDK_TOKEN_PREFIX = "phonepe-sdk:";
    private static final List<PaymentStatus> ACTIVE_PAYMENT_STATUSES = List.of(PaymentStatus.CREATED,
            PaymentStatus.PENDING);

    private final ConcurrentHashMap<Long, Deque<Long>> orderRequestWindows = new ConcurrentHashMap<>();

    private final RazorpayClient razorpayClient;
    private final PhonePeClient phonePeClient;
    private final PaymentRefundService paymentRefundService;
    private final PaymentTransactionRepository paymentRepository;
    private final OnboardingAccessService onboardingAccessService;
    private final CurrentUserService currentUserService;
    private final ServerSetupRepository serverSetupRepository;
    private final MaintenanceSetupRepository maintenanceSetupRepository;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.enabled:false}")
    private boolean razorpayEnabled;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret:}")
    private String razorpayWebhookSecret;

    @Value("${payment.frontend-base-url}")
    private String paymentFrontendBaseUrl;

    @Value("${payment.reconciliation.terminal-grace-hours:24}")
    private int terminalReconciliationGraceHours;

    @Value("${payment.cancel-retry-grace-seconds:120}")
    private int cancelRetryGraceSeconds;

    public CreatePaymentOrderResponse createOrder(
            CreatePaymentOrderRequest request) {
        validateCreateRequest(request);

        OnboardingRequest onboarding = onboardingAccessService
                .requireOwned(request.getOnboardingRequestId());
        Users currentUser = currentUserService.requireUser();

        PaymentTransaction existing = paymentRepository
                .findByIdempotencyKey(request.getIdempotencyKey())
                .orElse(null);

        if (existing != null) {
            requireSameRequest(existing, request, currentUser);
            return toCreateResponse(existing, onboarding);
        }

        rejectWhenAlreadyPaidOrUnderReview(onboarding.getId());

        PaymentTransaction activePayment = findUsableActivePayment(
                onboarding.getId());
        if (activePayment != null) {
            if (isReusableActivePayment(
                    activePayment,
                    request,
                    currentUser)) {
                return toCreateResponse(activePayment, onboarding);
            }

            throw paymentConflict(
                    "Another payment attempt is already in progress for "
                            + "this onboarding request");
        }

        enforceOrderCreationRateLimit(currentUser.getId());

        BigDecimal payableAmount = calculatePayableAmount(
                request.getOnboardingRequestId());
        long amountPaise = payableAmount
                .multiply(new BigDecimal("100"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        PaymentProvider provider = request.getPreferredMethod() == PaymentMethod.PHONEPE
                ? PaymentProvider.PHONEPE
                : PaymentProvider.RAZORPAY;

        // Reject a deterministic local configuration problem before a DB row
        // is created. A missing Razorpay key is not an uncertain gateway
        // outcome and must not leave the onboarding request blocked in review.
        if (provider == PaymentProvider.RAZORPAY) {
            ensureRazorpayConfigured();
        }

        PaymentTransaction payment;
        try {
            payment = paymentRepository.saveAndFlush(
                    PaymentTransaction.builder()
                            .onboardingRequestId(onboarding.getId())
                            .createdByUserId(currentUser.getId())
                            .provider(provider)
                            .preferredMethod(request.getPreferredMethod())
                            .status(PaymentStatus.CREATED)
                            .amount(payableAmount)
                            .amountPaise(amountPaise)
                            .currency(CURRENCY)
                            .merchantOrderId(merchantOrderId(onboarding.getId()))
                            .idempotencyKey(request.getIdempotencyKey())
                            .providerState("CREATED")
                            .reconcileAttempts(0)
                            .nextReconcileAt(LocalDateTime.now().plusSeconds(15))
                            .build());
        } catch (DataIntegrityViolationException exception) {
            PaymentTransaction concurrent = paymentRepository
                    .findByIdempotencyKey(request.getIdempotencyKey())
                    .orElse(null);
            if (concurrent != null) {
                requireSameRequest(concurrent, request, currentUser);
                return toCreateResponse(concurrent, onboarding);
            }

            rejectWhenAlreadyPaidOrUnderReview(onboarding.getId());

            PaymentTransaction concurrentActive = findUsableActivePayment(
                    onboarding.getId());
            if (concurrentActive != null
                    && isReusableActivePayment(
                            concurrentActive,
                            request,
                            currentUser)) {
                return toCreateResponse(concurrentActive, onboarding);
            }

            throw paymentConflict(
                    "Another payment attempt is already in progress for "
                            + "this onboarding request");
        }

        try {
            if (provider == PaymentProvider.PHONEPE) {
                createPhonePeOrder(
                        payment,
                        currentUser,
                        request.getClientPlatform());
            } else {
                createRazorpayOrder(payment);
            }
        } catch (RuntimeException exception) {
            if (provider == PaymentProvider.PHONEPE) {
                // A timeout can happen after PhonePe accepted the merchant
                // order. Reconcile that same merchant order instead of
                // allowing another charge attempt.
                payment.setStatus(PaymentStatus.PENDING);
                payment.setProviderState("CREATE_UNCONFIRMED");
                payment.setFailureCode("ORDER_CREATION_UNCONFIRMED");
                payment.setFailureReason(
                        "PhonePe order creation could not be confirmed");
                schedulePaymentReconciliation(payment);
            } else {
                // The Razorpay SDK did not return an order ID. Block another
                // attempt until operations confirms whether an order exists.
                payment.setStatus(PaymentStatus.REVIEW_REQUIRED);
                payment.setProviderState("CREATE_UNCONFIRMED");
                payment.setFailureCode("ORDER_CREATION_UNCONFIRMED");
                payment.setFailureReason(
                        "Razorpay order creation could not be confirmed");
                clearPaymentReconciliation(payment);
            }
            paymentRepository.save(payment);
            throw exception;
        }

        return toCreateResponse(
                paymentRepository.save(payment),
                onboarding);
    }

    public PaymentResponse verifyRazorpayPayment(
            VerifyPaymentRequest request) {
        ensureRazorpayConfigured();

        if (request.getPaymentRecordId() == null
                || isBlank(request.getRazorpayOrderId())
                || isBlank(request.getRazorpayPaymentId())
                || isBlank(request.getRazorpaySignature())) {
            throw badRequest("Complete card verification details are required");
        }

        PaymentTransaction payment = requireOwnedPayment(
                request.getPaymentRecordId());

        if (payment.getProvider() != PaymentProvider.RAZORPAY
                || payment.getPreferredMethod() != PaymentMethod.CARD) {
            throw badRequest("This is not a Razorpay card payment");
        }

        if (payment.getProviderOrderId() == null
                || !payment.getProviderOrderId()
                        .equals(request.getRazorpayOrderId())) {
            throw badRequest("Payment order mismatch");
        }

        String expectedSignature = hmacSha256(
                payment.getProviderOrderId()
                        + "|"
                        + request.getRazorpayPaymentId(),
                razorpayKeySecret);

        if (!constantTimeEquals(
                expectedSignature,
                request.getRazorpaySignature())) {
            throw badRequest("Payment signature verification failed");
        }

        // Terminal callbacks are idempotent only after the callback has been
        // authenticated. This prevents a caller from using arbitrary provider
        // identifiers to probe or replay an already terminal payment.
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return toResponse(payment);
        }
        if (payment.getStatus() == PaymentStatus.REVIEW_REQUIRED) {
            throw paymentConflict(
                    "Payment is under refund review and cannot be verified");
        }

        if (payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.EXPIRED) {
            // A signed success callback may arrive after the customer closed
            // checkout or after a local expiry. Do not reactivate the row;
            // provider refresh below will classify a captured result as a
            // late capture and trigger the existing automatic-refund path.
            try {
                return toResponse(refreshRazorpayByPaymentId(
                        payment,
                        request.getRazorpayPaymentId()));
            } catch (ObjectOptimisticLockingFailureException exception) {
                return getStatus(payment.getId(), true);
            }
        }

        if (payment.getStatus() == PaymentStatus.PAID) {
            // Success callbacks may be replayed after a slow native return.
            // Return the already verified result only after checking the
            // replayed signature and provider payment identity.
            if (isBlank(payment.getProviderPaymentId())
                    || payment.getProviderPaymentId()
                            .equals(request.getRazorpayPaymentId())) {
                return toResponse(payment);
            }
            throw paymentConflict(
                    "Payment is already completed with another payment ID");
        }

        if (!isBlank(payment.getProviderPaymentId())
                && !payment.getProviderPaymentId()
                        .equals(request.getRazorpayPaymentId())) {
            throw paymentConflict(
                    "Another provider payment is already linked to this order");
        }

        payment.setProviderPaymentId(request.getRazorpayPaymentId());
        try {
            paymentRepository.saveAndFlush(payment);
            return toResponse(refreshRazorpay(payment));
        } catch (ObjectOptimisticLockingFailureException exception) {
            // Status polling, a webhook or the reconciliation job may have
            // updated this same row while the native/web callback was being
            // verified. Reload from the provider instead of returning a 500.
            return getStatus(payment.getId(), true);
        }
    }

    public PaymentResponse getStatus(Long paymentRecordId, boolean refresh) {
        try {
            PaymentTransaction payment = requireOwnedPayment(paymentRecordId);

            if (refresh && shouldRefresh(payment)) {
                payment = payment.getProvider() == PaymentProvider.PHONEPE
                        ? refreshPhonePe(payment)
                        : refreshRazorpay(payment);
                payment = expireAfterProviderCheckIfDue(payment);
            } else if (refresh) {
                paymentRefundService.refreshByPaymentOrderId(payment.getId());
            }

            return toResponse(payment);
        } catch (ObjectOptimisticLockingFailureException exception) {
            // A concurrent verifier/webhook won the update. Its committed row
            // is authoritative and the client may safely poll again.
            return toResponse(requireOwnedPayment(paymentRecordId));
        }
    }

    /**
     * Releases an unpaid checkout when its owner explicitly closes it or
     * switches gateway. Gateway state is checked first. The terminal payment
     * remains eligible for reconciliation so a late capture is detected and
     * sent through the existing automatic-refund path.
     */
    public PaymentResponse abandonPayment(Long paymentRecordId) {
        return abandonPayment(paymentRecordId, false);
    }

    public PaymentResponse abandonPayment(
            Long paymentRecordId,
            boolean customerCancelled) {
        try {
            return abandonPaymentOnce(paymentRecordId, customerCancelled);
        } catch (ObjectOptimisticLockingFailureException exception) {
            // A webhook/status refresh completed at the same moment. Never
            // turn that benign race into a customer-visible 500 or overwrite
            // the winning provider state.
            return getStatus(paymentRecordId, false);
        }
    }

    public void handlePhonePeWebhook(
            String authorization,
            byte[] rawBody) {
        if (!phonePeClient.verifyWebhookAuthorization(authorization)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid PhonePe webhook authorization");
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = text(root, "event");
            JsonNode payload = root.path("payload");
            if (text(payload, "merchantRefundId") != null) {
                paymentRefundService.handlePhonePeWebhook(root, event);
                return;
            }
            String merchantOrderId = text(payload, "merchantOrderId");

            if (merchantOrderId == null) {
                return;
            }

            PaymentTransaction payment = paymentRepository
                    .findByMerchantOrderId(merchantOrderId)
                    .orElse(null);

            if (payment == null
                    || payment.getProvider() != PaymentProvider.PHONEPE) {
                return;
            }

            String state = text(payload, "state");
            String providerOrderId = text(payload, "orderId");
            long amountPaise = payload.path("amount").asLong(0);

            payment.setLastWebhookEvent(event);
            payment.setLastWebhookAt(LocalDateTime.now());

            if (providerOrderId != null) {
                if (payment.getProviderOrderId() == null) {
                    payment.setProviderOrderId(providerOrderId);
                } else if (!payment.getProviderOrderId()
                        .equals(providerOrderId)) {
                    markForReview(
                            payment,
                            "PhonePe webhook order ID mismatch");
                    return;
                }
            }

            if (amountPaise > 0
                    && payment.getAmountPaise() != amountPaise) {
                markForReview(payment, "PhonePe webhook amount mismatch");
                return;
            }

            if (isLocallyTerminalWithoutCapture(payment, state, "COMPLETED")) {
                schedulePaymentReconciliation(payment);
                paymentRepository.save(payment);
                return;
            }

            if ("COMPLETED".equalsIgnoreCase(state)
                    && !PhonePeClient.isUpiPaymentMode(
                            completedPhonePePaymentMode(payload))) {
                payment.setProviderPaymentId(
                        completedPhonePeTransactionId(payload));
                markForReview(
                        payment,
                        "FORBIDDEN_PAYMENT_METHOD",
                        "PhonePe completed with a non-UPI method");
                return;
            }

            applyPhonePeState(
                    payment,
                    state,
                    completedPhonePeTransactionId(payload),
                    firstNonBlank(
                            text(payload, "errorCode"),
                            text(payload, "code")),
                    firstNonBlank(
                            text(payload, "message"),
                            text(payload, "errorMessage")));
            paymentRepository.save(payment);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment state changed; retry this webhook",
                    exception);
        } catch (Exception exception) {
            throw badRequest("Invalid PhonePe webhook payload");
        }
    }

    public void handleRazorpayWebhook(
            String signature,
            String eventId,
            byte[] rawBody) {
        ensureRazorpayWebhookConfigured();

        String expected = hmacSha256(rawBody, razorpayWebhookSecret);
        if (isBlank(signature) || !constantTimeEquals(expected, signature)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid Razorpay webhook signature");
        }

        if (!isBlank(eventId)
                && paymentRefundService.hasProcessedGatewayEvent(eventId)) {
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = text(root, "event");
            JsonNode refundEntity = root.path("payload")
                    .path("refund")
                    .path("entity");
            if (!refundEntity.isMissingNode()
                    && !refundEntity.isNull()
                    && text(refundEntity, "id") != null) {
                paymentRefundService.handleRazorpayWebhook(
                        refundEntity,
                        event,
                        eventId);
                return;
            }
            JsonNode paymentEntity = root.path("payload")
                    .path("payment")
                    .path("entity");
            JsonNode orderEntity = root.path("payload")
                    .path("order")
                    .path("entity");

            String providerOrderId = firstNonBlank(
                    text(paymentEntity, "order_id"),
                    text(orderEntity, "id"));

            if (providerOrderId == null) {
                return;
            }

            PaymentTransaction payment = paymentRepository
                    .findByProviderAndProviderOrderId(
                            PaymentProvider.RAZORPAY,
                            providerOrderId)
                    .orElse(null);

            if (payment == null) {
                return;
            }

            if (text(paymentEntity, "id") == null) {
                payment.setLastWebhookEvent(
                        firstNonBlank(eventId, event));
                payment.setLastWebhookAt(LocalDateTime.now());
                paymentRepository.save(payment);
                return;
            }

            payment.setLastWebhookEvent(
                    firstNonBlank(eventId, event));
            payment.setLastWebhookAt(LocalDateTime.now());
            applyRazorpayPaymentEntity(payment, paymentEntity);
            paymentRepository.save(payment);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment state changed; retry this webhook",
                    exception);
        } catch (Exception exception) {
            throw badRequest("Invalid Razorpay webhook payload");
        }
    }

    public PaymentTransaction reconcilePayment(PaymentTransaction payment) {
        if (payment == null || !shouldRefresh(payment)) {
            return payment;
        }

        try {
            if (payment.getStatus() == PaymentStatus.CREATED
                    && payment.getProvider() == PaymentProvider.RAZORPAY
                    && isBlank(payment.getProviderOrderId())) {
                if (isExpiredLocally(payment)) {
                    expireLocally(payment);
                } else {
                    schedulePaymentReconciliation(payment);
                }
                return paymentRepository.save(payment);
            }

            PaymentTransaction refreshed = payment.getProvider() == PaymentProvider.PHONEPE
                    ? refreshPhonePe(payment)
                    : refreshRazorpay(payment);
            if ((refreshed.getStatus() == PaymentStatus.CREATED
                    || refreshed.getStatus() == PaymentStatus.PENDING)
                    && isExpiredLocally(refreshed)
                    && !hasProviderPaymentInFlight(refreshed)) {
                expireLocally(refreshed);
            }
            refreshed.setLastReconciledAt(LocalDateTime.now());
            refreshed.setReconcileAttempts(
                    value(refreshed.getReconcileAttempts()) + 1);
            if (shouldRefresh(refreshed)) {
                schedulePaymentReconciliation(refreshed);
            } else {
                clearPaymentReconciliation(refreshed);
            }
            return paymentRepository.save(refreshed);
        } catch (ResponseStatusException exception) {
            payment.setLastReconciledAt(LocalDateTime.now());
            payment.setReconcileAttempts(
                    value(payment.getReconcileAttempts()) + 1);
            schedulePaymentReconciliation(payment);
            return paymentRepository.save(payment);
        }
    }

    public void ensureAutomaticRefund(PaymentTransaction payment) {
        paymentRefundService.ensureAutomaticRefund(payment);
    }

    private PaymentResponse abandonPaymentOnce(
            Long paymentRecordId,
            boolean customerCancelled) {
        PaymentTransaction payment = requireOwnedPayment(paymentRecordId);

        if (payment.getStatus() == PaymentStatus.PAID
                || payment.getStatus() == PaymentStatus.REFUNDED
                || payment.getStatus() == PaymentStatus.REVIEW_REQUIRED) {
            return toResponse(payment);
        }
        if (payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.EXPIRED) {
            return toResponse(payment);
        }

        // Do not release the lock until the provider confirms that this order
        // has not already completed. Provider/network errors intentionally
        // leave the attempt active, because guessing here can double-charge.
        payment = payment.getProvider() == PaymentProvider.PHONEPE
                ? refreshPhonePe(payment)
                : refreshRazorpay(payment);

        if (payment.getStatus() == PaymentStatus.PAID
                || payment.getStatus() == PaymentStatus.REFUNDED
                || payment.getStatus() == PaymentStatus.REVIEW_REQUIRED
                || payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.EXPIRED) {
            return toResponse(payment);
        }

        // A confirmed checkout dismissal is different from an uncertain SDK/network
        // failure. The frontend sets customerCancelled=true only when Razorpay
        // explicitly reports a user cancellation (or the web modal was deliberately
        // closed). We still refresh Razorpay first above. If the provider has no
        // authorized/captured/failed payment and the order remains only CREATED,
        // release it immediately so the customer can choose another method.
        // AUTHORIZED or any other provider-observed in-flight state remains locked.
        if (customerCancelled
                && isRazorpayCreatedOnly(payment)) {
            payment.setStatus(PaymentStatus.EXPIRED);
            payment.setProviderState("ABANDONED_BY_CUSTOMER");
            payment.setFailureCode("CUSTOMER_ABANDONED");
            payment.setFailureReason(
                    "Customer cancelled this checkout before completion");
            schedulePaymentReconciliation(payment);
            return toResponse(paymentRepository.saveAndFlush(payment));
        }

        // An authorized/provider-observed payment may still capture after the
        // customer closes checkout. Keep it locked. A Razorpay payment that is
        // still only in CREATED state can, however, be explicitly released
        // after a short grace period. The terminal EXPIRED row continues to be
        // reconciled, so a rare late capture is detected by the existing
        // LATE_CAPTURE/refund protection instead of becoming an untracked
        // duplicate charge.
        // Protect a Razorpay order during the customer retry grace window even
        // when no providerPaymentId exists yet. A lost client callback can leave
        // only the order visible for a short period; releasing it immediately
        // would allow a duplicate payment.
        if (isCancelRetryCandidate(payment)
                && !canExplicitlyReleasePendingRazorpayPayment(payment)) {
            schedulePaymentReconciliation(payment);
            return toResponse(paymentRepository.saveAndFlush(payment));
        }

        // AUTHORIZED or another provider-observed non-terminal state can still
        // capture and must never be released merely because the UI grace timer
        // elapsed.
        if (hasProviderPaymentInFlight(payment)
                && !canExplicitlyReleasePendingRazorpayPayment(payment)) {
            schedulePaymentReconciliation(payment);
            return toResponse(paymentRepository.saveAndFlush(payment));
        }

        payment.setStatus(PaymentStatus.EXPIRED);
        payment.setProviderState("ABANDONED_BY_CUSTOMER");
        payment.setFailureCode("CUSTOMER_ABANDONED");
        payment.setFailureReason(
                "Customer cancelled this checkout before completion");
        schedulePaymentReconciliation(payment);
        return toResponse(paymentRepository.saveAndFlush(payment));
    }

    private void createPhonePeOrder(
            PaymentTransaction payment,
            Users currentUser,
            String clientPlatform) {
        boolean nativeClient = "NATIVE".equalsIgnoreCase(clientPlatform);
        String redirectUrl = normalizedFrontendBaseUrl()
                + "/client-setup/payment/payment-success"
                + "?paymentRecordId="
                + payment.getId();

        PhonePeClient.CreatedOrder order = nativeClient
                ? phonePeClient.createSdkPayment(
                        payment.getMerchantOrderId(),
                        payment.getAmountPaise())
                : phonePeClient.createPayment(
                        payment.getMerchantOrderId(),
                        payment.getAmountPaise(),
                        redirectUrl,
                        currentUser.getMobile());

        payment.setProviderOrderId(order.orderId());
        payment.setProviderState(order.state());
        payment.setCheckoutUrl(nativeClient
                ? PHONEPE_SDK_TOKEN_PREFIX + order.sdkToken()
                : order.redirectUrl());
        payment.setExpiresAt(order.expiresAt());
        payment.setStatus(PaymentStatus.PENDING);
        schedulePaymentReconciliation(payment);
    }

    private void createRazorpayOrder(PaymentTransaction payment) {
        ensureRazorpayConfigured();

        JSONObject options = new JSONObject();
        options.put("amount", payment.getAmountPaise());
        options.put("currency", CURRENCY);
        options.put("receipt", "ZINCY-" + payment.getId());

        JSONObject notes = new JSONObject();
        notes.put("paymentRecordId", payment.getId());
        notes.put("onboardingRequestId", payment.getOnboardingRequestId());
        notes.put("merchantOrderId", payment.getMerchantOrderId());
        options.put("notes", notes);

        try {
            Order order = razorpayClient.orders.create(options);
            payment.setProviderOrderId(order.get("id"));
            payment.setProviderState(order.get("status"));
            payment.setStatus(PaymentStatus.PENDING);
            schedulePaymentReconciliation(payment);
        } catch (RazorpayException exception) {
            throw gatewayFailure("Razorpay rejected the card order", exception);
        }
    }

    private PaymentTransaction refreshPhonePe(PaymentTransaction payment) {
        PhonePeClient.OrderStatus status = phonePeClient.getOrderStatus(
                payment.getMerchantOrderId());

        if (status.orderId() != null) {
            if (payment.getProviderOrderId() == null) {
                payment.setProviderOrderId(status.orderId());
            } else if (!payment.getProviderOrderId().equals(status.orderId())) {
                return markForReview(payment, "PhonePe order ID mismatch");
            }
        }

        if (status.amountPaise() > 0
                && payment.getAmountPaise() != status.amountPaise()) {
            return markForReview(payment, "PhonePe amount mismatch");
        }

        if (isLocallyTerminalWithoutCapture(
                payment,
                status.state(),
                "COMPLETED")) {
            schedulePaymentReconciliation(payment);
            return paymentRepository.save(payment);
        }

        if ("COMPLETED".equalsIgnoreCase(status.state())
                && !PhonePeClient.isUpiPaymentMode(status.paymentMode())) {
            payment.setProviderPaymentId(status.transactionId());
            return markForReview(
                    payment,
                    "FORBIDDEN_PAYMENT_METHOD",
                    "PhonePe completed with a non-UPI method");
        }

        applyPhonePeState(
                payment,
                status.state(),
                status.transactionId(),
                status.failureCode(),
                status.failureReason());

        return paymentRepository.save(payment);
    }

    private PaymentTransaction refreshRazorpay(PaymentTransaction payment) {
        ensureRazorpayConfigured();

        if (isBlank(payment.getProviderPaymentId())) {
            return refreshRazorpayFromOrder(payment);
        }

        try {
            Payment providerPayment = razorpayClient.payments.fetch(
                    payment.getProviderPaymentId());

            applyRazorpayPaymentEntity(
                    payment,
                    toRazorpayPaymentEntity(providerPayment));

            return paymentRepository.save(payment);
        } catch (RazorpayException exception) {
            throw gatewayFailure(
                    "Razorpay payment status could not be verified",
                    exception);
        }
    }

    private PaymentTransaction refreshRazorpayByPaymentId(
            PaymentTransaction payment,
            String providerPaymentId) {
        ensureRazorpayConfigured();

        try {
            Payment providerPayment = razorpayClient.payments.fetch(
                    providerPaymentId);
            applyRazorpayPaymentEntity(
                    payment,
                    toRazorpayPaymentEntity(providerPayment));
            return paymentRepository.saveAndFlush(payment);
        } catch (RazorpayException exception) {
            throw gatewayFailure(
                    "Razorpay payment status could not be verified",
                    exception);
        }
    }

    private PaymentTransaction refreshRazorpayFromOrder(
            PaymentTransaction payment) {
        if (isBlank(payment.getProviderOrderId())) {
            return payment;
        }

        try {
            List<Payment> attempts = razorpayClient.orders.fetchPayments(
                    payment.getProviderOrderId());
            Payment selected = selectVerifiableRazorpayPayment(attempts);

            if (selected == null) {
                return payment;
            }

            if (isBlank(razorpayValue(selected, "id"))) {
                return payment;
            }

            applyRazorpayPaymentEntity(
                    payment,
                    toRazorpayPaymentEntity(selected));

            return paymentRepository.save(payment);
        } catch (RazorpayException exception) {
            throw gatewayFailure(
                    "Razorpay order payments could not be verified",
                    exception);
        }
    }

    private Payment selectVerifiableRazorpayPayment(
            List<Payment> attempts) {
        if (attempts == null || attempts.isEmpty()) {
            return null;
        }

        Payment authorized = null;
        Payment failed = null;
        for (Payment attempt : attempts) {
            String state = razorpayValue(attempt, "status");
            if ("captured".equalsIgnoreCase(state)) {
                return attempt;
            }
            if (authorized == null
                    && "authorized".equalsIgnoreCase(state)) {
                authorized = attempt;
            }
            if (failed == null
                    && "failed".equalsIgnoreCase(state)) {
                failed = attempt;
            }
        }

        // Captured and authorized always take precedence in case Razorpay
        // returns more than one attempt for an order. If neither exists, a
        // failed attempt is still authoritative and must release the active
        // onboarding-payment lock immediately.
        return authorized != null ? authorized : failed;
    }

    private ObjectNode toRazorpayPaymentEntity(Payment providerPayment) {
        ObjectNode paymentEntity = objectMapper.createObjectNode();
        paymentEntity.put(
                "id",
                razorpayValue(providerPayment, "id"));
        paymentEntity.put(
                "order_id",
                razorpayValue(providerPayment, "order_id"));
        paymentEntity.put(
                "currency",
                razorpayValue(providerPayment, "currency"));
        paymentEntity.put(
                "method",
                razorpayValue(providerPayment, "method"));
        paymentEntity.put(
                "status",
                razorpayValue(providerPayment, "status"));
        paymentEntity.put(
                "error_code",
                razorpayValue(providerPayment, "error_code"));
        paymentEntity.put(
                "error_description",
                razorpayValue(providerPayment, "error_description"));

        Number providerAmount = providerPayment.get("amount");
        if (providerAmount != null) {
            paymentEntity.put("amount", providerAmount.longValue());
        }

        return paymentEntity;
    }

    private void applyPhonePeState(
            PaymentTransaction payment,
            String state,
            String transactionId,
            String failureCode,
            String failureReason) {
        if (isBlank(state)) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.REFUNDED
                || payment.getStatus() == PaymentStatus.REVIEW_REQUIRED) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID
                && !"COMPLETED".equalsIgnoreCase(state)) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID) {
            if (!isBlank(payment.getProviderPaymentId())
                    && !isBlank(transactionId)
                    && !payment.getProviderPaymentId().equals(transactionId)) {
                return;
            }
            payment.setProviderState(state);
            if (isBlank(payment.getProviderPaymentId())) {
                payment.setProviderPaymentId(transactionId);
            }
            return;
        }

        PaymentStatus previousStatus = payment.getStatus();

        // FAILED and EXPIRED are locally terminal. A later non-terminal
        // provider response (for example PENDING during eventual
        // consistency) must never reactivate the row or its unique active
        // payment lock. COMPLETED is the only exception: it is a late capture
        // and must enter review so the existing automatic-refund flow runs.
        if ((previousStatus == PaymentStatus.FAILED
                || previousStatus == PaymentStatus.EXPIRED)
                && !"COMPLETED".equalsIgnoreCase(state)) {
            schedulePaymentReconciliation(payment);
            return;
        }

        // Only write provider metadata after the monotonic-state guards.
        // Otherwise a delayed PENDING/FAILED event could leave a PAID row with
        // a regressed provider state or erase the local cancellation reason.
        payment.setProviderState(state);

        switch (state.toUpperCase()) {
            case "COMPLETED" -> {
                payment.setProviderPaymentId(transactionId);
                if (anotherPaymentAlreadyPaid(payment)) {
                    markDuplicateCaptureForReview(payment);
                    return;
                }
                if (previousStatus == PaymentStatus.FAILED
                        || previousStatus == PaymentStatus.EXPIRED) {
                    markForReview(
                            payment,
                            "LATE_CAPTURE",
                            "Gateway captured payment after the local attempt "
                                    + "was terminal; automatic refund required");
                    return;
                }
                payment.setStatus(PaymentStatus.PAID);
                if (payment.getPaidAt() == null) {
                    payment.setPaidAt(LocalDateTime.now());
                }
                payment.setFailureCode(null);
                payment.setFailureReason(null);
                clearPaymentReconciliation(payment);
            }
            case "FAILED" -> {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureCode(failureCode);
                payment.setFailureReason(failureReason);
                schedulePaymentReconciliation(payment);
            }
            case "EXPIRED" -> {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setFailureCode(failureCode);
                payment.setFailureReason(failureReason);
                schedulePaymentReconciliation(payment);
            }
            default -> {
                payment.setStatus(PaymentStatus.PENDING);
                payment.setFailureCode(failureCode);
                payment.setFailureReason(failureReason);
                schedulePaymentReconciliation(payment);
            }
        }
    }

    private String completedPhonePeTransactionId(JsonNode payload) {
        JsonNode paymentDetails = payload.path("paymentDetails");
        if (!paymentDetails.isArray()) {
            return null;
        }

        for (JsonNode attempt : paymentDetails) {
            if ("COMPLETED".equalsIgnoreCase(text(attempt, "state"))) {
                return text(attempt, "transactionId");
            }
        }

        return null;
    }

    private String completedPhonePePaymentMode(JsonNode payload) {
        JsonNode paymentDetails = payload.path("paymentDetails");
        if (!paymentDetails.isArray()) {
            return null;
        }

        for (JsonNode attempt : paymentDetails) {
            if ("COMPLETED".equalsIgnoreCase(text(attempt, "state"))) {
                return text(attempt, "paymentMode");
            }
        }

        return null;
    }

    private void applyRazorpayPaymentEntity(
            PaymentTransaction payment,
            JsonNode providerPayment) {
        String providerOrderId = text(providerPayment, "order_id");
        String currency = text(providerPayment, "currency");
        String method = text(providerPayment, "method");
        String state = text(providerPayment, "status");
        String providerPaymentId = text(providerPayment, "id");
        long amountPaise = providerPayment.path("amount").asLong(0);

        if (payment.getStatus() == PaymentStatus.REFUNDED
                || payment.getStatus() == PaymentStatus.REVIEW_REQUIRED) {
            return;
        }

        if (payment.getProviderOrderId() == null
                || !payment.getProviderOrderId().equals(providerOrderId)) {
            markForReview(payment, "Razorpay order ID mismatch");
            return;
        }

        if (amountPaise <= 0 || payment.getAmountPaise() != amountPaise) {
            markForReview(payment, "Razorpay amount mismatch");
            return;
        }

        if (!CURRENCY.equalsIgnoreCase(currency)) {
            markForReview(payment, "Razorpay currency mismatch");
            return;
        }

        if (!"card".equalsIgnoreCase(method)) {
            if (!isBlank(providerPaymentId)) {
                payment.setProviderPaymentId(providerPaymentId);
            }
            markForReview(
                    payment,
                    "FORBIDDEN_PAYMENT_METHOD",
                    "Non-card Razorpay payment");
            return;
        }

        if (isLocallyTerminalWithoutCapture(payment, state, "captured")) {
            schedulePaymentReconciliation(payment);
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID
                && !"captured".equalsIgnoreCase(state)) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID) {
            // Ignore an out-of-order capture for a different payment attempt
            // under the same Razorpay order. The already-verified captured
            // payment ID must remain the auditable reference for this row.
            if (!isBlank(payment.getProviderPaymentId())
                    && !isBlank(providerPaymentId)
                    && !payment.getProviderPaymentId()
                            .equals(providerPaymentId)) {
                return;
            }
            payment.setProviderState(state);
            if (isBlank(payment.getProviderPaymentId())) {
                payment.setProviderPaymentId(providerPaymentId);
            }
            return;
        }

        PaymentStatus previousStatus = payment.getStatus();

        // Preserve terminal metadata above; only an accepted transition may
        // update the provider state/payment reference below.
        payment.setProviderState(state);

        if ("captured".equalsIgnoreCase(state)) {
            if (!isBlank(providerPaymentId)) {
                payment.setProviderPaymentId(providerPaymentId);
            }
            if (anotherPaymentAlreadyPaid(payment)) {
                markDuplicateCaptureForReview(payment);
                return;
            }
            if (previousStatus == PaymentStatus.FAILED
                    || previousStatus == PaymentStatus.EXPIRED) {
                markForReview(
                        payment,
                        "LATE_CAPTURE",
                        "Gateway captured payment after the local attempt was "
                                + "terminal; automatic refund required");
                return;
            }
            payment.setStatus(PaymentStatus.PAID);
            if (payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }
            payment.setFailureCode(null);
            payment.setFailureReason(null);
            clearPaymentReconciliation(payment);
        } else if ("failed".equalsIgnoreCase(state)) {
            if (isBlank(payment.getProviderPaymentId())) {
                payment.setProviderPaymentId(providerPaymentId);
            }
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureCode(text(providerPayment, "error_code"));
            payment.setFailureReason(text(providerPayment, "error_description"));
            schedulePaymentReconciliation(payment);
        } else {
            if (!isBlank(providerPaymentId)) {
                payment.setProviderPaymentId(providerPaymentId);
            }
            payment.setStatus(PaymentStatus.PENDING);
            schedulePaymentReconciliation(payment);
        }

    }

    private String razorpayValue(Payment payment, String field) {
        Object value = payment.get(field);
        return value == null || JSONObject.NULL.equals(value)
                ? null
                : String.valueOf(value);
    }

    private PaymentTransaction markForReview(
            PaymentTransaction payment,
            String reason) {
        return markForReview(payment, "VERIFICATION_MISMATCH", reason);
    }

    private PaymentTransaction markForReview(
            PaymentTransaction payment,
            String failureCode,
            String reason) {
        payment.setStatus(PaymentStatus.REVIEW_REQUIRED);
        payment.setFailureCode(failureCode);
        payment.setFailureReason(reason);
        clearPaymentReconciliation(payment);
        payment = paymentRepository.saveAndFlush(payment);
        paymentRefundService.ensureAutomaticRefund(payment);
        return payment;
    }

    private void rejectWhenAlreadyPaidOrUnderReview(Long onboardingRequestId) {
        if (paymentRepository.existsByOnboardingRequestIdAndStatus(
                onboardingRequestId,
                PaymentStatus.PAID)) {
            throw paymentConflict(
                    "Payment has already been completed for this onboarding "
                            + "request");
        }
        if (paymentRepository.existsByOnboardingRequestIdAndStatus(
                onboardingRequestId,
                PaymentStatus.REVIEW_REQUIRED)) {
            throw paymentConflict(
                    "Payment is under refund review for this onboarding "
                            + "request");
        }
    }

    private PaymentTransaction findUsableActivePayment(
            Long onboardingRequestId) {
        PaymentTransaction activePayment = paymentRepository
                .findFirstByOnboardingRequestIdAndStatusInOrderByCreatedAtDesc(
                        onboardingRequestId,
                        ACTIVE_PAYMENT_STATUSES)
                .orElse(null);

        if (activePayment == null) {
            return null;
        }

        LocalDateTime expiresAt = activePayment.getExpiresAt();
        if (expiresAt == null && activePayment.getCreatedAt() != null) {
            expiresAt = activePayment.getCreatedAt()
                    .plusMinutes(ACTIVE_ORDER_TTL_MINUTES);
        }

        if (expiresAt != null && !expiresAt.isAfter(LocalDateTime.now())) {
            // A browser/app can disappear after the gateway accepted payment.
            // Check the provider before releasing the unique active-payment
            // lock so an already captured/authorized payment cannot be
            // followed by a second order.
            activePayment = activePayment.getProvider() == PaymentProvider.PHONEPE
                    ? refreshPhonePe(activePayment)
                    : refreshRazorpay(activePayment);

            if (activePayment.getStatus() == PaymentStatus.PAID) {
                throw paymentConflict(
                        "Payment has already been completed for this "
                                + "onboarding request");
            }
            if (activePayment.getStatus() == PaymentStatus.REVIEW_REQUIRED) {
                throw paymentConflict(
                        "Payment is under refund review for this onboarding "
                                + "request");
            }
            if (activePayment.getStatus() == PaymentStatus.FAILED
                    || activePayment.getStatus() == PaymentStatus.EXPIRED
                    || activePayment.getStatus() == PaymentStatus.REFUNDED) {
                return null;
            }
            if (hasProviderPaymentInFlight(activePayment)) {
                schedulePaymentReconciliation(activePayment);
                return paymentRepository.saveAndFlush(activePayment);
            }

            expireLocally(activePayment);
            paymentRepository.saveAndFlush(activePayment);
            return null;
        }

        return activePayment;
    }

    private boolean isReusableActivePayment(
            PaymentTransaction payment,
            CreatePaymentOrderRequest request,
            Users currentUser) {
        if (payment.getStatus() != PaymentStatus.PENDING
                || !payment.getCreatedByUserId().equals(currentUser.getId())
                || payment.getPreferredMethod() != request.getPreferredMethod()
                || isBlank(payment.getProviderOrderId())) {
            return false;
        }

        if (payment.getProvider() == PaymentProvider.RAZORPAY) {
            return true;
        }

        boolean requestedNative = "NATIVE".equalsIgnoreCase(
                request.getClientPlatform());
        return !isBlank(payment.getCheckoutUrl())
                && requestedNative == isNativePhonePePayment(payment);
    }

    private boolean anotherPaymentAlreadyPaid(
            PaymentTransaction payment) {
        return payment.getId() != null
                && paymentRepository
                        .existsByOnboardingRequestIdAndStatusAndIdNot(
                                payment.getOnboardingRequestId(),
                                PaymentStatus.PAID,
                                payment.getId());
    }

    private void markDuplicateCaptureForReview(
            PaymentTransaction payment) {
        payment.setStatus(PaymentStatus.REVIEW_REQUIRED);
        payment.setFailureCode("DUPLICATE_CAPTURE");
        payment.setFailureReason(
                "Another payment is already completed for this onboarding "
                        + "request; refund review is required");
        clearPaymentReconciliation(payment);
        paymentRepository.saveAndFlush(payment);
        paymentRefundService.ensureAutomaticRefund(payment);
    }

    private PaymentTransaction requireOwnedPayment(Long paymentRecordId) {
        if (paymentRecordId == null || paymentRecordId <= 0) {
            throw badRequest("A valid payment record ID is required");
        }

        PaymentTransaction payment = paymentRepository
                .findById(paymentRecordId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Payment record not found"));

        onboardingAccessService.requireOwned(payment.getOnboardingRequestId());
        Users currentUser = currentUserService.requireUser();

        if (!payment.getCreatedByUserId().equals(currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access this payment");
        }

        return payment;
    }

    private void requireSameRequest(
            PaymentTransaction existing,
            CreatePaymentOrderRequest request,
            Users currentUser) {
        if (!existing.getCreatedByUserId().equals(currentUser.getId())
                || !existing.getOnboardingRequestId()
                        .equals(request.getOnboardingRequestId())
                || existing.getPreferredMethod() != request.getPreferredMethod()
                || (existing.getProvider() == PaymentProvider.PHONEPE
                        && isNativePhonePePayment(existing) != "NATIVE".equalsIgnoreCase(
                                request.getClientPlatform()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Idempotency key is already used for another payment");
        }
    }

    private BigDecimal calculatePayableAmount(Long onboardingRequestId) {
        ServerSetup server = serverSetupRepository
                .findByOnboardingRequestId(onboardingRequestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Server setup is required before payment"));

        MaintenanceSetup maintenance = maintenanceSetupRepository
                .findByOnboardingRequestId(onboardingRequestId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Maintenance setup is required before payment"));

        boolean serverSkipped = Boolean.TRUE.equals(server.getSkipped());
        BigDecimal serverTotal = serverSkipped || server.getTotalAmount() == null
                ? BigDecimal.ZERO
                : server.getTotalAmount();
        BigDecimal maintenanceTotal = maintenance.getTotalAmount() == null
                ? BigDecimal.ZERO
                : maintenance.getTotalAmount();

        return ADVANCE_AMOUNT
                .add(serverTotal)
                .add(maintenanceTotal)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void validateCreateRequest(CreatePaymentOrderRequest request) {
        if (request == null
                || request.getOnboardingRequestId() == null
                || request.getOnboardingRequestId() <= 0) {
            throw badRequest("onboardingRequestId is required");
        }

        if (request.getPreferredMethod() == null) {
            throw badRequest("preferredMethod is required");
        }

        if (request.getPreferredMethod() == PaymentMethod.GOOGLE_PAY) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_IMPLEMENTED,
                    "Google Pay is coming soon");
        }

        if (request.getPreferredMethod() != PaymentMethod.PHONEPE
                && request.getPreferredMethod() != PaymentMethod.CARD) {
            throw badRequest("Unsupported payment method");
        }

        if (request.getIdempotencyKey() == null
                || !request.getIdempotencyKey()
                        .matches("[A-Za-z0-9_-]{16,64}")) {
            throw badRequest("A valid idempotency key is required");
        }

        if (request.getClientPlatform() != null
                && !request.getClientPlatform().isBlank()
                && !"WEB".equalsIgnoreCase(request.getClientPlatform())
                && !"NATIVE".equalsIgnoreCase(request.getClientPlatform())) {
            throw badRequest("Unsupported payment client platform");
        }
    }

    private void enforceOrderCreationRateLimit(Long userId) {
        long now = System.currentTimeMillis();
        long cutoff = now - 60_000;
        Deque<Long> requests = orderRequestWindows.computeIfAbsent(
                userId,
                ignored -> new ArrayDeque<>());

        synchronized (requests) {
            while (!requests.isEmpty() && requests.peekFirst() < cutoff) {
                requests.removeFirst();
            }

            if (requests.size() >= MAX_ORDER_REQUESTS_PER_MINUTE) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too many payment attempts. Please wait one minute");
            }

            requests.addLast(now);
        }
    }

    private CreatePaymentOrderResponse toCreateResponse(
            PaymentTransaction payment,
            OnboardingRequest onboarding) {
        boolean nativePhonePe = isNativePhonePePayment(payment);
        String sdkToken = nativePhonePe
                ? payment.getCheckoutUrl().substring(
                        PHONEPE_SDK_TOKEN_PREFIX.length())
                : null;

        return CreatePaymentOrderResponse.builder()
                .paymentRecordId(payment.getId())
                .provider(payment.getProvider())
                .paymentMethod(payment.getPreferredMethod())
                .status(payment.getStatus())
                .merchantOrderId(payment.getMerchantOrderId())
                .providerOrderId(payment.getProviderOrderId())
                .publicKey(payment.getProvider() == PaymentProvider.RAZORPAY
                        ? razorpayKeyId
                        : null)
                .checkoutUrl(payment.getProvider() == PaymentProvider.PHONEPE
                        && !nativePhonePe
                                ? payment.getCheckoutUrl()
                                : null)
                .phonePeSdkToken(sdkToken)
                .phonePeMerchantId(nativePhonePe
                        ? phonePeClient.merchantId()
                        : null)
                .phonePeEnvironment(nativePhonePe
                        ? phonePeClient.sdkEnvironment()
                        : null)
                .amountPaise(payment.getAmountPaise())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .businessName("Zincy Corporation")
                .description("Onboarding payment #" + onboarding.getId())
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    private boolean isNativePhonePePayment(PaymentTransaction payment) {
        return payment != null
                && payment.getProvider() == PaymentProvider.PHONEPE
                && payment.getCheckoutUrl() != null
                && payment.getCheckoutUrl().startsWith(
                        PHONEPE_SDK_TOKEN_PREFIX);
    }

    private PaymentResponse toResponse(PaymentTransaction payment) {
        RefundResponse refund = paymentRefundService
                .findByPaymentOrderId(payment.getId());
        boolean successful = payment.getStatus() == PaymentStatus.PAID
                && refund == null;
        boolean refundTerminal = refund != null
                && refund.getStatus() != RefundStatus.REQUESTED
                && refund.getStatus() != RefundStatus.PENDING;
        boolean terminal = refund != null
                ? refundTerminal
                : successful
                        || payment.getStatus() == PaymentStatus.FAILED
                        || payment.getStatus() == PaymentStatus.EXPIRED
                        || payment.getStatus() == PaymentStatus.REFUNDED
                        || payment.getStatus() == PaymentStatus.REVIEW_REQUIRED;

        return PaymentResponse.builder()
                .id(payment.getId())
                .onboardingRequestId(payment.getOnboardingRequestId())
                .provider(payment.getProvider())
                .paymentMethod(payment.getPreferredMethod())
                .merchantOrderId(payment.getMerchantOrderId())
                .providerOrderId(payment.getProviderOrderId())
                .providerPaymentId(payment.getProviderPaymentId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .providerState(payment.getProviderState())
                .failureCode(payment.getFailureCode())
                .failureReason(payment.getFailureReason())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getExpiresAt())
                .cancelRetryAllowed(isCancelRetryAllowed(payment))
                .cancelRetrySecondsRemaining(cancelRetrySecondsRemaining(payment))
                .terminal(terminal)
                .successful(successful)
                .refundId(refund == null ? null : refund.getId())
                .refundStatus(refund == null ? null : refund.getStatus())
                .refundReason(refund == null ? null : refund.getReason())
                .refundAmount(refund == null ? null : refund.getAmount())
                .refundFailureReason(
                        refund == null ? null : refund.getFailureReason())
                .automaticRefund(refund != null && refund.isAutomatic())
                .refundInProgress(refund != null
                        && (refund.getStatus() == RefundStatus.REQUESTED
                                || refund.getStatus() == RefundStatus.PENDING))
                .refundCompletedAt(
                        refund == null ? null : refund.getCompletedAt())
                .build();
    }

    private String merchantOrderId(Long onboardingRequestId) {
        return "ZINCY_ONB"
                + onboardingRequestId
                + "_"
                + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizedFrontendBaseUrl() {
        if (paymentFrontendBaseUrl == null
                || paymentFrontendBaseUrl.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Payment redirect URL is not configured");
        }

        String value = paymentFrontendBaseUrl.trim();
        return value.endsWith("/")
                ? value.substring(0, value.length() - 1)
                : value;
    }

    private boolean shouldRefresh(PaymentTransaction payment) {
        return payment.getStatus() == PaymentStatus.CREATED
                || payment.getStatus() == PaymentStatus.PENDING
                || shouldReconcileTerminalPayment(payment);
    }

    private boolean isExpiredLocally(PaymentTransaction payment) {
        LocalDateTime expiresAt = payment.getExpiresAt();
        if (expiresAt == null && payment.getCreatedAt() != null) {
            expiresAt = payment.getCreatedAt()
                    .plusMinutes(ACTIVE_ORDER_TTL_MINUTES);
        }
        return expiresAt != null && !expiresAt.isAfter(LocalDateTime.now());
    }

    private PaymentTransaction expireAfterProviderCheckIfDue(
            PaymentTransaction payment) {
        if ((payment.getStatus() == PaymentStatus.CREATED
                || payment.getStatus() == PaymentStatus.PENDING)
                && isExpiredLocally(payment)
                && !hasProviderPaymentInFlight(payment)) {
            expireLocally(payment);
            return paymentRepository.saveAndFlush(payment);
        }
        return payment;
    }

    private boolean hasProviderPaymentInFlight(
            PaymentTransaction payment) {
        if (isBlank(payment.getProviderPaymentId())) {
            return false;
        }

        String state = payment.getProviderState();
        if (isBlank(state)) {
            return true;
        }

        if ("created".equalsIgnoreCase(state)
                && isExpiredLocally(payment)) {
            // A Razorpay payment can remain CREATED when checkout was
            // interrupted before authorisation. Once our active-order TTL has
            // elapsed, release the local active-payment lock. The EXPIRED row
            // is still reconciled during the terminal grace window, so a late
            // capture is detected and automatically moved to review/refund.
            return false;
        }

        return !"FAILED".equalsIgnoreCase(state)
                && !"COMPLETED".equalsIgnoreCase(state)
                && !"captured".equalsIgnoreCase(state)
                && !"refunded".equalsIgnoreCase(state);
    }

    private boolean isRazorpayCreatedOnly(PaymentTransaction payment) {
        return payment != null
                && payment.getProvider() == PaymentProvider.RAZORPAY
                && (payment.getStatus() == PaymentStatus.CREATED
                        || payment.getStatus() == PaymentStatus.PENDING)
                && "created".equalsIgnoreCase(payment.getProviderState());
    }

    private boolean isCancelRetryCandidate(PaymentTransaction payment) {
        return payment != null
                && payment.getProvider() == PaymentProvider.RAZORPAY
                && (payment.getStatus() == PaymentStatus.CREATED
                        || payment.getStatus() == PaymentStatus.PENDING)
                && "created".equalsIgnoreCase(payment.getProviderState())
                && payment.getCreatedAt() != null;
    }

    private long cancelRetrySecondsRemaining(PaymentTransaction payment) {
        if (!isCancelRetryCandidate(payment)) {
            return 0L;
        }
        int graceSeconds = Math.max(30, cancelRetryGraceSeconds);
        LocalDateTime availableAt = payment.getCreatedAt().plusSeconds(graceSeconds);
        long remaining = ChronoUnit.SECONDS.between(LocalDateTime.now(), availableAt);
        return Math.max(0L, remaining);
    }

    private boolean isCancelRetryAllowed(PaymentTransaction payment) {
        return isCancelRetryCandidate(payment)
                && cancelRetrySecondsRemaining(payment) == 0L;
    }

    private boolean canExplicitlyReleasePendingRazorpayPayment(
            PaymentTransaction payment) {
        if (payment.getProvider() != PaymentProvider.RAZORPAY
                || !"created".equalsIgnoreCase(payment.getProviderState())) {
            return false;
        }

        LocalDateTime createdAt = payment.getCreatedAt();
        if (createdAt == null) {
            return false;
        }

        int graceSeconds = Math.max(30, cancelRetryGraceSeconds);
        return !createdAt.plusSeconds(graceSeconds)
                .isAfter(LocalDateTime.now());
    }

    private boolean isLocallyTerminalWithoutCapture(
            PaymentTransaction payment,
            String providerState,
            String capturedState) {
        return (payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.EXPIRED)
                && !capturedState.equalsIgnoreCase(providerState);
    }

    private void expireLocally(PaymentTransaction payment) {
        payment.setStatus(PaymentStatus.EXPIRED);
        payment.setProviderState("EXPIRED_LOCALLY");
        payment.setFailureCode("ORDER_EXPIRED");
        payment.setFailureReason("Payment attempt expired before completion");
        schedulePaymentReconciliation(payment);
    }

    private void schedulePaymentReconciliation(PaymentTransaction payment) {
        if ((payment.getStatus() == PaymentStatus.FAILED
                || payment.getStatus() == PaymentStatus.EXPIRED)
                && !shouldReconcileTerminalPayment(payment)) {
            clearPaymentReconciliation(payment);
            return;
        }

        int attempts = value(payment.getReconcileAttempts());
        int seconds = switch (attempts) {
            case 0, 1 -> 15;
            case 2 -> 30;
            case 3 -> 60;
            case 4 -> 300;
            default -> 900;
        };
        payment.setNextReconcileAt(LocalDateTime.now().plusSeconds(seconds));
    }

    private boolean shouldReconcileTerminalPayment(
            PaymentTransaction payment) {
        if (payment.getStatus() != PaymentStatus.FAILED
                && payment.getStatus() != PaymentStatus.EXPIRED) {
            return false;
        }

        LocalDateTime startedAt = payment.getCreatedAt();
        return startedAt != null
                && startedAt.plusHours(
                        Math.max(1, terminalReconciliationGraceHours))
                        .isAfter(LocalDateTime.now())
                && !isBlank(payment.getProviderOrderId());
    }

    private void clearPaymentReconciliation(PaymentTransaction payment) {
        payment.setNextReconcileAt(null);
    }

    private int value(Integer number) {
        return number == null ? 0 : number;
    }

    private void ensureRazorpayConfigured() {
        if (!razorpayEnabled) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Card payments are not enabled");
        }

        if (isBlank(razorpayKeyId) || isBlank(razorpayKeySecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Card payments are not configured");
        }
    }

    private void ensureRazorpayWebhookConfigured() {
        if (isBlank(razorpayWebhookSecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay webhook is not configured");
        }
    }

    private String hmacSha256(String data, String secret) {
        return hmacSha256(data.getBytes(StandardCharsets.UTF_8), secret);
    }

    private String hmacSha256(byte[] data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));

            byte[] hash = mac.doFinal(data);
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Payment signature could not be generated", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return java.security.MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
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
        return !isBlank(first) ? first : second;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException paymentConflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private ResponseStatusException gatewayFailure(
            String message,
            Exception cause) {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                message,
                cause);
    }
}