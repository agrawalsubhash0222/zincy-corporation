package com.zincycorporation.dto;

import java.util.List;

import lombok.Data;

@Data
public class OnboardingRequestDto {

    private Long id;

    private String businessName;
    private String ownerName;

    private String mobile;
    private String userMobile;
    private String email;

    private List<String> projectTypes;

    private String requirement;
    private String budget;
    private String timeline;
    private String status;

    private Boolean clientSetupCompleted;
    private Boolean serverSetupCompleted;
    private Boolean maintenanceSetupCompleted;
}