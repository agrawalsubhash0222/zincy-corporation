package com.zincycorporation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "maintenance_setup",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_maintenance_onboarding_request",
            columnNames = "onboarding_request_id"
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(
        name = "onboarding_request_id",
        nullable = false
    )
    private OnboardingRequest onboardingRequest;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "maintenance_type",
        nullable = false,
        length = 50
    )
    private MaintenanceType maintenanceType;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "billing_type",
        length = 30
    )
    private MaintenanceBillingType billingType;

    @Column(
        name = "base_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal baseAmount;

    @Column(
        name = "gst_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal gstAmount;

    @Column(
        name = "total_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal totalAmount;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
        name = "updated_at",
        nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (baseAmount == null) {
            baseAmount = BigDecimal.ZERO;
        }

        if (gstAmount == null) {
            gstAmount = BigDecimal.ZERO;
        }

        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}