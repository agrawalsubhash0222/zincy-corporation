package com.zincycorporation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.zincycorporation.dto.CreatePaymentOrderRequest;
import com.zincycorporation.dto.CreatePaymentOrderResponse;
import com.zincycorporation.dto.PaymentResponse;
import com.zincycorporation.dto.VerifyPaymentRequest;
import com.zincycorporation.entity.MaintenanceSetup;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.entity.ServerSetup;
import com.zincycorporation.enums.PaymentMethod;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.repository.MaintenanceSetupRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;
import com.zincycorporation.repository.ServerSetupRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final BigDecimal ADVANCE_AMOUNT = new BigDecimal("5000.00");

    private final RazorpayClient razorpayClient;
    private final PaymentTransactionRepository paymentRepository;
    private final OnboardingAccessService onboardingAccessService;
    private final ServerSetupRepository serverSetupRepository;
    private final MaintenanceSetupRepository maintenanceSetupRepository;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Transactional
    public CreatePaymentOrderResponse createOrder(
            CreatePaymentOrderRequest request) throws Exception {
        validateCreateRequest(request);

        OnboardingRequest onboarding = onboardingAccessService
                .requireOwned(request.getOnboardingRequestId());

        BigDecimal payableAmount = calculatePayableAmount(request.getOnboardingRequestId());

        long amountPaise = payableAmount
                .multiply(new BigDecimal("100"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        JSONObject options = new JSONObject();
        options.put("amount", amountPaise);
        options.put("currency", "INR");
        options.put(
                "receipt",
                "ONB-" + request.getOnboardingRequestId()
                        + "-" + System.currentTimeMillis());

        JSONObject notes = new JSONObject();
        notes.put(
                "onboardingRequestId",
                request.getOnboardingRequestId());
        notes.put(
                "preferredMethod",
                request.getPreferredMethod().name());
        options.put("notes", notes);

        Order gatewayOrder = razorpayClient.orders.create(options);
        String orderId = gatewayOrder.get("id");

        PaymentTransaction payment = paymentRepository.save(
                PaymentTransaction.builder()
                        .onboardingRequestId(request.getOnboardingRequestId())
                        .amount(payableAmount)
                        .currency("INR")
                        .preferredMethod(request.getPreferredMethod())
                        .status(PaymentStatus.CREATED)
                        .gatewayName("RAZORPAY")
                        .razorpayOrderId(orderId)
                        .build());

        return CreatePaymentOrderResponse.builder()
                .paymentRecordId(payment.getId())
                .keyId(keyId)
                .orderId(orderId)
                .amountPaise(amountPaise)
                .amount(payableAmount)
                .currency("INR")
                .businessName("Zincy Corporation")
                .description(
                        "Onboarding payment #" + onboarding.getId())
                .build();
    }

    @Transactional
    public PaymentResponse verifyPayment(
            VerifyPaymentRequest request) throws Exception {
        if (request.getPaymentRecordId() == null
                || isBlank(request.getRazorpayOrderId())
                || isBlank(request.getRazorpayPaymentId())
                || isBlank(request.getRazorpaySignature())) {
            throw new RuntimeException(
                    "Complete payment verification details are required.");
        }

        PaymentTransaction payment = paymentRepository
                .findById(request.getPaymentRecordId())
                .orElseThrow(() -> new RuntimeException(
                        "Payment record not found."));

        onboardingAccessService.requireOwned(
                payment.getOnboardingRequestId());

        if (!payment.getRazorpayOrderId()
                .equals(request.getRazorpayOrderId())) {
            throw new RuntimeException("Payment order mismatch.");
        }

        String payload = request.getRazorpayOrderId()
                + "|" + request.getRazorpayPaymentId();

        String expectedSignature = hmacSha256(payload, keySecret);

        if (!constantTimeEquals(
                expectedSignature,
                request.getRazorpaySignature())) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Invalid payment signature");
            paymentRepository.save(payment);
            throw new RuntimeException(
                    "Payment verification failed.");
        }

        payment.setRazorpayPaymentId(
                request.getRazorpayPaymentId());
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setFailureReason(null);

        return toResponse(paymentRepository.save(payment));
    }

    private BigDecimal calculatePayableAmount(
            Long onboardingRequestId) {
        ServerSetup server = serverSetupRepository
                .findByOnboardingRequestId(onboardingRequestId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Server setup not found for onboarding request: "
                                        + onboardingRequestId));

        MaintenanceSetup maintenance = maintenanceSetupRepository
                .findByOnboardingRequestId(onboardingRequestId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Maintenance setup not found for onboarding request: "
                                        + onboardingRequestId));

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

    private void validateCreateRequest(
            CreatePaymentOrderRequest request) {
        if (request.getOnboardingRequestId() == null) {
            throw new RuntimeException(
                    "onboardingRequestId is required.");
        }

        if (request.getPreferredMethod() == null) {
            throw new RuntimeException(
                    "preferredMethod is required.");
        }

        if (request.getPreferredMethod() != PaymentMethod.PHONEPE
                && request.getPreferredMethod() != PaymentMethod.GOOGLE_PAY
                && request.getPreferredMethod() != PaymentMethod.NET_BANKING) {
            throw new RuntimeException(
                    "Unsupported payment method.");
        }
    }

    private String hmacSha256(
            String data,
            String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"));

        byte[] hash = mac.doFinal(
                data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hex = new StringBuilder();
        for (byte value : hash) {
            hex.append(String.format("%02x", value));
        }
        return hex.toString();
    }

    private boolean constantTimeEquals(
            String expected,
            String actual) {
        return java.security.MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private PaymentResponse toResponse(
            PaymentTransaction payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .onboardingRequestId(
                        payment.getOnboardingRequestId())
                .razorpayPaymentId(
                        payment.getRazorpayPaymentId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
