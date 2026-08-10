package com.zincycorporation.dto;

public class PaymentFailureRequest {
    private String providerOrderId;
    private String errorCode;
    private String errorDescription;

    public PaymentFailureRequest() {}

    public PaymentFailureRequest(String providerOrderId, String errorCode, String errorDescription) {
        this.providerOrderId = providerOrderId;
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
    }

    public String getProviderOrderId() {
        return providerOrderId;
    }

    public void setProviderOrderId(String providerOrderId) {
        this.providerOrderId = providerOrderId;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorDescription() {
        return errorDescription;
    }

    public void setErrorDescription(String errorDescription) {
        this.errorDescription = errorDescription;
    }
}