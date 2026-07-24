package com.zincycorporation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.zincycorporation.enums.BillingType;

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
    name = "server_setup",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_server_setup_onboarding",
            columnNames = "onboarding_request_id"
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(
        name = "onboarding_request_id",
        nullable = false,
        unique = true
    )
    private OnboardingRequest onboardingRequest;

    @Column(name = "server_name", nullable = false, length = 100)
    private String serverName;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", length = 20)
    private BillingType billingType;

    /**
     * Plan price before GST.
     */
    @Column(
        name = "base_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal baseAmount;

    /**
     * Calculated GST amount.
     */
    @Column(
        name = "gst_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal gstAmount;

    /**
     * baseAmount + gstAmount.
     */
    @Column(
        name = "total_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "skipped", nullable = false)
    private Boolean skipped = false;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (skipped == null) {
            skipped = false;
        }

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
    public void onUpdate() {
        updatedAt = LocalDateTime.now();

        if (skipped == null) {
            skipped = false;
        }
    }
}