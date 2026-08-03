package com.zincycorporation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.UpdateProfileRequest;
import com.zincycorporation.entity.Users;
import com.zincycorporation.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public Users getProfile() {
        return profileService.getProfile();
    }

    @PutMapping("/me")
    public Users updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(request);
    }
}
