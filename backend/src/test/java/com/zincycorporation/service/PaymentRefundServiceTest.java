package com.zincycorporation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.zincycorporation.dto.CreateRefundRequest;
import com.zincycorporation.dto.RefundResponse;
import com.zincycorporation.entity.PaymentRefund;
import com.zincycorporation.entity.PaymentRefundEvent;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundReason;
import com.zincycorporation.enums.RefundStatus;
import com.zincycorporation.repository.PaymentRefundEventRepository;
import com.zincycorporation.repository.PaymentRefundRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;
import com.zincycorporation.security.CurrentUserService;
import com.zincycorporation.service.RazorpayRefundClient.FailureKind;
import com.zincycorporation.service.RazorpayRefundClient.RefundGatewayException;

@ExtendWith(MockitoExtension.class)
class PaymentRefundServiceTest {

    private static final Long PAYMENT_ID = 41L;
    private static final String IDEMPOTENCY_KEY =
            "refund_admin_request_123456";

    @Mock
    private PaymentRefundRepository refundRepository;

    @Mock
    private PaymentRefundEventRepository eventRepository;

    @Mock
    private PaymentTransactionRepository paymentRepository;

    @Mock
    private PhonePeClient phonePeClient;

    @Mock
    private RazorpayRefundClient razorpayRefundClient;

    @Mock
    private CurrentUserService currentUserService;

    private PaymentRefundService service;
    private final AtomicLong refundIds = new AtomicLong(100);

