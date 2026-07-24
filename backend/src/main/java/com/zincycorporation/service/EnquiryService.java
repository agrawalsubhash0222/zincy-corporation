package com.zincycorporation.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.zincycorporation.dto.EnquiryRequest;
import com.zincycorporation.dto.EnquiryResponse;
import com.zincycorporation.entity.Enquiry;
import com.zincycorporation.repository.EnquiryRepository;

@Service
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;

    public EnquiryService(EnquiryRepository enquiryRepository) {
        this.enquiryRepository = enquiryRepository;
    }

    public EnquiryResponse createEnquiry(EnquiryRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Full name is required");
        }

        if (request.getMobileNumber() == null || request.getMobileNumber().trim().isEmpty()) {
            throw new RuntimeException("Mobile number is required");
        }

        if (request.getLookingFor() == null || request.getLookingFor().trim().isEmpty()) {
            throw new RuntimeException("Looking for is required");
        }

        Enquiry enquiry = new Enquiry();
        enquiry.setFullName(request.getFullName().trim());
        enquiry.setMobileNumber(request.getMobileNumber().trim());
        enquiry.setEmail(request.getEmail());
        enquiry.setLookingFor(request.getLookingFor());
        enquiry.setMessage(request.getMessage());
        enquiry.setStatus("NEW");

        return new EnquiryResponse(enquiryRepository.save(enquiry));
    }

    public List<EnquiryResponse> getAllEnquiries() {
        return enquiryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(EnquiryResponse::new)
                .toList();
    }
}