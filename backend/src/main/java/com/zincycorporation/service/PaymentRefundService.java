package com.zincycorporation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.zincycorporation.dto.CreateRefundRequest;
import com.zincycorporation.dto.RefundResponse;
import com.zincycorporation.entity.PaymentRefund;
import com.zincycorporation.entity.PaymentRefundEvent;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundReason;
import com.zincycorporation.enums.RefundSource;
import com.zincycorporation.enums.RefundStatus;
import com.zincycorporation.repository.PaymentRefundEventRepository;
import com.zincycorporation.repository.PaymentRefundRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;
import com.zincycorporation.security.CurrentUserService;
import com.zincycorporation.service.RazorpayRefundClient.FailureKind;
import com.zincycorporation.service.RazorpayRefundClient.RefundGatewayException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentRefundService {

    private static final List<String> AUTOMATIC_REFUND_CODES = List.of(
            "DUPLICATE_CAPTURE",
            "FORBIDDEN_PAYMENT_METHOD",
            "LATE_CAPTURE");

    private final PaymentRefundRepository refundRepository;
    private final PaymentRefundEventRepository eventRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final PhonePeClient phonePeClient;
    private final RazorpayRefundClient razorpayRefundClient;
    private final CurrentUserService currentUserService;

    public RefundResponse requestAdminRefund(
            Long paymentOrderId,
            CreateRefundRequest request) {
        Users admin = requireAdmin();
        validateRequest(request);

        PaymentRefund idempotent = refundRepository
                .findByIdempotencyKey(request.getIdempotencyKey())
                .orElse(null);
        if (idempotent != null) {
            if (!idempotent.getPaymentOrderId().equals(paymentOrderId)) {
                throw conflict(
                        "Refund idempotency key is already used for another payment");
            }
            return toResponse(idempotent);
        }

        PaymentTransaction payment = requireRefundablePayment(paymentOrderId);
        PaymentRefund existing = refundRepository
                .findByPaymentOrderId(paymentOrderId)
                .orElse(null);
        if (existing != null) {
            return toResponse(existing);
        }

        RefundReason reason = request.getReason() == null
                ? RefundReason.CUSTOMER_CANCELLATION
                : request.getReason();
        PaymentRefund refund = createRefundRecord(
                payment,
                reason,
                request.getIdempotencyKey(),
                request.getNote(),
                admin.getId(),
                false,
                RefundSource.ADMIN);

        return toResponse(submit(refund, payment, RefundSource.ADMIN));
    }

    public RefundResponse retryAdminRefund(Long refundId) {
        requireAdmin();
        PaymentRefund refund = requireRefund(refundId);
        if (refund.getStatus() == RefundStatus.COMPLETED) {
            return toResponse(refund);
        }
        if (refund.getStatus() == RefundStatus.REVIEW_REQUIRED) {
            throw conflict(
                    "Review the refund mismatch before attempting another refund");
        }
        if (refund.getStatus() != RefundStatus.FAILED
                && refund.getStatus() != RefundStatus.REQUESTED
                && refund.getStatus() != RefundStatus.PENDING) {
            throw conflict("This refund cannot be retried");
        }

        PaymentTransaction payment = requirePayment(refund.getPaymentOrderId());
        if (refund.getStatus() == RefundStatus.PENDING
                && !isBlank(refund.getProviderRefundId())) {
            return toResponse(reconcile(refund, RefundSource.ADMIN));
        }

        if (refund.getStatus() == RefundStatus.FAILED) {
            refund = resetForRetry(refund);
        }

        return toResponse(submit(refund, payment, RefundSource.ADMIN));
    }

    public RefundResponse getAdminRefund(Long refundId, boolean refresh) {
        requireAdmin();
        PaymentRefund refund = requireRefund(refundId);
        if (refresh && refund.getStatus() != RefundStatus.COMPLETED) {
            refund = reconcile(refund, RefundSource.ADMIN);
        }
        return toResponse(refund);
    }

    public List<RefundResponse> listAdminRefunds(RefundStatus status) {
        requireAdmin();
        List<PaymentRefund> refunds = status == null
                ? refundRepository.findTop100ByOrderByUpdatedAtDesc()
                : refundRepository
                        .findTop100ByStatusOrderByUpdatedAtDesc(status);
        return refunds.stream().map(this::toResponse).toList();
    }

    public RefundResponse findByPaymentOrderId(Long paymentOrderId) {
        return refundRepository.findByPaymentOrderId(paymentOrderId)
                .map(this::toResponse)
                .orElse(null);
    }

    public RefundResponse refreshByPaymentOrderId(Long paymentOrderId) {
        PaymentRefund refund = refundRepository
                .findByPaymentOrderId(paymentOrderId)
                .orElse(null);
        if (refund == null) {
            return null;
        }
        if (refund.getStatus() == RefundStatus.REQUESTED
                || refund.getStatus() == RefundStatus.PENDING) {
            refund = reconcile(refund, RefundSource.SCHEDULER);
        }
        return toResponse(refund);
    }

    public void ensureAutomaticRefund(PaymentTransaction payment) {
        if (payment == null
                || payment.getId() == null
                || payment.getStatus() != PaymentStatus.REVIEW_REQUIRED
                || !AUTOMATIC_REFUND_CODES.contains(payment.getFailureCode())
                || isBlank(payment.getProviderPaymentId())) {
            return;
        }

        PaymentRefund existing = refundRepository
                .findByPaymentOrderId(payment.getId())
                .orElse(null);
        if (existing != null) {
            return;
        }

        RefundReason reason = switch (payment.getFailureCode()) {
            case "DUPLICATE_CAPTURE" -> RefundReason.DUPLICATE_CAPTURE;
            case "LATE_CAPTURE" -> RefundReason.LATE_CAPTURE;
            default -> RefundReason.FORBIDDEN_PAYMENT_METHOD;
        };

        PaymentRefund refund = createRefundRecord(
                payment,
                reason,
                "auto_refund_payment_" + payment.getId(),
                payment.getFailureReason(),
                null,
                true,
                RefundSource.AUTOMATIC);
        submit(refund, payment, RefundSource.AUTOMATIC);
    }

    public PaymentRefund reconcile(
            PaymentRefund refund,
            RefundSource source) {
        if (refund == null || refund.getStatus() == RefundStatus.COMPLETED) {
            return refund;
        }

        PaymentTransaction payment = requirePayment(refund.getPaymentOrderId());
        if (isBlank(refund.getProviderRefundId())) {
            if (refund.getProvider() == PaymentProvider.RAZORPAY) {
                try {
                    RazorpayRefundClient.RefundResult recovered = razorpayRefundClient.findRefundByReceipt(
                            payment.getProviderPaymentId(),
                            refund.getMerchantRefundId());
                    if (recovered != null) {
                        return applyRazorpayResult(
                                refund, payment, recovered, source, null);
                    }
                } catch (RefundGatewayException exception) {
                    return handleRazorpayFailure(refund, source, exception);
                }
            }
            // PhonePe merchantRefundId and Razorpay receipt are stable across
            // retries. Never generate a second reference for an ambiguous POST.
            return submit(refund, payment, source);
        }

        try {
            if (refund.getProvider() == PaymentProvider.PHONEPE) {
                PhonePeClient.RefundResult result = phonePeClient
                        .getRefundStatus(refund.getMerchantRefundId());
                return applyPhonePeResult(refund, payment, result, source, null);
            }

            RazorpayRefundClient.RefundResult result = razorpayRefundClient
                    .getRefundStatus(refund.getProviderRefundId());
            return applyRazorpayResult(refund, payment, result, source, null);
        } catch (RefundGatewayException exception) {
            return handleRazorpayFailure(refund, source, exception);
        } catch (ResponseStatusException exception) {
            scheduleRetry(
                    refund,
                    "REFUND_STATUS_UNCONFIRMED",
                    "The gateway refund status could not be confirmed");
            audit(
                    refund,
                    source,
                    "REFUND_STATUS_UNCONFIRMED",
                    refund.getStatus(),
                    refund.getStatus(),
                    null,
                    safeReason(exception));
            return refundRepository.save(refund);
        }
    }

    public void handlePhonePeWebhook(JsonNode root, String event) {
        JsonNode payload = root == null ? null : root.path("payload");
        String merchantRefundId = text(payload, "merchantRefundId");
        if (merchantRefundId == null) {
            return;
        }

        PaymentRefund refund = refundRepository
                .findByMerchantRefundId(merchantRefundId)
                .orElse(null);
        if (refund == null || refund.getProvider() != PaymentProvider.PHONEPE) {
            return;
        }

        String state = text(payload, "state");
        String providerRefundId = text(payload, "refundId");
        long amountPaise = payload.path("amount").asLong(0);
        String gatewayEventId = truncate(
                merchantRefundId
                        + ":"
                        + firstNonBlank(state, "UNKNOWN")
                        + ":"
                        + firstNonBlank(providerRefundId, "NONE"),
                120);

        PhonePeClient.RefundResult result = new PhonePeClient.RefundResult(
                providerRefundId,
                state,
                amountPaise,
                text(payload.path("errorContext"), "errorCode"),
                text(payload.path("errorContext"), "errorDescription"));
        PaymentTransaction payment = requirePayment(refund.getPaymentOrderId());
        String originalMerchantOrderId = text(
                payload,
                "originalMerchantOrderId");
        if (originalMerchantOrderId != null
                && !originalMerchantOrderId.equals(
                        payment.getMerchantOrderId())) {
            markRefundForReview(
                    refund,
                    RefundSource.PHONEPE_WEBHOOK,
                    gatewayEventId,
                    "REFUND_PAYMENT_MISMATCH",
                    "PhonePe refund belongs to another merchant order");
            return;
        }
        refund.setLastWebhookEvent(firstNonBlank(event, gatewayEventId));
        refund.setLastWebhookAt(LocalDateTime.now());
        applyPhonePeResult(
                refund,
                payment,
                result,
                RefundSource.PHONEPE_WEBHOOK,
                gatewayEventId);
    }

    public void handleRazorpayWebhook(
            JsonNode refundEntity,
            String event,
            String eventId) {
        String providerRefundId = text(refundEntity, "id");
        String merchantRefundId = firstNonBlank(
                text(refundEntity.path("notes"), "zincyMerchantRefundId"),
                text(refundEntity, "receipt"));

        PaymentRefund refund = providerRefundId == null
                ? null
                : refundRepository.findByProviderAndProviderRefundId(
                        PaymentProvider.RAZORPAY,
                        providerRefundId).orElse(null);
        if (refund == null && merchantRefundId != null) {
            refund = refundRepository
                    .findByMerchantRefundId(merchantRefundId)
                    .orElse(null);
        }
        if (refund == null || refund.getProvider() != PaymentProvider.RAZORPAY) {
            return;
        }

        RazorpayRefundClient.RefundResult result = new RazorpayRefundClient.RefundResult(
                providerRefundId,
                text(refundEntity, "status"),
                refundEntity.path("amount").asLong(0),
                text(refundEntity, "error_code"),
                text(refundEntity, "error_description"));
        PaymentTransaction payment = requirePayment(refund.getPaymentOrderId());
        String providerPaymentId = text(refundEntity, "payment_id");
        String gatewayEventId = firstNonBlank(
                eventId,
                truncate(
                        firstNonBlank(providerRefundId, "UNKNOWN")
                                + ":"
                                + firstNonBlank(
                                        text(refundEntity, "status"),
                                        firstNonBlank(event, "UNKNOWN")),
                        120));
        if (providerPaymentId != null
                && !providerPaymentId.equals(
                        payment.getProviderPaymentId())) {
            markRefundForReview(
                    refund,
                    RefundSource.RAZORPAY_WEBHOOK,
                    gatewayEventId,
                    "REFUND_PAYMENT_MISMATCH",
                    "Razorpay refund belongs to another payment");
            return;
        }
        refund.setLastWebhookEvent(firstNonBlank(eventId, event));
        refund.setLastWebhookAt(LocalDateTime.now());
        applyRazorpayResult(
                refund,
                payment,
                result,
                RefundSource.RAZORPAY_WEBHOOK,
                gatewayEventId);
    }

    public RefundResponse toResponse(PaymentRefund refund) {
        return RefundResponse.builder()
                .id(refund.getId())
                .paymentOrderId(refund.getPaymentOrderId())
                .onboardingRequestId(refund.getOnboardingRequestId())
                .provider(refund.getProvider())
                .reason(refund.getReason())
                .status(refund.getStatus())
                .amount(refund.getAmount())
                .currency(refund.getCurrency())
                .merchantRefundId(refund.getMerchantRefundId())
                .providerRefundId(refund.getProviderRefundId())
                .providerState(refund.getProviderState())
                .failureCode(refund.getFailureCode())
                .failureReason(refund.getFailureReason())
                .reconcileAttempts(refund.getReconcileAttempts())
                .nextReconcileAt(refund.getNextReconcileAt())
                .lastReconciledAt(refund.getLastReconciledAt())
                .automatic(Boolean.TRUE.equals(refund.getAutomaticRefund()))
                .createdAt(refund.getCreatedAt())
                .completedAt(refund.getCompletedAt())
                .build();
    }

    private PaymentRefund createRefundRecord(
            PaymentTransaction payment,
            RefundReason reason,
            String idempotencyKey,
            String note,
            Long requestedByUserId,
            boolean automatic,
            RefundSource source) {
        PaymentRefund refund = PaymentRefund.builder()
                .paymentOrderId(payment.getId())
                .onboardingRequestId(payment.getOnboardingRequestId())
                .provider(payment.getProvider())
                .reason(reason)
                .status(RefundStatus.REQUESTED)
                .amount(payment.getAmount())
                .amountPaise(payment.getAmountPaise())
                .currency(payment.getCurrency())
                .merchantRefundId(merchantRefundId())
                .idempotencyKey(idempotencyKey)
                .requestedByUserId(requestedByUserId)
                .automaticRefund(automatic)
                .requestNote(truncate(note, 500))
                .reconcileAttempts(0)
                .nextReconcileAt(LocalDateTime.now())
                .build();

        try {
            refund = refundRepository.saveAndFlush(refund);
        } catch (DataIntegrityViolationException exception) {
            PaymentRefund concurrent = refundRepository
                    .findByPaymentOrderId(payment.getId())
                    .orElse(null);
            if (concurrent != null) {
                return concurrent;
            }
            throw conflict("Another refund request was created concurrently");
        }

        audit(
                refund,
                source,
                "REFUND_REQUESTED",
                null,
                RefundStatus.REQUESTED,
                null,
                reason.name());
        return refund;
    }

    private PaymentRefund submit(
            PaymentRefund refund,
            PaymentTransaction payment,
            RefundSource source) {
        if (refund.getStatus() == RefundStatus.COMPLETED) {
            return refund;
        }

        try {
            if (refund.getProvider() == PaymentProvider.PHONEPE) {
                PhonePeClient.RefundResult result = phonePeClient.createRefund(
                        refund.getMerchantRefundId(),
                        payment.getMerchantOrderId(),
                        refund.getAmountPaise());
                return applyPhonePeResult(refund, payment, result, source, null);
            }

            if (isBlank(payment.getProviderPaymentId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Razorpay payment reference is unavailable");
            }
            RazorpayRefundClient.RefundResult result = razorpayRefundClient
                    .createFullRefund(
                            payment.getProviderPaymentId(),
                            refund.getAmountPaise(),
                            refund.getIdempotencyKey(),
                            refund.getMerchantRefundId());
            return applyRazorpayResult(refund, payment, result, source, null);
        } catch (RefundGatewayException exception) {
            return handleRazorpayFailure(refund, source, exception);
        } catch (ResponseStatusException exception) {
            RefundStatus oldStatus = refund.getStatus();
            refund.setStatus(RefundStatus.PENDING);
            scheduleRetry(
                    refund,
                    "REFUND_SUBMISSION_UNCONFIRMED",
                    "The gateway did not confirm the refund request");
            refund = refundRepository.save(refund);
            audit(
                    refund,
                    source,
                    "REFUND_SUBMISSION_UNCONFIRMED",
                    oldStatus,
                    refund.getStatus(),
                    null,
                    safeReason(exception));
            return refund;
        }
    }

    private PaymentRefund handleRazorpayFailure(
            PaymentRefund refund,
            RefundSource source,
            RefundGatewayException exception) {
        RefundStatus oldStatus = refund.getStatus();
        refund.setFailureCode(truncate(exception.getGatewayCode(), 100));
        refund.setFailureReason(truncate(exception.getMessage(), 500));
        refund.setLastReconciledAt(LocalDateTime.now());
        refund.setReconcileAttempts(value(refund.getReconcileAttempts()) + 1);

        if (exception.getKind() == FailureKind.DEFINITIVE) {
            refund.setStatus(RefundStatus.FAILED);
            refund.setNextReconcileAt(null);
        } else {
            refund.setStatus(RefundStatus.PENDING);
            refund.setNextReconcileAt(nextRetryAt(refund.getReconcileAttempts()));
        }
        refund = refundRepository.save(refund);
        audit(
                refund,
                source,
                exception.getKind() == FailureKind.DEFINITIVE
                        ? "REFUND_REJECTED"
                        : "REFUND_UNCONFIRMED",
                oldStatus,
                refund.getStatus(),
                null,
                exception.getMessage());
        return refund;
    }

    private PaymentRefund resetForRetry(PaymentRefund refund) {
        String previousReference = firstNonBlank(
                refund.getProviderRefundId(),
                refund.getMerchantRefundId());

        RefundStatus oldStatus = refund.getStatus();

        refund.setStatus(RefundStatus.REQUESTED);
        refund.setMerchantRefundId(merchantRefundId());
        refund.setIdempotencyKey(
                "rr_"
                        + refund.getId()
                        + "_"
                        + UUID.randomUUID().toString().replace("-", ""));

        refund.setProviderRefundId(null);
        refund.setProviderState(null);
        refund.setFailureCode(null);
        refund.setFailureReason(null);

        // Prevent the scheduler from processing this refund while the
        // synchronous admin retry is communicating with the gateway.
        refund.setNextReconcileAt(LocalDateTime.now().plusMinutes(2));

        PaymentRefund savedRefund = refundRepository.saveAndFlush(refund);

        audit(
                savedRefund,
                RefundSource.ADMIN,
                "REFUND_RETRY_REQUESTED",
                oldStatus,
                RefundStatus.REQUESTED,
                null,
                "Previous gateway reference: " + previousReference);

        return savedRefund;
    }

    private PaymentRefund applyPhonePeResult(
            PaymentRefund refund,
            PaymentTransaction payment,
            PhonePeClient.RefundResult result,
            RefundSource source,
            String gatewayEventId) {
        return applyResult(
                refund,
                payment,
                result.refundId(),
                result.state(),
                result.amountPaise(),
                result.failureCode(),
                result.failureReason(),
                mapPhonePeStatus(result.state()),
                source,
                gatewayEventId);
    }

    private PaymentRefund applyRazorpayResult(
            PaymentRefund refund,
            PaymentTransaction payment,
            RazorpayRefundClient.RefundResult result,
            RefundSource source,
            String gatewayEventId) {
        return applyResult(
                refund,
                payment,
                result.refundId(),
                result.state(),
                result.amountPaise(),
                result.failureCode(),
                result.failureReason(),
                mapRazorpayStatus(result.state()),
                source,
                gatewayEventId);
    }

    private PaymentRefund applyResult(
            PaymentRefund refund,
            PaymentTransaction payment,
            String providerRefundId,
            String providerState,
            long amountPaise,
            String failureCode,
            String failureReason,
            RefundStatus newStatus,
            RefundSource source,
            String gatewayEventId) {
        RefundStatus oldStatus = refund.getStatus();
        if (oldStatus == RefundStatus.COMPLETED) {
            return refund;
        }
        if (oldStatus == RefundStatus.REVIEW_REQUIRED) {
            return refund;
        }
        if (oldStatus == RefundStatus.FAILED
                && (newStatus == RefundStatus.REQUESTED
                        || newStatus == RefundStatus.PENDING)) {
            return refund;
        }

        if (amountPaise > 0 && refund.getAmountPaise() != amountPaise) {
            newStatus = RefundStatus.REVIEW_REQUIRED;
            failureCode = "REFUND_AMOUNT_MISMATCH";
            failureReason = "Gateway refund amount does not match the payment";
        }

        if (providerRefundId != null) {
            if (refund.getProviderRefundId() != null
                    && !refund.getProviderRefundId().equals(providerRefundId)) {
                newStatus = RefundStatus.REVIEW_REQUIRED;
                failureCode = "REFUND_ID_MISMATCH";
                failureReason = "Gateway refund reference changed unexpectedly";
            } else {
                refund.setProviderRefundId(providerRefundId);
            }
        }

        refund.setProviderState(providerState);
        refund.setStatus(newStatus);
        refund.setFailureCode(failureCode);
        refund.setFailureReason(truncate(failureReason, 500));
        refund.setLastReconciledAt(LocalDateTime.now());
        refund.setReconcileAttempts(value(refund.getReconcileAttempts()) + 1);

        if (newStatus == RefundStatus.COMPLETED) {
            refund.setCompletedAt(
                    refund.getCompletedAt() == null
                            ? LocalDateTime.now()
                            : refund.getCompletedAt());
            refund.setNextReconcileAt(null);
            refund.setFailureCode(null);
            refund.setFailureReason(null);
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setFailureCode(null);
            payment.setFailureReason(null);
            paymentRepository.save(payment);
        } else if (newStatus == RefundStatus.FAILED
                || newStatus == RefundStatus.REVIEW_REQUIRED) {
            refund.setNextReconcileAt(null);
        } else {
            refund.setNextReconcileAt(nextRetryAt(refund.getReconcileAttempts()));
        }

        refund = refundRepository.save(refund);
        audit(
                refund,
                source,
                "REFUND_STATUS_UPDATED",
                oldStatus,
                newStatus,
                gatewayEventId,
                firstNonBlank(providerState, newStatus.name()));
        return refund;
    }

    private RefundStatus mapPhonePeStatus(String state) {
        if ("COMPLETED".equalsIgnoreCase(state)) {
            return RefundStatus.COMPLETED;
        }
        if ("FAILED".equalsIgnoreCase(state)) {
            return RefundStatus.FAILED;
        }
        return RefundStatus.PENDING;
    }

    private RefundStatus mapRazorpayStatus(String state) {
        if ("processed".equalsIgnoreCase(state)) {
            return RefundStatus.COMPLETED;
        }
        if ("failed".equalsIgnoreCase(state)) {
            return RefundStatus.FAILED;
        }
        return RefundStatus.PENDING;
    }

    private void scheduleRetry(
            PaymentRefund refund,
            String failureCode,
            String failureReason) {
        int attempts = value(refund.getReconcileAttempts()) + 1;
        refund.setReconcileAttempts(attempts);
        refund.setLastReconciledAt(LocalDateTime.now());
        refund.setNextReconcileAt(nextRetryAt(attempts));
        refund.setFailureCode(failureCode);
        refund.setFailureReason(failureReason);
    }

    private void markRefundForReview(
            PaymentRefund refund,
            RefundSource source,
            String gatewayEventId,
            String failureCode,
            String failureReason) {
        RefundStatus oldStatus = refund.getStatus();
        refund.setStatus(RefundStatus.REVIEW_REQUIRED);
        refund.setFailureCode(failureCode);
        refund.setFailureReason(truncate(failureReason, 500));
        refund.setLastReconciledAt(LocalDateTime.now());
        refund.setNextReconcileAt(null);
        refund = refundRepository.save(refund);
        audit(
                refund,
                source,
                "REFUND_REVIEW_REQUIRED",
                oldStatus,
                RefundStatus.REVIEW_REQUIRED,
                gatewayEventId,
                failureReason);
    }

    private LocalDateTime nextRetryAt(int attempts) {
        int seconds = switch (attempts) {
            case 0, 1 -> 15;
            case 2 -> 30;
            case 3 -> 60;
            case 4 -> 300;
            default -> 900;
        };
        return LocalDateTime.now().plusSeconds(seconds);
    }

    private PaymentTransaction requireRefundablePayment(Long paymentOrderId) {
        PaymentTransaction payment = requirePayment(paymentOrderId);
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw conflict("This payment has already been refunded");
        }
        if (payment.getStatus() != PaymentStatus.PAID
                && payment.getStatus() != PaymentStatus.REVIEW_REQUIRED) {
            throw conflict(
                    "Only a captured or review-required payment can be refunded");
        }
        if (isBlank(payment.getProviderPaymentId())) {
            throw conflict("The captured gateway payment reference is unavailable");
        }
        return payment;
    }

    private PaymentTransaction requirePayment(Long paymentOrderId) {
        return paymentRepository.findById(paymentOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Payment record not found"));
    }

    private PaymentRefund requireRefund(Long refundId) {
        return refundRepository.findById(refundId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Refund record not found"));
    }

    private Users requireAdmin() {
        Users user = currentUserService.requireUser();
        if (user.getRole() == null
                || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrator access is required");
        }
        return user;
    }

    private void validateRequest(CreateRefundRequest request) {
        if (request == null
                || request.getIdempotencyKey() == null
                || !request.getIdempotencyKey()
                        .matches("[A-Za-z0-9_-]{16,64}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid refund idempotency key is required");
        }
        if (request.getNote() != null && request.getNote().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Refund note cannot exceed 500 characters");
        }
    }

    private void audit(
            PaymentRefund refund,
            RefundSource source,
            String eventType,
            RefundStatus oldStatus,
            RefundStatus newStatus,
            String gatewayEventId,
            String details) {
        try {
            eventRepository.saveAndFlush(PaymentRefundEvent.builder()
                    .refundId(refund.getId())
                    .paymentOrderId(refund.getPaymentOrderId())
                    .source(source)
                    .eventType(eventType)
                    .oldStatus(oldStatus)
                    .newStatus(newStatus)
                    .gatewayEventId(gatewayEventId)
                    .details(truncate(details, 1000))
                    .build());
        } catch (DataIntegrityViolationException duplicateEvent) {
            // Re-delivered gateway events are expected and must be idempotent.
        }
    }

    private String merchantRefundId() {
        return "ZRF_"
                + UUID.randomUUID().toString().replace("-", "");
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

    private int value(Integer number) {
        return number == null ? 0 : number;
    }

    private String truncate(String value, int length) {
        if (value == null || value.length() <= length) {
            return value;
        }
        return value.substring(0, length);
    }

    private String safeReason(ResponseStatusException exception) {
        return firstNonBlank(
                exception.getReason(),
                exception.getStatusCode().toString());
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
