import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    InteractionManager,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    abandonPaymentAttempt,
    createPaymentOrder,
    getPaymentStatus,
    paymentErrorMessage,
    verifyRazorpayPayment,
} from "@/services/paymentService";
import { openRazorpayCardCheckout, RazorpaySuccess } from "@/utils/razorpayWeb";
import {
    openPhonePeNativeCheckout,
    PhonePeNativeOrder,
} from "@/utils/phonePeNative";

const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === "web";
const NATIVE_PAYMENT_RETURN_KEY = "zincy_pending_native_payment_return";
const webConstrained = isWeb
    ? {
        width: "100%" as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: "center" as const,
    }
    : {};

type ActivePaymentMethod = "PHONEPE" | "CARD";
type PaymentChoice = ActivePaymentMethod | "GOOGLE_PAY";
type NativePaymentReturnPhase = "CHECKOUT_OPEN" | "SUCCESS_CALLBACK";
type ActiveAttempt = {
    paymentRecordId: number;
    method: ActivePaymentMethod;
    checkoutUrl?: string;
    providerOrderId?: string;
    phonePeSdkToken?: string;
    phonePeMerchantId?: string;
    phonePeEnvironment?: "SANDBOX" | "PRODUCTION";
};

const OPTIONS: Array<{
    value: PaymentChoice;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
}> = [
        {
            value: "PHONEPE",
            title: "PhonePe",
            subtitle: "PhonePe Standard Checkout · UPI only",
            icon: "phone-portrait-outline",
        },
        {
            value: "CARD",
            title: "Credit / Debit Card",
            subtitle: "Secure card checkout powered by Razorpay",
            icon: "card-outline",
        },
        {
            value: "GOOGLE_PAY",
            title: "Google Pay",
            subtitle: "Coming soon",
            icon: "logo-google",
            disabled: true,
        },
    ];

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function createIdempotencyKey(): string {
    const cryptoValue = globalThis.crypto as
        { randomUUID?: () => string } | undefined;
    const random = cryptoValue?.randomUUID
        ? cryptoValue.randomUUID().replace(/-/g, "")
        : `${Date.now()}${Math.random().toString(36).slice(2)}`;

    return `pay_${random}`.slice(0, 64);
}

function wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function waitForNavigationCommit(): Promise<void> {
    return new Promise((resolve) => {
        InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
            });
        });
    });
}

async function rememberNativePaymentReturn(
    paymentRecordId: number,
    phase: NativePaymentReturnPhase = "CHECKOUT_OPEN",
    method: ActivePaymentMethod = "CARD",
) {
    if (isWeb) return;

    try {
        await SecureStore.setItemAsync(
            NATIVE_PAYMENT_RETURN_KEY,
            JSON.stringify({
                paymentRecordId,
                createdAt: Date.now(),
                phase,
                method,
            }),
        );
    } catch {
        // Checkout can still continue. The normal Razorpay callback remains the
        // primary path; this marker only recovers an Android activity restart.
    }
}

function validRazorpaySuccess(value: RazorpaySuccess | null): value is RazorpaySuccess {
    return Boolean(
        value &&
        typeof value.razorpay_order_id === "string" &&
        value.razorpay_order_id.trim() &&
        typeof value.razorpay_payment_id === "string" &&
        value.razorpay_payment_id.trim() &&
        typeof value.razorpay_signature === "string" &&
        value.razorpay_signature.trim(),
    );
}

function openPhonePeWebWindow(): Window | null {
    if (!isWeb || typeof window === "undefined") {
        return null;
    }

    return window.open(
        "about:blank",
        "zincy_phonepe_checkout",
        "popup=yes,width=520,height=760,resizable=yes,scrollbars=yes",
    );
}

function validAttempt(value: unknown): value is ActiveAttempt {
    const attempt = value as ActiveAttempt | null;
    return Boolean(
        attempt &&
        Number.isInteger(attempt.paymentRecordId) &&
        attempt.paymentRecordId > 0 &&
        (attempt.method === "PHONEPE" || attempt.method === "CARD"),
    );
}

