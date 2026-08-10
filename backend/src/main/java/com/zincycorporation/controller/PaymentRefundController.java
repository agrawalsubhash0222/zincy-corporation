package com.zincycorporation.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.CreateRefundRequest;
import com.zincycorporation.dto.RefundResponse;
import com.zincycorporation.enums.RefundStatus;
import com.zincycorporation.service.PaymentRefundService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class PaymentRefundController {

    private final PaymentRefundService paymentRefundService;

    @PostMapping("/payments/{paymentOrderId}/refunds")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public RefundResponse requestRefund(
            @PathVariable Long paymentOrderId,
            @RequestBody CreateRefundRequest request) {
        return paymentRefundService.requestAdminRefund(paymentOrderId, request);
    }

    @GetMapping("/payment-refunds/{refundId}")
    public RefundResponse getRefund(
            @PathVariable Long refundId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return paymentRefundService.getAdminRefund(refundId, refresh);
    }

    @GetMapping("/payment-refunds")
    public List<RefundResponse> listRefunds(
            @RequestParam(required = false) RefundStatus status) {
        return paymentRefundService.listAdminRefunds(status);
    }

    @PostMapping("/payment-refunds/{refundId}/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public RefundResponse retryRefund(@PathVariable Long refundId) {
        return paymentRefundService.retryAdminRefund(refundId);
    }
}
