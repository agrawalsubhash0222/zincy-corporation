package com.zincycorporation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.AdminOnboardingDetailsResponse;
import com.zincycorporation.dto.CustomerLatestOnboardingResponse;
import com.zincycorporation.dto.OnboardingRequestDto;
import com.zincycorporation.entity.OnboardingRequest;
import com.zincycorporation.service.AdminOnboardingDetailsService;
import com.zincycorporation.service.OnboardingRequestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/onboarding-requests")
@RequiredArgsConstructor
public class OnboardingRequestController {

        private final OnboardingRequestService service;
        private final AdminOnboardingDetailsService adminDetailsService;

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public OnboardingRequest submit(
                        @RequestBody OnboardingRequestDto dto) {
                return service.submit(dto);
        }

        @GetMapping("/customer/me")
        public List<CustomerLatestOnboardingResponse> getCustomerRequests() {
                return service.getCustomerRequests();
        }

        @GetMapping("/customer/request/{id}/progress")
        public CustomerLatestOnboardingResponse getCustomerRequestProgress(
                        @PathVariable Long id) {
                return service.getCustomerRequestProgress(id);
        }

        @GetMapping("/admin")
        public List<OnboardingRequest> getAll() {
                return service.getAll();
        }

        @GetMapping("/admin/{id}/details")
        public AdminOnboardingDetailsResponse getAdminDetails(
                        @PathVariable Long id) {
                return adminDetailsService.getDetails(id);
        }

        @PatchMapping("/admin/{id}/status")
        public OnboardingRequest updateStatus(
                        @PathVariable Long id,
                        @RequestBody Map<String, String> request) {
                return service.updateStatus(id, request.get("status"));
        }
}
