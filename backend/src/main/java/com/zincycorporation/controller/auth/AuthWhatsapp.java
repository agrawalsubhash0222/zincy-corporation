package com.zincycorporation.controller.auth;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.UserRepository;
import com.zincycorporation.security.AuthSessionService;
import com.zincycorporation.service.otp.OtpServiceWhatsapp;

@RestController
@RequestMapping("/api/auth/whatsapp")
public class AuthWhatsapp {

        public record SendOtpRequest(
                        String mobile,
                        String type) {
        }

        public record VerifyOtpRequest(
                        String firstName,
                        String lastName,
                        String email,
                        String password,
                        String mobile,
                        String otp,
                        String type) {
        }

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final OtpServiceWhatsapp otpServiceWhatsapp;
        private final AuthSessionService authSessionService;

        public AuthWhatsapp(
                        UserRepository userRepository,
                        OtpServiceWhatsapp otpServiceWhatsapp,
                        PasswordEncoder passwordEncoder,
                        AuthSessionService authSessionService) {
                this.userRepository = userRepository;
                this.otpServiceWhatsapp = otpServiceWhatsapp;
                this.passwordEncoder = passwordEncoder;
                this.authSessionService = authSessionService;
        }

        @PostMapping("/send-otp")
        public ResponseEntity<?> sendOtp(
                        @RequestBody SendOtpRequest request) {

                try {
                        String mobile = normalizeForDatabase(request.mobile());
                        String type = normalizeType(request.type());
                        Optional<Users> user = userRepository.findByMobile(mobile);

                        if ("LOGIN".equals(type) && user.isEmpty()) {
                                return ResponseEntity.badRequest().body(Map.of(
                                                "success", false,
                                                "message", "Mobile number not registered"));
                        }

                        if ("SIGNUP".equals(type) && user.isPresent()) {
                                return ResponseEntity.badRequest().body(Map.of(
                                                "success", false,
                                                "message", "User already exists"));
                        }

                        otpServiceWhatsapp.sendOtp(mobile);

                        return ResponseEntity.ok(Map.of(
                                        "success", true,
                                        "message", "OTP sent on WhatsApp"));
                } catch (IllegalArgumentException exception) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "success", false,
                                        "message", exception.getMessage()));
                } catch (IllegalStateException exception) {
                        return ResponseEntity.internalServerError().body(Map.of(
                                        "success", false,
                                        "message", exception.getMessage()));
                }
        }

        @PostMapping("/verify-otp")
        public ResponseEntity<?> verifyOtp(
                        @RequestBody VerifyOtpRequest request) {

                try {
                        String mobile = normalizeForDatabase(request.mobile());
                        String type = normalizeType(request.type());

                        boolean valid = otpServiceWhatsapp.verifyOtp(
                                        mobile,
                                        request.otp());

                        if (!valid) {
                                return ResponseEntity.badRequest().body(Map.of(
                                                "success", false,
                                                "message", "Invalid or expired OTP"));
                        }

                        Optional<Users> existingUser = userRepository.findByMobile(mobile);

                        if ("LOGIN".equals(type)) {
                                if (existingUser.isEmpty()) {
                                        return ResponseEntity.badRequest().body(Map.of(
                                                        "success", false,
                                                        "message", "User not found"));
                                }

                                return authenticatedResponse(
                                                "Login Success",
                                                existingUser.get());
                        }

                        if (existingUser.isPresent()) {
                                return ResponseEntity.badRequest().body(Map.of(
                                                "success", false,
                                                "message", "User already exists"));
                        }

                        Users newUser = new Users();
                        String firstName = request.firstName() == null
                                        ? ""
                                        : request.firstName().trim();

                        if (firstName.isBlank()) {
                                throw new IllegalArgumentException("First name is required");
                        }

                        if (request.password() == null
                                        || request.password().length() < 8) {
                                throw new IllegalArgumentException(
                                                "Password must contain at least 8 characters");
                        }

                        newUser.setFirstName(firstName);
                        newUser.setLastName(
                                        request.lastName() == null
                                                        ? null
                                                        : request.lastName().trim());
                        newUser.setEmail(request.email());
                        newUser.setPassword(
                                        passwordEncoder.encode(request.password()));
                        newUser.setMobile(mobile);
                        newUser.setRole("CUSTOMER");
                        newUser.setIsVerified(true);
                        newUser.setLoginType("OTP");

                        Users savedUser = userRepository.save(newUser);

                        return authenticatedResponse(
                                        "Signup Success",
                                        savedUser);
                } catch (IllegalArgumentException exception) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "success", false,
                                        "message", exception.getMessage()));
                }
        }

        private ResponseEntity<?> authenticatedResponse(
                        String message,
                        Users user) {
                return ResponseEntity.ok()
                                .header(
                                                HttpHeaders.SET_COOKIE,
                                                authSessionService
                                                                .createSessionCookie(user))
                                .body(Map.of(
                                                "success", true,
                                                "message", message,
                                                "user", user));
        }

        private String normalizeType(String type) {
                if (type == null) {
                        throw new IllegalArgumentException(
                                        "OTP type is required");
                }

                String normalized = type.trim().toUpperCase();

                if (!"LOGIN".equals(normalized)
                                && !"SIGNUP".equals(normalized)) {
                        throw new IllegalArgumentException(
                                        "Invalid OTP type");
                }

                return normalized;
        }

        private String normalizeForDatabase(String mobile) {
                if (mobile == null) {
                        throw new IllegalArgumentException(
                                        "Mobile number is required");
                }

                String cleaned = mobile.replaceAll("\\D", "");

                if (cleaned.length() == 10
                                && cleaned.matches("[6-9]\\d{9}")) {
                        return "+91" + cleaned;
                }

                if (cleaned.length() == 12
                                && cleaned.startsWith("91")
                                && cleaned.substring(2).matches("[6-9]\\d{9}")) {
                        return "+" + cleaned;
                }

                throw new IllegalArgumentException(
                                "Invalid Indian mobile number");
        }
}
