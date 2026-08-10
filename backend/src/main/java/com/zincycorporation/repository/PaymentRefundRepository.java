package com.zincycorporation.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.PaymentRefund;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.RefundStatus;

public interface PaymentRefundRepository
        extends JpaRepository<PaymentRefund, Long> {

    Optional<PaymentRefund> findByPaymentOrderId(Long paymentOrderId);

    Optional<PaymentRefund> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentRefund> findByMerchantRefundId(String merchantRefundId);

    Optional<PaymentRefund> findByProviderAndProviderRefundId(
            PaymentProvider provider,
            String providerRefundId);

    List<PaymentRefund> findTop100ByOrderByUpdatedAtDesc();

    List<PaymentRefund> findTop100ByStatusOrderByUpdatedAtDesc(
            RefundStatus status);

    List<PaymentRefund>
            findTop50ByStatusInAndNextReconcileAtLessThanEqualOrderByNextReconcileAtAsc(
                    Collection<RefundStatus> statuses,
                    LocalDateTime nextReconcileAt);
}
