package com.zincycorporation.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.zincycorporation.entity.PaymentRefund;
import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.enums.PaymentStatus;
import com.zincycorporation.enums.RefundSource;
import com.zincycorporation.enums.RefundStatus;
import com.zincycorporation.repository.PaymentRefundRepository;
import com.zincycorporation.repository.PaymentTransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentReconciliationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            PaymentReconciliationService.class);
    private static final List<String> AUTOMATIC_REFUND_CODES = List.of(
            "DUPLICATE_CAPTURE",
            "FORBIDDEN_PAYMENT_METHOD",
            "LATE_CAPTURE");

    private final PaymentTransactionRepository paymentRepository;
    private final PaymentRefundRepository refundRepository;
    private final PaymentService paymentService;
    private final PaymentRefundService refundService;

    @Value("${payment.reconciliation.enabled:true}")
    private boolean enabled;

    @Scheduled(
            fixedDelayString = "${payment.reconciliation.interval-ms:15000}",
            initialDelayString = "${payment.reconciliation.initial-delay-ms:15000}")
    public void reconcile() {
        if (!enabled) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<PaymentTransaction> payments = new ArrayList<>(
                paymentRepository
                        .findTop50ByStatusInAndNextReconcileAtLessThanEqualOrderByNextReconcileAtAsc(
                                List.of(
                                        PaymentStatus.CREATED,
                                        PaymentStatus.PENDING),
                                now));
        List<PaymentTransaction> terminalPayments = paymentRepository
                .findTop50ByStatusInAndNextReconcileAtLessThanEqualOrderByNextReconcileAtAsc(
                        List.of(PaymentStatus.FAILED, PaymentStatus.EXPIRED),
                        now);
        payments.addAll(terminalPayments);
        for (PaymentTransaction payment : payments) {
            try {
                paymentService.reconcilePayment(payment);
            } catch (RuntimeException exception) {
                LOGGER.warn(
                        "Payment reconciliation failed for record {}",
                        payment.getId(),
                        exception);
            }
        }

        List<PaymentTransaction> reviewPayments = paymentRepository
                .findTop50ByStatusAndFailureCodeInOrderByUpdatedAtAsc(
                        PaymentStatus.REVIEW_REQUIRED,
                        AUTOMATIC_REFUND_CODES);
        for (PaymentTransaction payment : reviewPayments) {
            try {
                paymentService.ensureAutomaticRefund(payment);
            } catch (RuntimeException exception) {
                LOGGER.warn(
                        "Automatic refund initiation failed for payment {}",
                        payment.getId(),
                        exception);
            }
        }

        List<PaymentRefund> refunds = refundRepository
                .findTop50ByStatusInAndNextReconcileAtLessThanEqualOrderByNextReconcileAtAsc(
                        List.of(RefundStatus.REQUESTED, RefundStatus.PENDING),
                        now);
        for (PaymentRefund refund : refunds) {
            try {
                refundService.reconcile(refund, RefundSource.SCHEDULER);
            } catch (RuntimeException exception) {
                LOGGER.warn(
                        "Refund reconciliation failed for record {}",
                        refund.getId(),
                        exception);
            }
        }
    }
}
