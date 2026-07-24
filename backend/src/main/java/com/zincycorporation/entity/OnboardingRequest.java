package com.zincycorporation.entity;

import java.time.LocalDateTime;

import com.zincycorporation.enums.OnboardingStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "onboarding_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "owner_name")
    private String ownerName;

    private String mobile;

    @Column(name = "user_mobile", nullable = false)
    private String userMobile;

    private String email;

    @Column(name = "project_types", columnDefinition = "TEXT")
    private String projectTypes;

    @Column(columnDefinition = "TEXT")
    private String requirement;

    private String budget;

    private String timeline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OnboardingStatus status;

    @Builder.Default
    @Column(
            name = "client_setup_completed",
            nullable = false
    )
    private Boolean clientSetupCompleted = false;

    @Builder.Default
    @Column(
            name = "server_setup_completed",
            nullable = false
    )
    private Boolean serverSetupCompleted = false;

    @Builder.Default
    @Column(
            name = "maintenance_setup_completed",
            nullable = false
    )
    private Boolean maintenanceSetupCompleted = false;

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

        if (status == null) {
            status = OnboardingStatus.SUBMITTED;
        }

        normalizeCompletionFlags();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
        normalizeCompletionFlags();
    }

    public boolean isClientSetupCompleted() {
        return Boolean.TRUE.equals(clientSetupCompleted);
    }

    public boolean isServerSetupCompleted() {
        return Boolean.TRUE.equals(serverSetupCompleted);
    }

    public boolean isMaintenanceSetupCompleted() {
        return Boolean.TRUE.equals(
                maintenanceSetupCompleted
        );
    }

    private void normalizeCompletionFlags() {
        if (clientSetupCompleted == null) {
            clientSetupCompleted = false;
        }

        if (serverSetupCompleted == null) {
            serverSetupCompleted = false;
        }

        if (maintenanceSetupCompleted == null) {
            maintenanceSetupCompleted = false;
        }
    }
}