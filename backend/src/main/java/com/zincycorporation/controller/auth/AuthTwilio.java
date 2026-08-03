package com.zincycorporation.controller.auth;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.entity.Users;
import com.zincycorporation.repository.UserRepository;
import com.zincycorporation.security.AuthSessionService;
import com.zincycorporation.service.otp.OtpServiceTwilio;

@ConditionalOnProperty(name = "twilio.enabled", havingValue = "true")
@RestController
@RequestMapping("/api/auth")
public class AuthTwilio {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpServiceTwilio otpServiceTwilio;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthSessionService authSessionService;

    @PostMapping("/send-otp-twilio")
    public ResponseEntity<?> sendOtpTwilio(
            @RequestParam String mobile,
            @RequestParam String type) {

        Optional<Users> user = userRepository.findByMobile(mobile);

        if ("LOGIN".equalsIgnoreCase(type) && user.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Mobile number not registered"));
        }

        if ("SIGNUP".equalsIgnoreCase(type) && user.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User already exists"));
        }

        otpServiceTwilio.sendOtpTwilio(mobile);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent"));
    }

    @PostMapping("/verify-otp-twilio")
    public ResponseEntity<?> verifyOtpTwilio(

            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,

            @RequestParam String mobile,
            @RequestParam String otp,
            @RequestParam String type) {

        boolean isValid = otpServiceTwilio.verifyOtpTwilio(mobile, otp);

        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid OTP"));
        }

        Optional<Users> existingUser = userRepository.findByMobile(mobile);

        // 🔐 LOGIN FLOW
        if ("LOGIN".equalsIgnoreCase(type)) {

            if (existingUser.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "User not found"));
            }

            return authenticatedResponse(
                    "Login Success",
                    existingUser.get());
        }

        // 🆕 SIGNUP FLOW
        if ("SIGNUP".equalsIgnoreCase(type)) {

            if (existingUser.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "User already exists"));
            }

            // ✅ CREATE USER HERE
            Users newUser = new Users();
            if (firstName == null || firstName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "First name is required"));
            }

            if (password == null || password.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Password must contain at least 8 characters"));
            }

            newUser.setFirstName(firstName.trim());
            newUser.setLastName(
                    lastName == null ? null : lastName.trim());
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(password));
            newUser.setMobile(mobile);
            newUser.setRole("CUSTOMER");
            newUser.setIsVerified(true); // mark verified

            // optional fields
            newUser.setLoginType("OTP");

            Users savedUser = userRepository.save(newUser);

            return authenticatedResponse(
                    "Signup Success",
                    savedUser);
        }

        return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid type"));
    }

    private ResponseEntity<?> authenticatedResponse(
            String message,
            Users user) {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        authSessionService.createSessionCookie(user))
                .body(Map.of(
                        "message", message,
                        "user", user));
    }
}
