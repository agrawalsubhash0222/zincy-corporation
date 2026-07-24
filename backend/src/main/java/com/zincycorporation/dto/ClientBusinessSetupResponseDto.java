package com.zincycorporation.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientBusinessSetupResponseDto {

    private Long id;
    private Long onboardingRequestId;

    private String businessName;

    private String ownerName;
    private String ownerContact;
    private String ownerEmail;
    private String secondaryContact;

    private List<String> contacts;
    private String email;
    private String whatsappContact;
    private String businessType;
    private String businessLogo;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;

    private Boolean gstRegistered;
    private String gstNumber;
    private String panNumber;
    private String msmeNumber;
    private String fssaiNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}