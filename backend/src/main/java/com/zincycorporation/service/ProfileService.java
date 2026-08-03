package com.zincycorporation.service;

import org.springframework.stereotype.Service;

import com.zincycorporation.dto.UpdateProfileRequest;
import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.UserRepository;
import com.zincycorporation.security.CurrentUserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public Users getProfile() {
        return currentUserService.requireUser();
    }

    public Users updateProfile(UpdateProfileRequest request) {
        Users user = currentUserService.requireUser();

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
}
