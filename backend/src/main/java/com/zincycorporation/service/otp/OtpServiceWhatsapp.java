package com.zincycorporation.service.otp;
// package com.zincycorporation.service.otp;

// import java.time.Instant;
// import java.util.Map;
// import java.util.Random;
// import java.util.concurrent.ConcurrentHashMap;

// import org.springframework.http.HttpHeaders;
// import org.springframework.stereotype.Service;
// import org.springframework.web.client.RestClient;

// import com.zincycorporation.config.WhatsAppProperties;

// @Service
// public class OtpServiceWhatsapp {

//     private record OtpData(String otp, Instant expiryTime) {
//     }

//     private final RestClient restClient;

//     private final WhatsAppProperties properties;

//     private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

//     public OtpServiceWhatsapp(
//             RestClient restClient,
//             WhatsAppProperties properties) {
//         this.restClient = restClient;
//         this.properties = properties;
//     }

//     public void sendOtp(String mobile) {
//         String normalizedMobile = normalizeIndianMobile(mobile);
//         String otp = generateOtp();

//         otpStore.put(
//                 normalizedMobile,
//                 new OtpData(otp, Instant.now().plusSeconds(properties.getOtpExpiryMinutes() * 60L)));

//         sendWhatsAppTemplate(normalizedMobile, otp);
//     }

//     public boolean verifyOtp(String mobile, String otp) {
//         String normalizedMobile = normalizeIndianMobile(mobile);

//         OtpData otpData = otpStore.get(normalizedMobile);

//         if (otpData == null) {
//             return false;
//         }

//         if (Instant.now().isAfter(otpData.expiryTime())) {
//             otpStore.remove(normalizedMobile);
//             return false;
//         }

//         boolean matched = otpData.otp().equals(otp);

//         if (matched) {
//             otpStore.remove(normalizedMobile);
//         }

//         return matched;
//     }

//     private void sendWhatsAppTemplate(String mobile, String otp) {
//         String url = properties.getApiUrl()
//                 + "/"
//                 + properties.getPhoneNumberId()
//                 + "/messages";

//         Map<String, Object> body = Map.of(
//                 "messaging_product", "whatsapp",
//                 "to", mobile,
//                 "type", "template",
//                 "template", Map.of(
//                         "name", properties.getTemplateName(),
//                         "language", Map.of(
//                                 "code", properties.getTemplateLanguage())));

//         restClient.post()
//                 .uri(url)
//                 .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getAccessToken())
//                 .header(HttpHeaders.CONTENT_TYPE, "application/json")
//                 .body(body)
//                 .retrieve()
//                 .toBodilessEntity();
//     }

//     private String generateOtp() {
//         return String.valueOf(100000 + new Random().nextInt(900000));
//     }

//     private String normalizeIndianMobile(String mobile) {
//         String cleaned = mobile.replaceAll("\\D", "");

//         if (cleaned.length() == 10) {
//             return "91" + cleaned;
//         }

//         if (cleaned.startsWith("91") && cleaned.length() == 12) {
//             return cleaned;
//         }

//         throw new IllegalArgumentException("Invalid mobile number");
//     }
// }