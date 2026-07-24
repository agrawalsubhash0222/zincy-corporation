package com.zincycorporation.dto;

import java.time.LocalDateTime;

import com.zincycorporation.entity.Enquiry;

public class EnquiryResponse {

    private Long id;
    private String fullName;
    private String mobileNumber;
    private String email;
    private String lookingFor;
    private String message;
    private String status;
    private LocalDateTime createdAt;

    public EnquiryResponse(Enquiry enquiry) {
        this.id = enquiry.getId();
        this.fullName = enquiry.getFullName();
        this.mobileNumber = enquiry.getMobileNumber();
        this.email = enquiry.getEmail();
        this.lookingFor = enquiry.getLookingFor();
        this.message = enquiry.getMessage();
        this.status = enquiry.getStatus();
        this.createdAt = enquiry.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public String getEmail() {
        return email;
    }

    public String getLookingFor() {
        return lookingFor;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}