package com.zincycorporation.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
            @RequestBody CreatePaymentOrderRequest request) throws Exception {
        return paymentService.createOrder(request);
    }

    @PostMapping("/verify")
    public PaymentResponse verify(
            @RequestBody VerifyPaymentRequest request) throws Exception {
        return paymentService.verifyPayment(request);
    }
}
