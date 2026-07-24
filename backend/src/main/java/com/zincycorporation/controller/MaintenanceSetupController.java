package com.zincycorporation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.MaintenanceSetupRequest;
import com.zincycorporation.dto.MaintenanceSetupResponse;
import com.zincycorporation.service.MaintenanceSetupService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/maintenance-setup")
@RequiredArgsConstructor
public class MaintenanceSetupController {

    private final MaintenanceSetupService maintenanceSetupService;

    @PostMapping
    public ResponseEntity<MaintenanceSetupResponse> save(
            @RequestBody MaintenanceSetupRequest request) {

        return ResponseEntity.ok(
                maintenanceSetupService.save(request));
    }

    @GetMapping("/onboarding/{onboardingRequestId}")
    public ResponseEntity<MaintenanceSetupResponse> getByOnboardingRequestId(
            @PathVariable Long onboardingRequestId) {

        return maintenanceSetupService
                .findByOnboardingRequestId(onboardingRequestId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}