    @BeforeEach
    void setUp() {
        service = new PaymentRefundService(
                refundRepository,
                eventRepository,
                paymentRepository,
                phonePeClient,
                razorpayRefundClient,
                currentUserService);

        lenient().when(refundRepository.saveAndFlush(any(PaymentRefund.class)))
                .thenAnswer(invocation -> {
                    PaymentRefund refund = invocation.getArgument(0);
                    if (refund.getId() == null) {
                        refund.setId(refundIds.incrementAndGet());
                    }
                    return refund;
                });
        lenient().when(refundRepository.save(any(PaymentRefund.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(eventRepository.saveAndFlush(any(PaymentRefundEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(paymentRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void rejectsRefundWhenPaymentWasNotCaptured() {
        admin();
        PaymentTransaction payment = payment(
                PaymentProvider.RAZORPAY,
                PaymentStatus.FAILED);
        when(refundRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.empty());
        when(paymentRepository.findById(PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.requestAdminRefund(PAYMENT_ID, request()));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(razorpayRefundClient, never()).createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any());
    }

    @Test
    void pendingPhonePeRefundKeepsPaymentBlockedAsPaid() {
        PaymentTransaction payment = prepareNewRefund(
                PaymentProvider.PHONEPE,
                PaymentStatus.PAID);
        when(phonePeClient.createRefund(any(), any(),
                org.mockito.ArgumentMatchers.anyLong()))
                .thenReturn(new PhonePeClient.RefundResult(
                        "refund_phonepe_1",
                        "PENDING",
                        500000L,
                        null,
                        null));

        RefundResponse response = service.requestAdminRefund(
                PAYMENT_ID,
                request());

        assertEquals(RefundStatus.PENDING, response.getStatus());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
    }

    @Test
    void completedRazorpayRefundMarksPaymentRefunded() {
        PaymentTransaction payment = prepareNewRefund(
                PaymentProvider.RAZORPAY,
                PaymentStatus.PAID);
        when(razorpayRefundClient.createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any()))
                .thenReturn(new RazorpayRefundClient.RefundResult(
                        "rfnd_razorpay_1",
                        "processed",
                        500000L,
                        null,
                        null));

        RefundResponse response = service.requestAdminRefund(
                PAYMENT_ID,
                request());

        assertEquals(RefundStatus.COMPLETED, response.getStatus());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertTrue(response.getCompletedAt() != null);
    }

    @Test
    void failedRefundLeavesCapturedPaymentBlocked() {
        PaymentTransaction payment = prepareNewRefund(
                PaymentProvider.RAZORPAY,
                PaymentStatus.PAID);
        when(razorpayRefundClient.createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any()))
                .thenReturn(new RazorpayRefundClient.RefundResult(
                        "rfnd_razorpay_2",
                        "failed",
                        500000L,
                        "BAD_REQUEST_ERROR",
                        "Refund failed"));

        RefundResponse response = service.requestAdminRefund(
                PAYMENT_ID,
                request());

        assertEquals(RefundStatus.FAILED, response.getStatus());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals("BAD_REQUEST_ERROR", response.getFailureCode());
    }

    @Test
    void definitiveRazorpayRejectionIsFailedAndNotAutoRetried() {
        PaymentTransaction payment = prepareNewRefund(
                PaymentProvider.RAZORPAY,
                PaymentStatus.PAID);
        when(razorpayRefundClient.createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any()))
                .thenThrow(new RefundGatewayException(
                        FailureKind.DEFINITIVE,
                        "BAD_REQUEST_ERROR",
                        "Your account does not have enough balance",
                        null));

        RefundResponse response = service.requestAdminRefund(
                PAYMENT_ID,
                request());

        assertEquals(RefundStatus.FAILED, response.getStatus());
        assertEquals("BAD_REQUEST_ERROR", response.getFailureCode());
        assertEquals(null, response.getNextReconcileAt());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
    }

    @Test
    void ambiguousRazorpaySubmissionIsRecoveredByReceiptBeforeRetry() {
        PaymentTransaction payment = prepareNewRefund(
                PaymentProvider.RAZORPAY,
                PaymentStatus.PAID);
        when(razorpayRefundClient.createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any()))
                .thenThrow(new RefundGatewayException(
                        FailureKind.AMBIGUOUS,
                        "RAZORPAY_NETWORK_ERROR",
                        "Connection closed after submission",
                        null));

        RefundResponse first = service.requestAdminRefund(PAYMENT_ID, request());
        PaymentRefund pending = PaymentRefund.builder()
                .id(first.getId())
                .paymentOrderId(PAYMENT_ID)
                .onboardingRequestId(payment.getOnboardingRequestId())
                .provider(PaymentProvider.RAZORPAY)
                .reason(RefundReason.CUSTOMER_CANCELLATION)
                .status(RefundStatus.PENDING)
                .amount(payment.getAmount())
                .amountPaise(payment.getAmountPaise())
                .currency(payment.getCurrency())
                .merchantRefundId(first.getMerchantRefundId())
                .idempotencyKey(IDEMPOTENCY_KEY)
                .reconcileAttempts(1)
                .build();
        when(razorpayRefundClient.findRefundByReceipt(
                payment.getProviderPaymentId(),
                pending.getMerchantRefundId()))
                .thenReturn(new RazorpayRefundClient.RefundResult(
                        "rfnd_recovered",
                        "processed",
                        500000L,
                        null,
                        null));

        PaymentRefund recovered = service.reconcile(
                pending,
                com.zincycorporation.enums.RefundSource.SCHEDULER);

        assertEquals(RefundStatus.COMPLETED, recovered.getStatus());
        assertEquals("rfnd_recovered", recovered.getProviderRefundId());
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        verify(razorpayRefundClient).findRefundByReceipt(
                payment.getProviderPaymentId(),
                pending.getMerchantRefundId());
    }

    @Test
    void lateCaptureCreatesAutomaticRefund() {
        PaymentTransaction payment = payment(
                PaymentProvider.PHONEPE,
                PaymentStatus.REVIEW_REQUIRED);
        payment.setFailureCode("LATE_CAPTURE");
        payment.setFailureReason("Gateway captured after local expiry");
        when(refundRepository.findByPaymentOrderId(PAYMENT_ID))
                .thenReturn(Optional.empty());
        when(phonePeClient.createRefund(any(), any(),
                org.mockito.ArgumentMatchers.anyLong()))
                .thenReturn(new PhonePeClient.RefundResult(
                        "refund_phonepe_late",
                        "PENDING",
                        500000L,
                        null,
                        null));

        service.ensureAutomaticRefund(payment);

        verify(refundRepository).saveAndFlush(
                org.mockito.ArgumentMatchers.argThat(refund ->
                        refund.getReason() == RefundReason.LATE_CAPTURE
                                && Boolean.TRUE.equals(
                                        refund.getAutomaticRefund())));
    }

    @Test
    void sameAdminIdempotencyKeyReturnsExistingRefund() {
        admin();
        PaymentRefund existing = PaymentRefund.builder()
                .id(77L)
                .paymentOrderId(PAYMENT_ID)
                .onboardingRequestId(2L)
                .provider(PaymentProvider.RAZORPAY)
                .reason(RefundReason.CUSTOMER_CANCELLATION)
                .status(RefundStatus.PENDING)
                .amount(new BigDecimal("5000.00"))
                .amountPaise(500000L)
                .currency("INR")
                .merchantRefundId("ZINCY_RF41_existing")
                .idempotencyKey(IDEMPOTENCY_KEY)
                .automaticRefund(false)
                .reconcileAttempts(1)
                .build();
        when(refundRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.of(existing));

        RefundResponse response = service.requestAdminRefund(
                PAYMENT_ID,
                request());

        assertEquals(existing.getId(), response.getId());
        verify(razorpayRefundClient, never()).createFullRefund(
                any(),
                org.mockito.ArgumentMatchers.anyLong(),
                any(),
                any());
    }

    private PaymentTransaction prepareNewRefund(
            PaymentProvider provider,
            PaymentStatus status) {
        admin();
        PaymentTransaction payment = payment(provider, status);
        when(refundRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.empty());
        when(paymentRepository.findById(PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(refundRepository.findByPaymentOrderId(PAYMENT_ID))
                .thenReturn(Optional.empty());
        return payment;
    }

    private void admin() {
        Users admin = new Users();
        admin.setId(1L);
        admin.setRole("ADMIN");
        when(currentUserService.requireUser()).thenReturn(admin);
    }

    private CreateRefundRequest request() {
        CreateRefundRequest request = new CreateRefundRequest();
        request.setIdempotencyKey(IDEMPOTENCY_KEY);
        request.setReason(RefundReason.CUSTOMER_CANCELLATION);
        request.setNote("Customer requested cancellation");
        return request;
    }

    private PaymentTransaction payment(
            PaymentProvider provider,
            PaymentStatus status) {
        return PaymentTransaction.builder()
                .id(PAYMENT_ID)
                .onboardingRequestId(2L)
                .createdByUserId(3L)
                .provider(provider)
                .preferredMethod(provider == PaymentProvider.PHONEPE
                        ? PaymentMethod.PHONEPE
                        : PaymentMethod.CARD)
                .status(status)
                .amount(new BigDecimal("5000.00"))
                .amountPaise(500000L)
                .currency("INR")
                .merchantOrderId("ZINCY_ORDER_41")
                .providerOrderId("provider_order_41")
                .providerPaymentId("provider_payment_41")
                .idempotencyKey("payment_order_key_41")
                .providerState(status.name())
                .reconcileAttempts(0)
                .build();
    }
}
