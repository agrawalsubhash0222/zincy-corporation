package com.zincycorporation.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.PaymentTransaction;
import com.zincycorporation.enums.PaymentProvider;
import com.zincycorporation.enums.PaymentStatus;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentTransaction> findByMerchantOrderId(String merchantOrderId);

    Optional<PaymentTransaction> findByProviderAndProviderOrderId(
            PaymentProvider provider,
            String providerOrderId);

    Optional<PaymentTransaction> findByProviderAndProviderPaymentId(
            PaymentProvider provider,
            String providerPaymentId);

    boolean existsByOnboardingRequestIdAndStatus(
            Long onboardingRequestId,
            PaymentStatus status);

    boolean existsByOnboardingRequestIdAndStatusAndIdNot(
            Long onboardingRequestId,
            PaymentStatus status,
            Long id);

    Optional<PaymentTransaction>
            findFirstByOnboardingRequestIdAndStatusInOrderByCreatedAtDesc(
                    Long onboardingRequestId,
                    Collection<PaymentStatus> statuses);
}
