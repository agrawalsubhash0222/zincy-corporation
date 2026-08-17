import { Platform } from "react-native";

export type PhonePeNativeOrder = {
    providerOrderId: string;
    phonePeSdkToken: string;
    phonePeMerchantId: string;
    phonePeEnvironment: "SANDBOX" | "PRODUCTION";
};

export type PhonePeSdkResult = {
    status?: string;
    error?: string;
};

type InstalledAndroidApp = {
    packageName?: string;
    applicationName?: string;
};

type PhonePeSdk = {
    init(
        environment: string,
        merchantId: string,
        flowId: string,
        enableLogging: boolean
    ): Promise<boolean>;
    startTransaction(
        request: string,
        appSchema: string | null
    ): Promise<PhonePeSdkResult>;
    getUpiAppsForAndroid?: () => Promise<unknown>;
    getUPIAppsInstalledforIos?: () => Promise<unknown>;
};

const ANDROID_PHONEPE_PACKAGES = {
    SANDBOX: "com.phonepe.simulator",
    PRODUCTION: "com.phonepe.app",
} as const;

function parseAndroidApps(value: unknown): InstalledAndroidApp[] {
    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function parseIosApps(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

function phonePeSetupError(environment: PhonePeNativeOrder["phonePeEnvironment"]): Error {
    if (environment === "SANDBOX") {
        return new Error(
            "PhonePe Test app is required for sandbox payments. " +
                "Install the official PhonePe simulator app (com.phonepe.simulator) " +
                "provided in your PhonePe merchant integration resources, then tap Resume PhonePe."
        );
    }

    return new Error(
        "PhonePe is not installed on this device. Install PhonePe and try again."
    );
}

async function resolveTargetApp(
    sdk: PhonePeSdk,
    environment: PhonePeNativeOrder["phonePeEnvironment"]
): Promise<string> {
    if (Platform.OS === "android") {
        const expectedPackage = ANDROID_PHONEPE_PACKAGES[environment];
        const installedApps = parseAndroidApps(
            await sdk.getUpiAppsForAndroid?.()
        );
        const installedPackages = new Set(
            installedApps
                .map((app) => app.packageName?.trim())
                .filter((value): value is string => Boolean(value))
        );

        // Never fall back to com.phonepe.app for a SANDBOX order. The real
        // PhonePe app briefly opens and immediately returns because it cannot
        // consume a sandbox SDK token.
        if (!installedPackages.has(expectedPackage)) {
            throw phonePeSetupError(environment);
        }

        return expectedPackage;
    }

    if (Platform.OS === "ios") {
        const installedApps = parseIosApps(
            await sdk.getUPIAppsInstalledforIos?.()
        );
        if (!installedApps.some((app) => app.toUpperCase() === "PHONEPE")) {
            throw phonePeSetupError(environment);
        }
        return "PHONEPE";
    }

    throw new Error("Native PhonePe checkout is supported only on Android and iOS.");
}

function createFlowId(providerOrderId: string): string {
    const normalizedOrderId = providerOrderId.replace(/[^a-zA-Z0-9]/g, "");
    return `zincy${normalizedOrderId}`.slice(0, 64);
}

function resultError(result: PhonePeSdkResult): string {
    const error = result.error?.trim();
    if (error) return error;

    const status = result.status?.trim();
    return status
        ? `PhonePe checkout returned ${status}.`
        : "PhonePe checkout was interrupted.";
}

/**
 * Opens PhonePe Standard Checkout for a native Android/iOS payment.
 *
 * SANDBOX deliberately targets com.phonepe.simulator. PRODUCTION deliberately
 * targets com.phonepe.app. This prevents a sandbox token from being sent to
 * the real PhonePe app, which otherwise appears only as a brief screen blink.
 *
 * The backend creates a Standard Checkout SDK order, so PhonePe requires the
 * documented PAY_PAGE payment mode. UPI_INTENT/PPE_INTENT are Custom Checkout
 * modes and must not be used unless PhonePe has separately enabled and
 * provisioned that product for the merchant.
 */
export async function openPhonePeNativeCheckout(
    order: PhonePeNativeOrder
): Promise<PhonePeSdkResult> {
    if (Platform.OS === "web") {
        throw new Error("Native PhonePe checkout cannot run in a web browser.");
    }

    const module = await import("react-native-phonepe-pg");
    const sdk = module.default as PhonePeSdk;

    const initialized = await sdk.init(
        order.phonePeEnvironment,
        order.phonePeMerchantId,
        createFlowId(order.providerOrderId),
        __DEV__
    );

    if (!initialized) {
        throw new Error("PhonePe SDK initialization failed.");
    }

    const targetApp = await resolveTargetApp(
        sdk,
        order.phonePeEnvironment
    );

    const request = JSON.stringify({
        orderId: order.providerOrderId,
        merchantId: order.phonePeMerchantId,
        token: order.phonePeSdkToken,
        paymentMode: {
            type: "PAY_PAGE",
        },
        ...(Platform.OS === "android"
            ? { targetAppPackageName: targetApp }
            : {}),
    });

    const result = await sdk.startTransaction(
        request,
        Platform.OS === "ios" ? "zincycorporation" : null
    );

    if (__DEV__) {
        console.log("PHONEPE SDK RESULT:", result);
    }

    if (result.status?.toUpperCase() !== "SUCCESS") {
        throw new Error(resultError(result));
    }

    // SUCCESS means the SDK flow returned normally. The caller must still use
    // the backend status endpoint as the source of truth for PAID/FAILED.
    return result;
}
