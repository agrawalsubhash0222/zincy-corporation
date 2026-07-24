package com.zincycorporation.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "client_business_setup")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientBusinessSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "onboarding_request_id",
            nullable = false,
            unique = true
    )
    private Long onboardingRequestId;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "owner_contact")
    private String ownerContact;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Column(name = "secondary_contact")
    private String secondaryContact;

    @Column(columnDefinition = "JSON")
    private String contacts;

    @Column(name = "business_email")
    private String businessEmail;

    @Column(name = "whatsapp_contact")
    private String whatsappContact;

    @Column(name = "business_type")
    private String businessType;

    @Column(
            name = "business_logo_url",
            length = 1000
    )
    private String businessLogoUrl;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    private String city;

    private String state;

    private String pincode;

    @Column(name = "gst_registered")
    private Boolean gstRegistered;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "udyam_number")
    private String udyamNumber;

    @Column(name = "fssai_license_number")
    private String fssaiLicenseNumber;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null || status.isBlank()) {
            status = "SUBMITTED";
        }

        if (gstRegistered == null) {
            gstRegistered = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();

        if (gstRegistered == null) {
            gstRegistered = false;
        }
    }
}