package com.zincycorporation.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PhonePeClientTest {

    @Test
    void validatesConfiguredWebhookCredentialHash() throws Exception {
        PhonePeClient client = new PhonePeClient();
        ReflectionTestUtils.setField(client, "webhookUsername", "zincy-test");
        ReflectionTestUtils.setField(client, "webhookPassword", "secret-value");

        String authorization = sha256Hex("zincy-test:secret-value");

        assertTrue(client.verifyWebhookAuthorization(authorization));
        assertTrue(client.verifyWebhookAuthorization("SHA256 " + authorization));
        assertFalse(client.verifyWebhookAuthorization("wrong-value"));
        assertFalse(client.verifyWebhookAuthorization(null));
    }

    @Test
    void acceptsOnlyDocumentedPhonePeUpiPaymentModes() {
        assertTrue(PhonePeClient.isUpiPaymentMode("UPI_INTENT"));
        assertTrue(PhonePeClient.isUpiPaymentMode("upi_qr"));
        assertTrue(PhonePeClient.isUpiPaymentMode(" UPI_COLLECT "));

        assertFalse(PhonePeClient.isUpiPaymentMode("CARD"));
        assertFalse(PhonePeClient.isUpiPaymentMode("NET_BANKING"));
        assertFalse(PhonePeClient.isUpiPaymentMode("TOKEN"));
        assertFalse(PhonePeClient.isUpiPaymentMode(null));
    }

    private String sha256Hex(String value) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(hash.length * 2);
        for (byte item : hash) {
            hex.append(String.format("%02x", item));
        }
        return hex.toString();
    }
}
