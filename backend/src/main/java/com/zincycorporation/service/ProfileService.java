package com.zincycorporation.service;

import org.springframework.stereotype.Service;

import com.zincycorporation.dto.UpdateProfileRequest;
import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;

    public Users getProfile(String mobile) {
        String normalizedMobile = normalizeMobile(mobile);

        return userRepository.findByMobile(normalizedMobile)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Users updateProfile(String mobile, UpdateProfileRequest request) {
        String normalizedMobile = normalizeMobile(mobile);

        Users user = userRepository.findByMobile(normalizedMobile)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(request.getFirstName().trim());

        user.setLastName(
                request.getLastName() == null
                        ? null
                        : request.getLastName().trim());

        user.setEmail(
                request.getEmail() == null
                        ? null
                        : request.getEmail().trim().toLowerCase());

        user.setProfileImageUrl(request.getProfileImageUrl());

        return userRepository.save(user);
    }

    private String normalizeMobile(String mobile) {
        if (mobile == null || mobile.isBlank()) {
            return mobile;
        }

        String digits = mobile.replaceAll("[^0-9]", "");

        if (digits.length() == 10) {
            return "+91" + digits;
        }

        if (digits.length() == 12 && digits.startsWith("91")) {
            return "+" + digits;
        }

        return mobile.trim();
    }
}