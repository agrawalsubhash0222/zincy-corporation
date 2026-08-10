package com.zincycorporation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zincycorporation.entity.PaymentRefundEvent;

public interface PaymentRefundEventRepository
        extends JpaRepository<PaymentRefundEvent, Long> {
}
