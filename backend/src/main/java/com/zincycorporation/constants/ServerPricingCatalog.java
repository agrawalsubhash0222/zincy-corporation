package com.zincycorporation.constants;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

import com.zincycorporation.enums.BillingType;

public final class ServerPricingCatalog {

    private static final BigDecimal TWELVE = new BigDecimal("12");
    private static final BigDecimal YEARLY_DISCOUNT_MULTIPLIER =
            new BigDecimal("0.90");

    private static final Map<String, BigDecimal> MONTHLY_PRICES = Map.of(
            "Hostinger VPS", new BigDecimal("799.00"),
            "Railway", new BigDecimal("1299.00"),
            "Render", new BigDecimal("1699.00"),
            "DigitalOcean", new BigDecimal("1899.00"),
            "AWS", new BigDecimal("2599.00"));

    private ServerPricingCatalog() {
    }

    public static BigDecimal resolve(
            String serverName,
            BillingType billingType) {
        if (serverName == null || serverName.isBlank()) {
            throw new IllegalArgumentException("serverName is required");
        }

        if (billingType == null) {
            throw new IllegalArgumentException("billingType is required");
        }

        String normalizedName = serverName.trim();
        BigDecimal monthlyPrice = MONTHLY_PRICES.get(normalizedName);

        if (monthlyPrice == null) {
            throw new IllegalArgumentException("Unsupported server plan");
        }

        if (billingType == BillingType.MONTHLY) {
            return monthlyPrice.setScale(2, RoundingMode.HALF_UP);
        }

        return monthlyPrice
                .multiply(TWELVE)
                .multiply(YEARLY_DISCOUNT_MULTIPLIER)
                .setScale(0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.UNNECESSARY);
    }
}
