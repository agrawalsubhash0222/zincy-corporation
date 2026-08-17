package com.zincycorporation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.PaymentRefundEvent;

public interface PaymentRefundEventRepository
                extends JpaRepository<PaymentRefundEvent, Long> {

        boolean existsByGatewayEventId(String gatewayEventId);

        Optional<PaymentRefundEvent> findByGatewayEventId(
                        String gatewayEventId);
}