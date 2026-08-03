package com.zincycorporation.constants;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;

public final class MaintenancePricingCatalog {

    private static final BigDecimal MONTHLY_PRICE =
            new BigDecimal("499.00");
    private static final BigDecimal TWELVE = new BigDecimal("12");
    private static final BigDecimal YEARLY_DISCOUNT_MULTIPLIER =
            new BigDecimal("0.90");

    private MaintenancePricingCatalog() {
    }

    public static BigDecimal resolve(
            MaintenanceType maintenanceType,
            MaintenanceBillingType billingType) {
        if (maintenanceType == null) {
            throw new IllegalArgumentException("maintenanceType is required");
        }

        if (maintenanceType != MaintenanceType.ZINCY_MANAGED) {
            return BigDecimal.ZERO.setScale(2);
        }

        if (billingType == null
                || billingType == MaintenanceBillingType.NA) {
            throw new IllegalArgumentException(
                    "Monthly or yearly billing is required for Zincy Managed Maintenance");
        }

        if (billingType == MaintenanceBillingType.MONTHLY) {
            return MONTHLY_PRICE;
        }

        return MONTHLY_PRICE
                .multiply(TWELVE)
                .multiply(YEARLY_DISCOUNT_MULTIPLIER)
                .setScale(0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.UNNECESSARY);
    }
}
