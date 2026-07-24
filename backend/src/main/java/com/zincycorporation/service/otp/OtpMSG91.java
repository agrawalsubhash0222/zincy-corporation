package com.zincycorporation.service.otp;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OtpMSG91 {

    @Value("${msg91.authkey}")
    private String authKey;

    @Value("${msg91.templateId}")
    private String templateId;

    public String sendOtp(String mobile) {
    String url = "https://control.msg91.com/api/v5/otp";

    String formattedMobile = mobile.startsWith("91") ? mobile : "91" + mobile;

    RestTemplate restTemplate = new RestTemplate();

    HttpHeaders headers = new HttpHeaders();
    headers.set("authkey", authKey);
    headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

    // ✅ IMPORTANT: use Map instead of String
    Map<String, String> body = new HashMap<>();
    body.put("template_id", templateId);
    body.put("mobile", formattedMobile);

    HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

    ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            String.class
    );

    System.out.println("MSG91 RESPONSE: " + response.getBody());

    return response.getBody();
}

    public String verifyOtp(String mobile, String otp) {
    String url = "https://control.msg91.com/api/v5/otp/verify";

    String formattedMobile = mobile.startsWith("91") ? mobile : "91" + mobile;

    RestTemplate restTemplate = new RestTemplate();

    HttpHeaders headers = new HttpHeaders();
    headers.set("authkey", authKey);
    headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

    Map<String, String> body = new HashMap<>();
    body.put("mobile", formattedMobile);
    body.put("otp", otp);

    HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

    ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            String.class
    );

    System.out.println("VERIFY RESPONSE: " + response.getBody());

    return response.getBody();
}
}
