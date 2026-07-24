package com.zincycorporation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zincycorporation.dto.EnquiryRequest;
import com.zincycorporation.entity.Enquiry;
import com.zincycorporation.repository.EnquiryRepository;

@RestController
@RequestMapping("/api")
public class EnquiryController {

    private final EnquiryRepository enquiryRepository;

    public EnquiryController(EnquiryRepository enquiryRepository) {
        this.enquiryRepository = enquiryRepository;
    }

    @PostMapping("/enquiries")
    public Enquiry create(@RequestBody EnquiryRequest request) {
        Enquiry enquiry = new Enquiry();
        enquiry.setFullName(request.getFullName());
        enquiry.setMobileNumber(request.getMobileNumber());
        enquiry.setEmail(request.getEmail());
        enquiry.setLookingFor(request.getLookingFor());
        enquiry.setMessage(request.getMessage());
        enquiry.setStatus("NEW");
        return enquiryRepository.save(enquiry);
    }

    @GetMapping("/admin/enquiries")
    public List<Enquiry> list() {
        return enquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    @PatchMapping("/admin/enquiries/{id}/status")
    public Enquiry updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enquiry not found"));

        enquiry.setStatus(body.getOrDefault("status", "NEW"));
        return enquiryRepository.save(enquiry);
    }
}