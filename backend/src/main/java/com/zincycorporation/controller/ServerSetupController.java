package com.zincycorporation.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.ServerSetupRequest;
import com.zincycorporation.dto.ServerSetupResponse;
import com.zincycorporation.service.ServerSetupService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/server-setup")
@RequiredArgsConstructor
public class ServerSetupController {

    private final ServerSetupService serverSetupService;

    @PostMapping
    public ResponseEntity<ServerSetupResponse> save(
        @RequestBody ServerSetupRequest dto
    ) {
        ServerSetupResponse response =
            serverSetupService.save(dto);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }

    @GetMapping("/onboarding/{onboardingRequestId}")
    public ResponseEntity<ServerSetupResponse>
            getByOnboardingRequestId(
                @PathVariable Long onboardingRequestId
            ) {

        return ResponseEntity.ok(
            serverSetupService.getByOnboardingRequestId(
                onboardingRequestId
            )
        );
    }
}