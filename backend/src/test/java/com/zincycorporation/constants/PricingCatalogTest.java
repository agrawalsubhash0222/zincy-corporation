package com.zincycorporation.constants;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.zincycorporation.enums.BillingType;
import com.zincycorporation.enums.MaintenanceBillingType;
import com.zincycorporation.enums.MaintenanceType;

class PricingCatalogTest {

    @Test
    void resolvesMonthlyAndYearlyServerPrices() {
        assertEquals(
                new BigDecimal("799.00"),
                ServerPricingCatalog.resolve(
                        "Hostinger VPS",
                        BillingType.MONTHLY));

        assertEquals(
                new BigDecimal("8629.00"),
                ServerPricingCatalog.resolve(
                        "Hostinger VPS",
                        BillingType.YEARLY));

        assertEquals(
                new BigDecimal("28069.00"),
                ServerPricingCatalog.resolve(
                        "AWS",
                        BillingType.YEARLY));
    }

    @Test
    void rejectsClientInventedServerPlans() {
        assertThrows(
                IllegalArgumentException.class,
                () -> ServerPricingCatalog.resolve(
                        "Attacker Plan",
                        BillingType.MONTHLY));
    }

    @Test
    void resolvesMaintenancePrices() {
        assertEquals(
                new BigDecimal("499.00"),
                MaintenancePricingCatalog.resolve(
                        MaintenanceType.ZINCY_MANAGED,
                        MaintenanceBillingType.MONTHLY));

        assertEquals(
                new BigDecimal("5389.00"),
                MaintenancePricingCatalog.resolve(
                        MaintenanceType.ZINCY_MANAGED,
                        MaintenanceBillingType.YEARLY));

        assertEquals(
                new BigDecimal("0.00"),
                MaintenancePricingCatalog.resolve(
                        MaintenanceType.CLIENT_MANAGED,
                        MaintenanceBillingType.NA));
    }
}
