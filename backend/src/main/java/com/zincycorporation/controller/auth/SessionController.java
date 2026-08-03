package com.zincycorporation.controller.auth;

import java.time.LocalDateTime;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.entity.Users;
import com.zincycorporation.security.AuthSessionService;
import com.zincycorporation.security.CurrentUserService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SessionController {

    private final CurrentUserService currentUserService;
    private final AuthSessionService authSessionService;

    @GetMapping("/session")
    public AuthenticatedUserResponse getSession() {
        return AuthenticatedUserResponse.from(
                currentUserService.requireUser());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authSessionService.revoke(request);

        return ResponseEntity.noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        authSessionService.clearSessionCookie())
                .build();
    }

    public record AuthenticatedUserResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String mobile,
            String role,
            String profileImageUrl,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        static AuthenticatedUserResponse from(Users user) {
            return new AuthenticatedUserResponse(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail(),
                    user.getMobile(),
                    user.getRole(),
                    user.getProfileImageUrl(),
                    user.getCreatedAt(),
                    user.getUpdatedAt());
        }
    }
}
