package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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
import com.zincycorporation.dto.VerifyPaymentRequest;
import com.zincycorporation.entity.MaintenanceSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.ServerSetup;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
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
    private static final List<PaymentStatus> ACTIVE_PAYMENT_STATUSES =
            List.of(PaymentStatus.CREATED, PaymentStatus.PENDING);

    private final ConcurrentHashMap<Long, Deque<Long>> orderRequestWindows =
            new ConcurrentHashMap<>();

    private final RazorpayClient razorpayClient;
    private final PhonePeClient phonePeClient;
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

        rejectWhenAlreadyPaid(onboarding.getId());

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

        PaymentProvider provider = request.getPreferredMethod()
                == PaymentMethod.PHONEPE
                        ? PaymentProvider.PHONEPE
                        : PaymentProvider.RAZORPAY;

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
                            .build());
        } catch (DataIntegrityViolationException exception) {
            PaymentTransaction concurrent = paymentRepository
                    .findByIdempotencyKey(request.getIdempotencyKey())
                    .orElse(null);
            if (concurrent != null) {
                requireSameRequest(concurrent, request, currentUser);
                return toCreateResponse(concurrent, onboarding);
            }

            rejectWhenAlreadyPaid(onboarding.getId());

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
                createPhonePeOrder(payment, currentUser);
            } else {
                createRazorpayOrder(payment);
            }
        } catch (RuntimeException exception) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setProviderState("CREATE_FAILED");
            payment.setFailureReason("Payment gateway order creation failed");
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

        payment.setProviderPaymentId(request.getRazorpayPaymentId());
        paymentRepository.save(payment);

        return toResponse(refreshRazorpay(payment));
    }

    public PaymentResponse getStatus(Long paymentRecordId, boolean refresh) {
        PaymentTransaction payment = requireOwnedPayment(paymentRecordId);

        if (refresh && shouldRefresh(payment)) {
            payment = payment.getProvider() == PaymentProvider.PHONEPE
                    ? refreshPhonePe(payment)
                    : refreshRazorpay(payment);
        }

        return toResponse(payment);
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
            payment.setProviderState(state);

            if (providerOrderId != null
                    && payment.getProviderOrderId() != null
                    && !payment.getProviderOrderId().equals(providerOrderId)) {
                markForReview(payment, "PhonePe webhook order ID mismatch");
                return;
            }

            if (amountPaise > 0
                    && payment.getAmountPaise() != amountPaise) {
                markForReview(payment, "PhonePe webhook amount mismatch");
                return;
            }

            if ("COMPLETED".equalsIgnoreCase(state)
                    && !PhonePeClient.isUpiPaymentMode(
                            completedPhonePePaymentMode(payload))) {
                markForReview(
                        payment,
                        "PhonePe completed with a non-UPI method");
                return;
            }

            applyPhonePeState(
                    payment,
                    state,
                    completedPhonePeTransactionId(payload));
            paymentRepository.save(payment);
        } catch (ResponseStatusException exception) {
            throw exception;
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

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = text(root, "event");
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

            String providerPaymentId = text(paymentEntity, "id");
            if (providerPaymentId == null) {
                payment.setLastWebhookEvent(
                        firstNonBlank(eventId, event));
                payment.setLastWebhookAt(LocalDateTime.now());
                paymentRepository.save(payment);
                return;
            }

            if (providerPaymentId != null) {
                payment.setProviderPaymentId(providerPaymentId);
            }

            payment.setLastWebhookEvent(
                    firstNonBlank(eventId, event));
            payment.setLastWebhookAt(LocalDateTime.now());
            applyRazorpayPaymentEntity(payment, paymentEntity);
            paymentRepository.save(payment);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw badRequest("Invalid Razorpay webhook payload");
        }
    }

    private void createPhonePeOrder(
            PaymentTransaction payment,
            Users currentUser) {
        String redirectUrl = normalizedFrontendBaseUrl()
                + "/client-setup/payment/payment-success"
                + "?paymentRecordId="
                + payment.getId();

        PhonePeClient.CreatedOrder order = phonePeClient.createPayment(
                payment.getMerchantOrderId(),
                payment.getAmountPaise(),
                redirectUrl,
                currentUser.getMobile());

        payment.setProviderOrderId(order.orderId());
        payment.setProviderState(order.state());
        payment.setCheckoutUrl(order.redirectUrl());
        payment.setExpiresAt(order.expiresAt());
        payment.setStatus(PaymentStatus.PENDING);
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
        } catch (RazorpayException exception) {
            throw gatewayFailure("Razorpay rejected the card order", exception);
        }
    }

    private PaymentTransaction refreshPhonePe(PaymentTransaction payment) {
        PhonePeClient.OrderStatus status = phonePeClient.getOrderStatus(
                payment.getMerchantOrderId());

        payment.setProviderState(status.state());
        payment.setFailureCode(status.failureCode());
        payment.setFailureReason(status.failureReason());

        if (status.orderId() != null
                && payment.getProviderOrderId() != null
                && !payment.getProviderOrderId().equals(status.orderId())) {
            return markForReview(payment, "PhonePe order ID mismatch");
        }

        if (status.amountPaise() > 0
                && payment.getAmountPaise() != status.amountPaise()) {
            return markForReview(payment, "PhonePe amount mismatch");
        }

        if ("COMPLETED".equalsIgnoreCase(status.state())
                && !PhonePeClient.isUpiPaymentMode(status.paymentMode())) {
            return markForReview(
                    payment,
                    "PhonePe completed with a non-UPI method");
        }

        applyPhonePeState(payment, status.state(), status.transactionId());

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

            String providerPaymentId = razorpayValue(selected, "id");
            if (isBlank(providerPaymentId)) {
                return payment;
            }

            payment.setProviderPaymentId(providerPaymentId);
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
        for (Payment attempt : attempts) {
            String state = razorpayValue(attempt, "status");
            if ("captured".equalsIgnoreCase(state)) {
                return attempt;
            }
            if (authorized == null
                    && "authorized".equalsIgnoreCase(state)) {
                authorized = attempt;
            }
        }

        return authorized;
    }

    private ObjectNode toRazorpayPaymentEntity(Payment providerPayment) {
        ObjectNode paymentEntity = objectMapper.createObjectNode();
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
            String transactionId) {
        if (isBlank(state)) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID
                && !"COMPLETED".equalsIgnoreCase(state)) {
            return;
        }

        switch (state.toUpperCase()) {
            case "COMPLETED" -> {
                payment.setProviderPaymentId(transactionId);
                if (anotherPaymentAlreadyPaid(payment)) {
                    markDuplicateCaptureForReview(payment);
                    return;
                }
                payment.setStatus(PaymentStatus.PAID);
                if (payment.getPaidAt() == null) {
                    payment.setPaidAt(LocalDateTime.now());
                }
                payment.setFailureCode(null);
                payment.setFailureReason(null);
            }
            case "FAILED" -> payment.setStatus(PaymentStatus.FAILED);
            case "EXPIRED" -> payment.setStatus(PaymentStatus.EXPIRED);
            default -> payment.setStatus(PaymentStatus.PENDING);
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
        long amountPaise = providerPayment.path("amount").asLong(0);

        payment.setProviderState(state);

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
            markForReview(payment, "Non-card Razorpay payment");
            return;
        }

        if (payment.getStatus() == PaymentStatus.PAID
                && !"captured".equalsIgnoreCase(state)) {
            return;
        }

        if ("captured".equalsIgnoreCase(state)) {
            if (anotherPaymentAlreadyPaid(payment)) {
                markDuplicateCaptureForReview(payment);
                return;
            }
            payment.setStatus(PaymentStatus.PAID);
            if (payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }
            payment.setFailureCode(null);
            payment.setFailureReason(null);
        } else if ("failed".equalsIgnoreCase(state)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureCode(text(providerPayment, "error_code"));
            payment.setFailureReason(text(providerPayment, "error_description"));
        } else {
            payment.setStatus(PaymentStatus.PENDING);
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
        payment.setStatus(PaymentStatus.REVIEW_REQUIRED);
        payment.setFailureCode("VERIFICATION_MISMATCH");
        payment.setFailureReason(reason);
        return paymentRepository.save(payment);
    }

    private void rejectWhenAlreadyPaid(Long onboardingRequestId) {
        if (paymentRepository.existsByOnboardingRequestIdAndStatus(
                onboardingRequestId,
                PaymentStatus.PAID)) {
            throw paymentConflict(
                    "Payment has already been completed for this "
                            + "onboarding request");
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
            activePayment.setStatus(PaymentStatus.EXPIRED);
            activePayment.setProviderState("EXPIRED_LOCALLY");
            activePayment.setFailureCode("ORDER_EXPIRED");
            activePayment.setFailureReason(
                    "Payment attempt expired before completion");
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

        return payment.getProvider() == PaymentProvider.RAZORPAY
                || !isBlank(payment.getCheckoutUrl());
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
                || existing.getPreferredMethod() != request.getPreferredMethod()) {
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
                        ? payment.getCheckoutUrl()
                        : null)
                .amountPaise(payment.getAmountPaise())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .businessName("Zincy Corporation")
                .description("Onboarding payment #" + onboarding.getId())
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    private PaymentResponse toResponse(PaymentTransaction payment) {
        boolean successful = payment.getStatus() == PaymentStatus.PAID;
        boolean terminal = successful
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
                .failureReason(payment.getFailureReason())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getExpiresAt())
                .terminal(terminal)
                .successful(successful)
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
                || payment.getStatus() == PaymentStatus.PENDING;
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