function nativePhonePeOrder(
    attempt: ActiveAttempt,
): PhonePeNativeOrder | null {
    if (
        !attempt.providerOrderId ||
        !attempt.phonePeSdkToken ||
        !attempt.phonePeMerchantId ||
        !attempt.phonePeEnvironment
    ) {
        return null;
    }

    return {
        providerOrderId: attempt.providerOrderId,
        phonePeSdkToken: attempt.phonePeSdkToken,
        phonePeMerchantId: attempt.phonePeMerchantId,
        phonePeEnvironment: attempt.phonePeEnvironment,
    };
}

export default function PaymentScreen() {
    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
    }>();

    const onboardingRequestId = useMemo(() => {
        const value = Number(first(params.onboardingRequestId));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [params.onboardingRequestId]);

    const idempotencyKeys = useRef<Partial<Record<ActivePaymentMethod, string>>>(
        {},
    );
    const operationInFlight = useRef(false);
    const [selectedMethod, setSelectedMethod] =
        useState<ActivePaymentMethod>("PHONEPE");
    const [processing, setProcessing] = useState(false);
    const [restoringAttempt, setRestoringAttempt] = useState(false);
    const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(
        null,
    );
    const [showChangeMethodConfirm, setShowChangeMethodConfirm] = useState(false);

    const storageKey = onboardingRequestId
        ? `zincy_active_payment_${onboardingRequestId}`
        : null;

    const rememberAttempt = (attempt: ActiveAttempt | null) => {
        setActiveAttempt(attempt);
        if (!storageKey) return;

        if (!attempt && !isWeb) {
            void SecureStore.deleteItemAsync(NATIVE_PAYMENT_RETURN_KEY).catch(
                () => undefined,
            );
        }

        if (isWeb && typeof window !== "undefined") {
            if (attempt) {
                window.sessionStorage.setItem(storageKey, JSON.stringify(attempt));
            } else {
                window.sessionStorage.removeItem(storageKey);
            }
            return;
        }

        void (attempt
            ? SecureStore.setItemAsync(storageKey, JSON.stringify(attempt))
            : SecureStore.deleteItemAsync(storageKey)
        ).catch(() => {
            // State remains locked for safety even if device persistence fails.
        });
    };

    useEffect(() => {
        if (!storageKey) return;

        let cancelled = false;
        let requestInFlight = false;

        const readStoredAttempt = async () => {
            if (isWeb && typeof window !== "undefined") {
                return window.sessionStorage.getItem(storageKey);
            }
            return SecureStore.getItemAsync(storageKey);
        };

        const removeStoredAttempt = async () => {
            if (isWeb && typeof window !== "undefined") {
                window.sessionStorage.removeItem(storageKey);
                return;
            }
            await SecureStore.deleteItemAsync(storageKey);
        };

        const reconcileStoredAttempt = async () => {
            // Native gateways temporarily background the app. When Razorpay or
            // PhonePe returns, AppState becomes active before the awaited SDK
            // call has finished. The active gateway operation performs its own
            // verify/refresh below, so starting another status refresh here
            // would race the verification request and can produce an optimistic
            // locking error even though the payment was captured successfully.
            if (requestInFlight || operationInFlight.current) return;

            requestInFlight = true;
            if (!cancelled) setRestoringAttempt(true);

            let stored: string | null;
            try {
                stored = await readStoredAttempt();
            } catch {
                stored = null;
            }

            if (!stored) {
                if (!cancelled) {
                    setActiveAttempt(null);
                    setRestoringAttempt(false);
                }
                requestInFlight = false;
                return;
            }

            let attempt: ActiveAttempt;
            try {
                const parsed = JSON.parse(stored) as unknown;
                if (!validAttempt(parsed)) {
                    throw new Error("Invalid stored payment attempt");
                }
                attempt = parsed;
            } catch {
                await removeStoredAttempt();
                if (!cancelled) {
                    setActiveAttempt(null);
                    setRestoringAttempt(false);
                }
                requestInFlight = false;
                return;
            }

            try {
                const status = await getPaymentStatus(attempt.paymentRecordId, true);
                if (cancelled) return;

                if (status.terminal) {
                    await removeStoredAttempt();
                    setActiveAttempt(null);
                    idempotencyKeys.current = {};
                    router.replace({
                        pathname: "/client-setup/payment/payment-success",
                        params: {
                            paymentRecordId: String(status.id),
                        },
                    });
                    return;
                }

                setActiveAttempt(attempt);
                setSelectedMethod(attempt.method);
            } catch {
                if (cancelled) return;

                // Do not release an unverified attempt on a network failure;
                // that could permit two simultaneous gateway payments.
                setActiveAttempt(attempt);
                setSelectedMethod(attempt.method);
            } finally {
                requestInFlight = false;
                if (!cancelled) setRestoringAttempt(false);
            }
        };

        void reconcileStoredAttempt();

        const handlePageShow = () => void reconcileStoredAttempt();
        const handleFocus = () => void reconcileStoredAttempt();
        const appStateSubscription = !isWeb
            ? AppState.addEventListener("change", (state) => {
                if (state === "active") void reconcileStoredAttempt();
            })
            : null;

        if (isWeb && typeof window !== "undefined") {
            // Back/forward cache can restore this screen without remounting React.
            window.addEventListener("pageshow", handlePageShow);
            window.addEventListener("focus", handleFocus);
        }

        return () => {
            cancelled = true;
            appStateSubscription?.remove();
            if (isWeb && typeof window !== "undefined") {
                window.removeEventListener("pageshow", handlePageShow);
                window.removeEventListener("focus", handleFocus);
            }
        };
    }, [storageKey]);

    const goToStatus = (
        paymentRecordId: number,
        showVerification = false,
        preserveAttempt = false,
        verificationMethod?: ActivePaymentMethod,
    ) => {
        if (!preserveAttempt) {
            rememberAttempt(null);
        }
        router.replace({
            pathname: "/client-setup/payment/payment-success",
            params: {
                paymentRecordId: String(paymentRecordId),
                ...(showVerification
                    ? {
                        verifying: "1",
                        ready: "1",
                        ...(verificationMethod
                            ? { verificationMethod }
                            : {}),
                    }
                    : {}),
            },
        });
    };

    const returnToPaymentPage = (
        title: string,
        message: string,
        clearAttempt: boolean,
    ) => {
        if (clearAttempt) {
            rememberAttempt(null);
            delete idempotencyKeys.current.CARD;
        } else if (!isWeb) {
            // The gateway activity has already closed. Keep the protected
            // active attempt, but do not let RootLayout mistake a later app
            // resume for another Razorpay return.
            void SecureStore.deleteItemAsync(NATIVE_PAYMENT_RETURN_KEY).catch(
                () => undefined,
            );
        }

        router.replace({
            pathname: "/client-setup/payment/payment",
            params: {
                onboardingRequestId: String(onboardingRequestId),
            },
        });

        // Let the payment screen become visible before presenting the message.
        // This keeps a cancelled Razorpay activity from leaving the customer on
        // the verification route.
        setTimeout(() => Alert.alert(title, message), 250);
    };

    const cancelActiveAttempt = async () => {
        if (!activeAttempt || processing || operationInFlight.current) return;
        operationInFlight.current = true;
        try {
            setProcessing(true);
            const result = await abandonPaymentAttempt(activeAttempt.paymentRecordId);
            if (
                result.successful ||
                result.status === "REVIEW_REQUIRED" ||
                result.status === "REFUNDED"
            ) {
                setShowChangeMethodConfirm(false);
                goToStatus(result.id);
                return;
            }

            if (result.status === "FAILED" || result.status === "EXPIRED") {
                // The backend/provider has confirmed that this attempt can no
                // longer charge the customer. It is now safe to release the
                // local active-attempt lock and allow a different method.
                rememberAttempt(null);
                idempotencyKeys.current = {};
                setShowChangeMethodConfirm(false);
                return;
            }

            // Any CREATED/PENDING/provider-observed state is still uncertain.
            // Never unlock it here: doing so could allow a second payment while
            // the first one later captures. Show the protected status instead.
            setShowChangeMethodConfirm(false);
            goToStatus(
                result.id,
                !isWeb && activeAttempt.method === "CARD",
                true,
                activeAttempt.method,
            );
        } catch (error) {
            Alert.alert(
                "Unable to switch safely",
                paymentErrorMessage(
                    error,
                    "The gateway status could not be checked. Please try again.",
                ),
            );
        } finally {
            operationInFlight.current = false;
            setProcessing(false);
        }
    };

    const resumeActiveAttempt = async () => {
        if (!activeAttempt || processing || operationInFlight.current) return;
        operationInFlight.current = true;

        const phonePeWindow =
            isWeb && activeAttempt.method === "PHONEPE" && activeAttempt.checkoutUrl
                ? openPhonePeWebWindow()
                : null;

        if (
            isWeb &&
            activeAttempt.method === "PHONEPE" &&
            activeAttempt.checkoutUrl &&
            !phonePeWindow
        ) {
            Alert.alert(
                "Popup blocked",
                "Allow pop-ups for Zincy, then select Resume PhonePe again.",
            );
            operationInFlight.current = false;
            return;
        }

        try {
            setProcessing(true);
            const status = await getPaymentStatus(
                activeAttempt.paymentRecordId,
                true,
            );
            if (status.terminal) {
                phonePeWindow?.close();
                goToStatus(status.id);
                return;
            }

            if (activeAttempt.method === "PHONEPE") {
                if (Platform.OS === "web" && typeof window !== "undefined") {
                    if (!activeAttempt.checkoutUrl) {
                        throw new Error("PhonePe checkout URL is unavailable.");
                    }
                    if (!phonePeWindow) {
                        throw new Error("PhonePe checkout window is unavailable.");
                    }
                    phonePeWindow.location.replace(activeAttempt.checkoutUrl);
                    phonePeWindow.focus();
                    return;
                }

                const nativeOrder = nativePhonePeOrder(activeAttempt);
                if (!nativeOrder) {
                    throw new Error(
                        "PhonePe mobile checkout information is incomplete.",
                    );
                }
                await rememberNativePaymentReturn(
                    activeAttempt.paymentRecordId,
                    "CHECKOUT_OPEN",
                    "PHONEPE",
                );
                await openPhonePeNativeCheckout(nativeOrder);
                const refreshed = await getPaymentStatus(
                    activeAttempt.paymentRecordId,
                    true,
                );
                if (refreshed.terminal) {
                    goToStatus(refreshed.id);
                } else {
                    goToStatus(refreshed.id, true, true, "PHONEPE");
                }
                return;
            }

            // The existing card attempt is still non-terminal. Show the
            // dedicated status screen instead of a modal on the payment-method
            // page. This keeps the attempt protected while giving the customer
            // an explicit AWAITING/PENDING status and a safe re-check action.
            goToStatus(
                activeAttempt.paymentRecordId,
                !isWeb,
                true,
                "CARD",
            );
        } catch (error) {
            phonePeWindow?.close();

            if (activeAttempt.method === "PHONEPE") {
                try {
                    const refreshed = await getPaymentStatus(
                        activeAttempt.paymentRecordId,
                        true,
                    );
                    if (refreshed.terminal) {
                        goToStatus(refreshed.id);
                        return;
                    }
                } catch {
                    // Keep the existing attempt locked when the provider cannot
                    // be reached. A second order would risk a duplicate charge.
                }

                Alert.alert(
                    "PhonePe payment not completed",
                    "PhonePe did not confirm a final result. The current attempt remains protected; check its status or safely change the payment method.",
                );
                return;
            }

            Alert.alert(
                "Unable to check payment",
                paymentErrorMessage(
                    error,
                    "The payment status could not be checked. Please try again.",
                ),
            );
        } finally {
            operationInFlight.current = false;
            setProcessing(false);
        }
    };

    const openCardCheckout = async (
        order: Awaited<ReturnType<typeof createPaymentOrder>>,
    ): Promise<RazorpaySuccess | null> => {
        if (!order.publicKey || !order.providerOrderId) {
            throw new Error("Card checkout information is incomplete.");
        }

        if (Platform.OS === "web") {
            return openRazorpayCardCheckout({
                key: order.publicKey,
                orderId: order.providerOrderId,
                amountPaise: order.amountPaise,
                currency: order.currency,
                businessName: order.businessName,
                description: order.description,
            });
        }

        const imported = await import("react-native-razorpay");
        const checkout = (imported.default ?? imported) as {
            open?: (options: Record<string, unknown>) => Promise<RazorpaySuccess>;
        };

        if (typeof checkout.open !== "function") {
            throw new Error(
                "Card checkout is not installed in this app build. Rebuild the development app after installing react-native-razorpay.",
            );
        }

        return checkout.open({
            key: order.publicKey,
            order_id: order.providerOrderId,
            amount: order.amountPaise,
            currency: order.currency,
            name: order.businessName,
            description: order.description,
            theme: { color: "#0EA5E9" },
            // Each retry must create a fresh Zincy payment record and a fresh
            // Razorpay order. Reusing this order after the backend marks its
            // record FAILED would make the audit trail ambiguous.
            retry: { enabled: false },
            method: {
                card: true,
                upi: false,
                netbanking: false,
                wallet: false,
                emi: false,
                paylater: false,
            },
        });
    };

    const startPayment = async () => {
        if (!onboardingRequestId || processing || operationInFlight.current) {
            return;
        }
        operationInFlight.current = true;

        const phonePeWindow =
            isWeb && selectedMethod === "PHONEPE" ? openPhonePeWebWindow() : null;

        if (isWeb && selectedMethod === "PHONEPE" && !phonePeWindow) {
            Alert.alert(
                "Popup blocked",
                "Allow pop-ups for Zincy, then select Continue Securely again.",
            );
            operationInFlight.current = false;
            return;
        }

        let activeOrder: Awaited<ReturnType<typeof createPaymentOrder>> | null =
            null;
        let cardSuccessCallbackReceived = false;
        try {
            setProcessing(true);
            const idempotencyKey =
                idempotencyKeys.current[selectedMethod] || createIdempotencyKey();
            idempotencyKeys.current[selectedMethod] = idempotencyKey;

            const order = await createPaymentOrder(
                onboardingRequestId,
                selectedMethod,
                idempotencyKey,
                isWeb ? "WEB" : "NATIVE",
            );
            activeOrder = order;
            rememberAttempt({
                paymentRecordId: order.paymentRecordId,
                method: selectedMethod,
                checkoutUrl:
                    selectedMethod === "PHONEPE" ? order.checkoutUrl : undefined,
                providerOrderId:
                    selectedMethod === "PHONEPE"
                        ? order.providerOrderId
                        : undefined,
                phonePeSdkToken: order.phonePeSdkToken,
                phonePeMerchantId: order.phonePeMerchantId,
                phonePeEnvironment: order.phonePeEnvironment,
            });

            if (selectedMethod === "PHONEPE") {
                if (Platform.OS === "web" && typeof window !== "undefined") {
                    if (!order.checkoutUrl) {
                        throw new Error("PhonePe checkout URL is unavailable.");
                    }
                    if (!phonePeWindow) {
                        throw new Error("PhonePe checkout window is unavailable.");
                    }
                    phonePeWindow.location.replace(order.checkoutUrl);
                    phonePeWindow.focus();
                    return;
                }

                if (
                    !order.providerOrderId ||
                    !order.phonePeSdkToken ||
                    !order.phonePeMerchantId ||
                    !order.phonePeEnvironment
                ) {
                    throw new Error(
                        "PhonePe mobile checkout information is incomplete.",
                    );
                }
                await rememberNativePaymentReturn(
                    order.paymentRecordId,
                    "CHECKOUT_OPEN",
                    "PHONEPE",
                );
                await openPhonePeNativeCheckout({
                    providerOrderId: order.providerOrderId,
                    phonePeSdkToken: order.phonePeSdkToken,
                    phonePeMerchantId: order.phonePeMerchantId,
                    phonePeEnvironment: order.phonePeEnvironment,
                });
                const status = await getPaymentStatus(order.paymentRecordId, true);
                if (status.terminal) {
                    goToStatus(status.id);
                } else {
                    goToStatus(status.id, true, true, "PHONEPE");
                }
                return;
            }

            // Put the verification route underneath the native Razorpay
            // activity before opening it. When Razorpay closes, Android/iOS now
            // reveals "Verifying payment" instead of flashing this method page.
            // The persisted marker also recovers this route if Android recreates
            // the React Native activity while the bank/app flow is open.
            await rememberNativePaymentReturn(order.paymentRecordId);
            if (!isWeb) {
                router.replace({
                    pathname: "/client-setup/payment/payment-success",
                    params: {
                        paymentRecordId: String(order.paymentRecordId),
                        verifying: "1",
                    },
                });
                await waitForNavigationCommit();
            }

            const result = await openCardCheckout(order);
            if (!result) {
                // Recover securely when Razorpay closes its web modal without
                // invoking the success handler. The backend asks Razorpay for
                // payments linked to our stored provider order and validates
                // order, amount, currency and payment method.
                for (let attempt = 0; attempt < 4; attempt += 1) {
                    const reconciled = await getPaymentStatus(
                        order.paymentRecordId,
                        true,
                    );

                    if (reconciled.providerPaymentId) {
                        goToStatus(
                            reconciled.id,
                            !isWeb,
                            !reconciled.terminal,
                        );
                        return;
                    }

                    if (attempt < 3) {
                        await wait(750);
                    }
                }

                const abandoned = await abandonPaymentAttempt(
                    order.paymentRecordId,
                    { customerCancelled: true },
                );
                if (abandoned.status !== "EXPIRED" && abandoned.terminal) {
                    goToStatus(abandoned.id, !isWeb);
                    return;
                }

                if (abandoned.status === "EXPIRED") {
                    rememberAttempt(null);
                    delete idempotencyKeys.current.CARD;
                    Alert.alert(
                        "Card payment cancelled",
                        "No payment was completed. You can choose a payment method and try again.",
                    );
                    return;
                }

                // Razorpay did not confirm a terminal result. Do not call this
                // a cancellation and do not return to the method-selection page.
                // The payment may still succeed later, so keep the stored attempt
                // and move to the protected verification/status screen.
                goToStatus(order.paymentRecordId, !isWeb, true, "CARD");
                return;
            }

            // A resolved Razorpay checkout is evidence that the customer
            // completed the gateway flow. From this point onward, a malformed
            // callback or a verification/network failure is an UNKNOWN result,
            // never a cancellation. Keep the attempt locked and let the status
            // route reconcile directly with Razorpay.
            cardSuccessCallbackReceived = true;
            await rememberNativePaymentReturn(
                order.paymentRecordId,
                "SUCCESS_CALLBACK",
            );

            if (!validRazorpaySuccess(result)) {
                goToStatus(order.paymentRecordId, !isWeb, true);
                return;
            }

            const verified = await verifyRazorpayPayment({
                paymentRecordId: order.paymentRecordId,
                razorpayOrderId: result.razorpay_order_id,
                razorpayPaymentId: result.razorpay_payment_id,
                razorpaySignature: result.razorpay_signature,
            });

            goToStatus(verified.id, !isWeb, !verified.terminal);
        } catch (error) {
            phonePeWindow?.close();

            // Never discard the key after an uncertain create-order response.
            // Reusing it makes a retry return the same backend record instead
            // of creating a second payable gateway order.

            if (
                selectedMethod === "CARD" &&
                activeOrder &&
                cardSuccessCallbackReceived
            ) {
                goToStatus(activeOrder.paymentRecordId, !isWeb, true);
                return;
            }

            // Native Razorpay rejects its promise when the customer presses the
            // Android/iOS Back button. Do not expose that SDK error object. The
            // abandon endpoint first checks Razorpay for a capture, then safely
            // releases only an unpaid order. A provider/network error keeps the
            // stored attempt locked so a second payment cannot be created.
            if (selectedMethod === "CARD" && activeOrder) {
                try {
                    // Any native Razorpay rejection before a success callback is
                    // treated as a request to close/reconcile the checkout, NOT as
                    // proof that the payment failed. The backend is authoritative:
                    // it refreshes Razorpay first and only expires the attempt when
                    // no captured/authorized/failed payment exists. If the device is
                    // offline, this request fails and the catch below keeps the
                    // attempt protected on the status screen.
                    const reconciled = await abandonPaymentAttempt(
                        activeOrder.paymentRecordId,
                        { customerCancelled: true },
                    );

                    if (reconciled.status === "EXPIRED") {
                        returnToPaymentPage(
                            "Card payment cancelled",
                            "No payment was completed. You can choose a payment method and try again.",
                            true,
                        );
                        return;
                    }

                    if (reconciled.terminal) {
                        goToStatus(reconciled.id, !isWeb);
                        return;
                    }

                    // Provider state is still non-terminal. Keep the same
                    // payment locked and let the status screen continue checking.
                    goToStatus(reconciled.id, !isWeb, true, "CARD");
                    return;
                } catch {
                    // Network/backend failure while trying to reconcile a rejected
                    // Razorpay promise is an UNKNOWN payment result, not a confirmed
                    // cancellation. The gateway may already have accepted SUCCESS or
                    // FAILURE. Preserve the attempt to prevent a duplicate charge.
                    goToStatus(
                        activeOrder.paymentRecordId,
                        !isWeb,
                        true,
                        "CARD",
                    );
                    return;
                }
            }

            if (selectedMethod === "PHONEPE" && activeOrder) {
                try {
                    const reconciled = await getPaymentStatus(
                        activeOrder.paymentRecordId,
                        true,
                    );
                    if (reconciled.terminal) {
                        goToStatus(reconciled.id);
                        return;
                    }
                } catch {
                    // The protected active attempt remains in storage. Do not
                    // expose provider internals or create another order.
                }

                Alert.alert(
                    "PhonePe payment not completed",
                    "PhonePe did not confirm a final result. The current attempt remains protected; check its status or safely change the payment method.",
                );
                return;
            }

            Alert.alert(
                "Payment not completed",
                paymentErrorMessage(error, "Payment was not completed."),
            );
        } finally {
            operationInFlight.current = false;
            setProcessing(false);
        }
    };

    const handleBack = () => {
        if (processing || restoringAttempt) {
            return;
        }

        if (activeAttempt) {
            Alert.alert(
                'Payment in progress',
                'Complete the current payment or use Change payment method before leaving this page.'
            );
            return;
        }

        if (!onboardingRequestId) {
            router.replace('/(website)');
            return;
        }

        router.replace({
            pathname: '/client-setup/payment/checkout',
            params: {
                onboardingRequestId: String(onboardingRequestId),
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <TouchableOpacity
                        onPress={handleBack}
                        disabled={processing || restoringAttempt}
                        style={styles.iconButton}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.title}>Choose payment method</Text>
                        <Text style={styles.subtitle}>
                            Choose PhonePe UPI or card payment
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.secureBox}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#0284C7" />
                    <Text style={styles.secureText}>
                        Payment details are entered only on the selected gateway. Zincy
                        never stores card numbers, CVV, OTP, or UPI PIN.
                    </Text>
                </View>

                {activeAttempt && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressIcon}>
                            <Ionicons name="time-outline" size={22} color="#0369A1" />
                        </View>
                        <View style={styles.progressContent}>
                            <Text style={styles.progressTitle}>
                                {activeAttempt.method === "PHONEPE"
                                    ? "PhonePe payment in progress"
                                    : "Card payment in progress"}
                            </Text>
                            <Text style={styles.progressText}>
                                Complete the current payment, or safely switch to another
                                method.
                            </Text>
                            <TouchableOpacity
                                disabled={processing}
                                onPress={() => setShowChangeMethodConfirm(true)}
                            >
                                <Text style={styles.changeMethodText}>
                                    Change payment method
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionLabel}>PAY USING</Text>

                {OPTIONS.map((option) => {
                    const selected = option.value === selectedMethod;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            disabled={
                                option.disabled ||
                                processing ||
                                restoringAttempt ||
                                Boolean(activeAttempt)
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                setSelectedMethod(option.value as ActivePaymentMethod)
                            }
                            style={[
                                styles.option,
                                selected && styles.optionSelected,
                                option.disabled && styles.optionDisabled,
                                activeAttempt &&
                                option.value !== activeAttempt.method &&
                                styles.optionLocked,
                            ]}
                        >
                            <View
                                style={[
                                    styles.optionIcon,
                                    selected && styles.optionIconSelected,
                                ]}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={22}
                                    color={selected ? "#0284C7" : "#475569"}
                                />
                            </View>

                            <View style={styles.optionText}>
                                <View style={styles.optionTitleRow}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    {option.disabled && (
                                        <Text style={styles.comingSoonBadge}>COMING SOON</Text>
                                    )}
                                </View>
                                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                            </View>

                            {!option.disabled && (
                                <Ionicons
                                    name={selected ? "radio-button-on" : "radio-button-off"}
                                    size={22}
                                    color={selected ? "#0EA5E9" : "#94A3B8"}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    <TouchableOpacity
                        disabled={processing || restoringAttempt || !onboardingRequestId}
                        activeOpacity={0.85}
                        onPress={activeAttempt ? resumeActiveAttempt : startPayment}
                        style={[
                            styles.payButton,
                            (processing || restoringAttempt || !onboardingRequestId) &&
                            styles.payButtonDisabled,
                        ]}
                    >
                        {processing || restoringAttempt ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.payButtonText}>
                                    {activeAttempt
                                        ? activeAttempt.method === "PHONEPE"
                                            ? "Resume PhonePe"
                                            : "Check Payment Status"
                                        : "Continue Securely"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showChangeMethodConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowChangeMethodConfirm(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIcon}>
                            <Ionicons
                                name="swap-horizontal-outline"
                                size={24}
                                color="#0284C7"
                            />
                        </View>
                        <Text style={styles.modalTitle}>Change payment method?</Text>
                        <Text style={styles.modalText}>
                            We’ll safely close the current gateway attempt before starting
                            another payment.
                        </Text>

                        <TouchableOpacity
                            disabled={processing}
                            onPress={cancelActiveAttempt}
                            style={styles.modalPrimaryButton}
                        >
                            {processing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.modalPrimaryText}>Change method</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            disabled={processing}
                            onPress={() => setShowChangeMethodConfirm(false)}
                            style={styles.modalSecondaryButton}
                        >
                            <Text style={styles.modalSecondaryText}>
                                Continue current payment
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        width: "100%",
    },
    headerInner: {
        minHeight: 72,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        ...webConstrained,
    },
    iconButton: {
        width: 40,
        height: 40,
        marginRight: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: { flex: 1 },
    title: { fontSize: 20, lineHeight: 24, fontWeight: "900", color: "#0F172A" },
    subtitle: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        color: "#64748B",
    },
    content: { padding: 18, paddingBottom: 120, ...webConstrained },
    secureBox: {
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#E0F2FE",
        flexDirection: "row",
        alignItems: "flex-start",
    },
    secureText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "700",
        color: "#075985",
    },
    sectionLabel: {
        marginTop: 24,
        marginBottom: 10,
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.8,
        fontWeight: "900",
        color: "#64748B",
    },
    option: {
        minHeight: 74,
        marginBottom: 11,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
    },
    optionSelected: { borderColor: "#38BDF8", backgroundColor: "#F0F9FF" },
    optionDisabled: { opacity: 0.58, backgroundColor: "#F8FAFC" },
    optionLocked: { opacity: 0.48 },
    optionIcon: {
        width: 42,
        height: 42,
        marginRight: 12,
        borderRadius: 13,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    optionIconSelected: { backgroundColor: "#E0F2FE" },
    optionText: { flex: 1 },
    optionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    optionTitle: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "900",
        color: "#0F172A",
    },
    comingSoonBadge: {
        marginLeft: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#E2E8F0",
        color: "#475569",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "900",
    },
    optionSubtitle: {
        marginTop: 3,
        fontSize: 11.5,
        lineHeight: 15,
        fontWeight: "600",
        color: "#64748B",
    },
    progressCard: {
        marginTop: 16,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#BAE6FD",
        backgroundColor: "#F0F9FF",
        flexDirection: "row",
        alignItems: "flex-start",
    },
    progressIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: "#E0F2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    progressContent: { flex: 1, marginLeft: 12 },
    progressTitle: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "900",
        color: "#0F172A",
    },
    progressText: {
        marginTop: 3,
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: "600",
        color: "#475569",
    },
    changeMethodText: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: "900",
        color: "#0369A1",
    },
    modalBackdrop: {
        flex: 1,
        padding: 20,
        backgroundColor: "rgba(15, 23, 42, 0.56)",
        alignItems: "center",
        justifyContent: "center",
    },
    modalCard: {
        width: "100%",
        maxWidth: 420,
        padding: 22,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
    },
    modalIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#E0F2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        marginTop: 16,
        fontSize: 19,
        lineHeight: 24,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
    },
    modalText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: "600",
        color: "#64748B",
        textAlign: "center",
    },
    modalPrimaryButton: {
        width: "100%",
        minHeight: 50,
        marginTop: 22,
        borderRadius: 15,
        backgroundColor: "#0EA5E9",
        alignItems: "center",
        justifyContent: "center",
    },
    modalPrimaryText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    modalSecondaryButton: {
        minHeight: 44,
        marginTop: 6,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    modalSecondaryText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "800",
        color: "#475569",
    },
    footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        width: "100%",
    },
    footerInner: { padding: 18, ...webConstrained },
    payButton: {
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: "#0EA5E9",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    payButtonDisabled: { opacity: 0.55 },
    payButtonText: {
        marginLeft: 9,
        fontSize: 15,
        lineHeight: 19,
        fontWeight: "900",
        color: "#FFFFFF",
    },
});
