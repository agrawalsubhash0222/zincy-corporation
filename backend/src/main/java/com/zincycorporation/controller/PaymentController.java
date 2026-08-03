package com.zincycorporation.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.CreatePaymentOrderRequest;
import com.zincycorporation.dto.CreatePaymentOrderResponse;
import com.zincycorporation.dto.PaymentResponse;
import com.zincycorporation.dto.VerifyPaymentRequest;
import com.zincycorporation.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public CreatePaymentOrderResponse createOrder(
            @RequestBody CreatePaymentOrderRequest request) {
        return paymentService.createOrder(request);
    }

    @PostMapping("/razorpay/verify")
    public PaymentResponse verifyRazorpay(
            @RequestBody VerifyPaymentRequest request) {
        return paymentService.verifyRazorpayPayment(request);
    }

    @GetMapping("/{paymentRecordId}/status")
    public PaymentResponse status(
            @PathVariable Long paymentRecordId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return paymentService.getStatus(paymentRecordId, refresh);
    }

    @PostMapping("/phonepe/webhook")
    public void phonePeWebhook(
            @RequestHeader(
                    name = "Authorization",
                    required = false) String authorization,
            @RequestBody byte[] rawBody) {
        paymentService.handlePhonePeWebhook(authorization, rawBody);
    }

    @PostMapping("/razorpay/webhook")
    public void razorpayWebhook(
            @RequestHeader(
                    name = "X-Razorpay-Signature",
                    required = false) String signature,
            @RequestHeader(
                    name = "X-Razorpay-Event-Id",
                    required = false) String eventId,
            @RequestBody byte[] rawBody) {
        paymentService.handleRazorpayWebhook(signature, eventId, rawBody);
    }
}
