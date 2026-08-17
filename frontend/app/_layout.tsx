import * as SecureStore from "expo-secure-store";
import {
    router,
    Stack,
    useRootNavigationState,
} from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import "./global.css";

const NATIVE_PAYMENT_RETURN_KEY = "zincy_pending_native_payment_return";
const PAYMENT_STATUS_PATH = "/client-setup/payment/payment-success";
const MAX_RECOVERY_AGE_MS = 24 * 60 * 60 * 1000;

type NativePaymentReturn = {
    paymentRecordId: number;
    createdAt: number;
    phase?: "CHECKOUT_OPEN" | "SUCCESS_CALLBACK";
    method?: "PHONEPE" | "CARD";
};

function validNativePaymentReturn(value: unknown): value is NativePaymentReturn {
    const marker = value as Partial<NativePaymentReturn> | null;
    return Boolean(
        marker &&
        Number.isInteger(marker.paymentRecordId) &&
        Number(marker.paymentRecordId) > 0 &&
        Number.isFinite(marker.createdAt) &&
        Number(marker.createdAt) > 0 &&
        Date.now() - Number(marker.createdAt) <= MAX_RECOVERY_AGE_MS &&
        (marker.phase == null ||
            marker.phase === "CHECKOUT_OPEN" ||
            marker.phase === "SUCCESS_CALLBACK") &&
        (marker.method == null ||
            marker.method === "PHONEPE" ||
            marker.method === "CARD"),
    );
}

export default function RootLayout() {
    const navigationState = useRootNavigationState();
    const initialRecoveryChecked = useRef(false);

    useEffect(() => {
        if (
            Platform.OS === "web" ||
            !navigationState?.key ||
            initialRecoveryChecked.current
        ) {
            return;
        }
        initialRecoveryChecked.current = true;

        let cancelled = false;

        void (async () => {
            let marker: NativePaymentReturn | null = null;

            try {
                const stored = await SecureStore.getItemAsync(
                    NATIVE_PAYMENT_RETURN_KEY,
                );
                const parsed = stored ? (JSON.parse(stored) as unknown) : null;

                if (validNativePaymentReturn(parsed)) {
                    marker = parsed;
                } else if (stored) {
                    await SecureStore.deleteItemAsync(NATIVE_PAYMENT_RETURN_KEY);
                }
            } catch {
                await SecureStore.deleteItemAsync(
                    NATIVE_PAYMENT_RETURN_KEY,
                ).catch(() => undefined);
            }

            if (!cancelled && marker) {
                router.replace({
                    pathname: PAYMENT_STATUS_PATH,
                    params: {
                        paymentRecordId: String(marker.paymentRecordId),
                        verifying: "1",
                        recovered: "1",
                        ...(marker.phase === "SUCCESS_CALLBACK"
                            ? { successEvidence: "1" }
                            : {}),
                        ...(marker.method === "PHONEPE"
                            ? { verificationMethod: "PHONEPE" }
                            : {}),
                    },
                });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navigationState?.key]);

    return <Stack screenOptions={{ headerShown: false }} />;
}
