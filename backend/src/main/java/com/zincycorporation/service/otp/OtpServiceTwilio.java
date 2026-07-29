package com.zincycorporation.service.otp;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;

@ConditionalOnProperty(name = "twilio.enabled", havingValue = "true")
@Service
public class OtpServiceTwilio {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.from.number}")
    private String fromNumber;

    private final Map<String, String> otpStorage =
            new ConcurrentHashMap<>();

    @PostConstruct
    public void initTwilio() {

        if (accountSid == null || accountSid.isBlank()
                || authToken == null || authToken.isBlank()) {

            System.out.println(
                    "Twilio is disabled because credentials are not configured."
            );

            return;
        }

        Twilio.init(accountSid, authToken);

    }

    public void sendOtpTwilio(String mobile) {

        try {

            String otp = String.valueOf(
                    new Random().nextInt(900000) + 100000);

            Message message = Message.creator(
                    new PhoneNumber(mobile),
                    new PhoneNumber(fromNumber),
                    "Your OTP is: " + otp
            ).create();


            otpStorage.put(mobile, otp);

        } catch (ApiException e) {

            e.printStackTrace();

            throw new RuntimeException(
                    "Twilio API Error: " + e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            throw new RuntimeException(
                    "Unable to send OTP: " + e.getMessage());
        }
    }

    public boolean verifyOtpTwilio(
            String mobile,
            String otp) {

        String storedOtp = otpStorage.get(mobile);

        if (storedOtp == null) {
            return false;
        }

        boolean verified = storedOtp.equals(otp);

        if (verified) {
            otpStorage.remove(mobile);
        }

        return verified;
    }
}