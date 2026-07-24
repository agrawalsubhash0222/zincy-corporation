package com.zincycorporation.dto;

public class EnquiryRequest {
    private String fullName;
    private String mobileNumber;
    private String email;
    private String lookingFor;
    private String message;

    public String getFullName() { return fullName; }
    public String getMobileNumber() { return mobileNumber; }
    public String getEmail() { return email; }
    public String getLookingFor() { return lookingFor; }
    public String getMessage() { return message; }

    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public void setEmail(String email) { this.email = email; }
    public void setLookingFor(String lookingFor) { this.lookingFor = lookingFor; }
    public void setMessage(String message) { this.message = message; }
}