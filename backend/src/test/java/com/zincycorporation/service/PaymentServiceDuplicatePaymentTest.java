package com.zincycorporation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.RazorpayClient;
import com.zincycorporation.dto.CreatePaymentOrderRequest;
import com.zincycorporation.dto.CreatePaymentOrderResponse;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.Users;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.repository.MaintenanceSetupRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;
import com.zincycorporation.repository.ServerSetupRepository;
import com.zincycorporation.security.CurrentUserService;

@ExtendWith(MockitoExtension.class)
class PaymentServiceDuplicatePaymentTest {

    private static final Long ONBOARDING_ID = 1L;
    private static final Long USER_ID = 10L;
    private static final String IDEMPOTENCY_KEY =
            "payment_retry_key_123456";

    @Mock
    private RazorpayClient razorpayClient;

    @Mock
    private PhonePeClient phonePeClient;

    @Mock
    private PaymentTransactionRepository paymentRepository;

    @Mock
    private OnboardingAccessService onboardingAccessService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private ServerSetupRepository serverSetupRepository;

    @Mock
    private MaintenanceSetupRepository maintenanceSetupRepository;

    private PaymentService paymentService;
    private OnboardingRequest onboarding;
    private Users currentUser;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                razorpayClient,
                phonePeClient,
                paymentRepository,
                onboardingAccessService,
                currentUserService,
                serverSetupRepository,
                maintenanceSetupRepository,
                new ObjectMapper());

        onboarding = OnboardingRequest.builder()
                .id(ONBOARDING_ID)
                .businessName("Test Business")
                .userMobile("+919999999999")
                .build();

        currentUser = new Users();
        currentUser.setId(USER_ID);
        currentUser.setMobile("+919999999999");

        when(onboardingAccessService.requireOwned(ONBOARDING_ID))
                .thenReturn(onboarding);
        when(currentUserService.requireUser()).thenReturn(currentUser);
    }

    @Test
    void rejectsNewOrderAfterCompletedPayment() {
        CreatePaymentOrderRequest request = request(PaymentMethod.CARD);
        when(paymentRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.empty());
        when(paymentRepository.existsByOnboardingRequestIdAndStatus(
                ONBOARDING_ID,
                PaymentStatus.PAID))
                .thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createOrder(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(
                "Payment has already been completed for this onboarding request",
                exception.getReason());
        verify(paymentRepository, never()).saveAndFlush(
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    void exactIdempotentRetryReturnsOriginalPaidOrder() {
        PaymentTransaction existing = payment(
                51L,
                PaymentMethod.CARD,
                PaymentProvider.RAZORPAY,
                PaymentStatus.PAID);
        when(paymentRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.of(existing));

        CreatePaymentOrderResponse response = paymentService.createOrder(
                request(PaymentMethod.CARD));

        assertEquals(existing.getId(), response.getPaymentRecordId());
        assertEquals(PaymentStatus.PAID, response.getStatus());
        verify(paymentRepository, never())
                .existsByOnboardingRequestIdAndStatus(
                        ONBOARDING_ID,
                        PaymentStatus.PAID);
    }

    @Test
    void reusesReadyAttemptForSamePaymentMethod() {
        PaymentTransaction active = payment(
                52L,
                PaymentMethod.CARD,
                PaymentProvider.RAZORPAY,
                PaymentStatus.PENDING);
        when(paymentRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.empty());
        when(paymentRepository.existsByOnboardingRequestIdAndStatus(
                ONBOARDING_ID,
                PaymentStatus.PAID))
                .thenReturn(false);
        when(paymentRepository
                .findFirstByOnboardingRequestIdAndStatusInOrderByCreatedAtDesc(
                        eq(ONBOARDING_ID),
                        anyCollection()))
                .thenReturn(Optional.of(active));

        CreatePaymentOrderResponse response = paymentService.createOrder(
                request(PaymentMethod.CARD));

        assertEquals(active.getId(), response.getPaymentRecordId());
        assertEquals(active.getProviderOrderId(), response.getProviderOrderId());
        verify(paymentRepository, never()).saveAndFlush(
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsGatewaySwitchWhileAttemptIsActive() {
        PaymentTransaction active = payment(
                53L,
                PaymentMethod.CARD,
                PaymentProvider.RAZORPAY,
                PaymentStatus.PENDING);
        when(paymentRepository.findByIdempotencyKey(IDEMPOTENCY_KEY))
                .thenReturn(Optional.empty());
        when(paymentRepository.existsByOnboardingRequestIdAndStatus(
                ONBOARDING_ID,
                PaymentStatus.PAID))
                .thenReturn(false);
        when(paymentRepository
                .findFirstByOnboardingRequestIdAndStatusInOrderByCreatedAtDesc(
                        eq(ONBOARDING_ID),
                        anyCollection()))
                .thenReturn(Optional.of(active));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.createOrder(
                        request(PaymentMethod.PHONEPE)));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(
                "Another payment attempt is already in progress for this onboarding request",
                exception.getReason());
    }

    private CreatePaymentOrderRequest request(PaymentMethod method) {
        CreatePaymentOrderRequest request = new CreatePaymentOrderRequest();
        request.setOnboardingRequestId(ONBOARDING_ID);
        request.setPreferredMethod(method);
        request.setIdempotencyKey(IDEMPOTENCY_KEY);
        return request;
    }

    private PaymentTransaction payment(
            Long id,
            PaymentMethod method,
            PaymentProvider provider,
            PaymentStatus status) {
        return PaymentTransaction.builder()
                .id(id)
                .onboardingRequestId(ONBOARDING_ID)
                .createdByUserId(USER_ID)
                .provider(provider)
                .preferredMethod(method)
                .status(status)
                .amount(new BigDecimal("5000.00"))
                .amountPaise(500000L)
                .currency("INR")
                .merchantOrderId("ZINCY_TEST_" + id)
                .providerOrderId("order_" + id)
                .idempotencyKey(IDEMPOTENCY_KEY)
                .providerState(status.name())
                .createdAt(LocalDateTime.now())
                .build();
    }
}
