package com.zincyCorporation.dto;

import java.util.List;

public class ContactRequest {

    private String fullName;
    private String mobileNumber;
    private String email;
    private List<String> lookingFor;
    private String message;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public List<String> getLookingFor() { return lookingFor; }
    public void setLookingFor(List<String> lookingFor) { this.lookingFor = lookingFor; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}