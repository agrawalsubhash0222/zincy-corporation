package com.zincycorporation.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.ClientBusinessSetupResponseDto;
import com.zincycorporation.entity.ClientBusinessSetup;
import com.zincycorporation.service.ClientBusinessSetupService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/client-business-setup")
@RequiredArgsConstructor
public class ClientBusinessSetupController {

        private final ClientBusinessSetupService service;

        @PostMapping
        public ResponseEntity<ClientBusinessSetup> save(
                        @RequestBody ClientBusinessSetupResponseDto dto) {

                return ResponseEntity.ok(
                                service.save(dto));
        }

        @GetMapping("/onboarding/{onboardingRequestId}")
        public ResponseEntity<ClientBusinessSetupResponseDto> getByOnboardingRequestId(
                        @PathVariable Long onboardingRequestId) {

                return ResponseEntity.ok(
                                service.getByOnboardingRequestId(
                                                onboardingRequestId));
        }

        @GetMapping("/onboarding/{onboardingRequestId}/exists")
        public ResponseEntity<Map<String, Boolean>> exists(
                        @PathVariable Long onboardingRequestId) {

                boolean completed = service.existsByOnboardingRequestId(
                                onboardingRequestId);

                return ResponseEntity.ok(
                                Map.of(
                                                "clientSetupCompleted",
                                                completed));
        }
}