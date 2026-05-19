package com.zincyCorporation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincyCorporation.dto.ContactRequest;
import com.zincyCorporation.entity.ContactEnquiry;
import com.zincyCorporation.service.ContactService;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<?> submitContact(@RequestBody ContactRequest request) {

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        if (request.getMobileNumber() == null || request.getMobileNumber().isBlank()) {
            return ResponseEntity.badRequest().body("Mobile number is required");
        }

        if (request.getLookingFor() == null || request.getLookingFor().isEmpty()) {
            return ResponseEntity.badRequest().body("Please select at least one service");
        }

        ContactEnquiry saved = contactService.saveContact(request);

        return ResponseEntity.ok(saved);
    }
}