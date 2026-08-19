import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    abandonPaymentAttempt,
    getPaymentStatus,
    paymentErrorMessage,
    paymentFailureMessage,
    PaymentResponse,
} from "@/services/paymentService";

const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 2000;
const NATIVE_PAYMENT_RETURN_KEY = "zincy_pending_native_payment_return";

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatAmount(amount: number, currency: string) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            minimumFractionDigits: 2,
        }).format(safeAmount);
    } catch {
        return `₹${safeAmount.toFixed(2)}`;
    }
}

export default function PaymentSuccessScreen() {
    const params = useLocalSearchParams<{
        paymentRecordId?: string | string[];
        appReturn?: string | string[];
        verifying?: string | string[];
        ready?: string | string[];
        recovered?: string | string[];
        successEvidence?: string | string[];
        verificationMethod?: string | string[];
    }>();

    const paymentRecordId = useMemo(() => {
        const value = Number(first(params.paymentRecordId));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [params.paymentRecordId]);

    const shouldReturnToApp =
        Platform.OS === "web" && first(params.appReturn) === "1";
    const isNativeCardVerification =
        Platform.OS !== "web" &&
        first(params.verifying) === "1" &&
        first(params.verificationMethod) !== "PHONEPE";
    const isNativePhonePeVerification =
        Platform.OS !== "web" &&
        first(params.verifying) === "1" &&
        first(params.verificationMethod) === "PHONEPE";
    const isRecoveredNativeCardAttempt =
        isNativeCardVerification && first(params.recovered) === "1";
    const recoveredWithSuccessEvidence =
        isRecoveredNativeCardAttempt && first(params.successEvidence) === "1";
    const canCheckNativeCardImmediately =
        first(params.ready) === "1" || first(params.recovered) === "1";
    const nativeReturnUrl = paymentRecordId
        ? `zincycorporation://client-setup/payment/payment-success?paymentRecordId=${encodeURIComponent(String(paymentRecordId))}`
        : "zincycorporation://";

    const [payment, setPayment] = useState<PaymentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelRetrySeconds, setCancelRetrySeconds] = useState(0);
    const [cancellingAttempt, setCancellingAttempt] = useState(false);
    const [verificationDelayComplete, setVerificationDelayComplete] =
        useState(!isNativeCardVerification);
    const [verificationPollingComplete, setVerificationPollingComplete] =
        useState(false);
    const [nativeGatewayReturned, setNativeGatewayReturned] = useState(
        canCheckNativeCardImmediately,
    );
    const checkInFlight = useRef(false);

    useEffect(() => {
        if (!isNativeCardVerification) {
            setVerificationDelayComplete(true);
            return;
        }

        setVerificationDelayComplete(false);
        const timer = setTimeout(() => {
            setVerificationDelayComplete(true);
        }, 900);

        return () => clearTimeout(timer);
    }, [
        canCheckNativeCardImmediately,
        isNativeCardVerification,
        paymentRecordId,
    ]);

    useEffect(() => {
        if (canCheckNativeCardImmediately) {
            setNativeGatewayReturned(true);
        }
    }, [canCheckNativeCardImmediately]);

    const checkPayment = useCallback(
        async (poll: boolean) => {
            if (checkInFlight.current) return;

            if (!paymentRecordId) {
                setError("Invalid payment reference.");
                setLoading(false);
                return;
            }

            checkInFlight.current = true;
            setVerificationPollingComplete(false);
            setLoading(true);
            setError("");

            try {
                const attempts = poll ? POLL_ATTEMPTS : 1;

                for (let attempt = 0; attempt < attempts; attempt += 1) {
                    const result = await getPaymentStatus(paymentRecordId, true);

                    setPayment(result);

                    if (result.terminal || !poll) {
                        break;
                    }

                    await wait(POLL_DELAY_MS);
                }
            } catch (value) {
                setError(
                    paymentErrorMessage(value, "Unable to verify payment status."),
                );
            } finally {
                checkInFlight.current = false;
                setVerificationPollingComplete(true);
                setLoading(false);
            }
        },
        [paymentRecordId],
    );

    const reconcileRecoveredCardAttempt = useCallback(async () => {
        if (checkInFlight.current) return;

        if (!paymentRecordId) {
            setError("Invalid payment reference.");
            setLoading(false);
            return;
        }

        checkInFlight.current = true;
        setVerificationPollingComplete(false);
        setLoading(true);
        setError("");

        try {
            // The native Razorpay activity disappeared before its promise could
            // finish (for example, the customer closed checkout and later
            // reopened Zincy). The abandon endpoint first asks Razorpay for the
            // authoritative order state. It returns a captured/failed result
            // when one exists and expires only an order with no completed
            // payment. Provider/network uncertainty throws and leaves the
            // attempt protected against a duplicate charge.
            const result = await abandonPaymentAttempt(paymentRecordId);
            setPayment(result);
        } catch (value) {
            setError(
                paymentErrorMessage(
                    value,
                    "Unable to confirm whether the card payment was cancelled.",
                ),
            );
        } finally {
            checkInFlight.current = false;
            setVerificationPollingComplete(true);
            setLoading(false);
        }
    }, [paymentRecordId]);

    // PhonePe must redirect to an HTTPS merchant page. For a native checkout,
    // that page is only a bridge: reopen the installed Zincy development/
    // production build, where the authenticated app verifies the payment.
    useEffect(() => {
        if (!shouldReturnToApp || typeof window === "undefined") return;
        window.location.replace(nativeReturnUrl);
    }, [nativeReturnUrl, shouldReturnToApp]);

    useEffect(() => {
        if (shouldReturnToApp) {
            setLoading(false);
            return;
        }

        // This route is deliberately rendered underneath the native Razorpay
        // activity. Do not poll while checkout is open; the Razorpay success or
        // failure handler owns the provider update during that time.
        if (isNativeCardVerification && !canCheckNativeCardImmediately) {
            return;
        }

        let active = true;

        void (async () => {
            if (active) {
                if (
                    isRecoveredNativeCardAttempt &&
                    !recoveredWithSuccessEvidence
                ) {
                    // If the native gateway activity is still covering Zincy,
                    // wait for the app to become active. Abandoning underneath
                    // a live checkout could incorrectly terminate an order the
                    // customer is still completing.
                    if (AppState.currentState === "active") {
                        await reconcileRecoveredCardAttempt();
                    }
                } else {
                    await checkPayment(true);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [
        canCheckNativeCardImmediately,
        checkPayment,
        isNativeCardVerification,
        isRecoveredNativeCardAttempt,
        recoveredWithSuccessEvidence,
        reconcileRecoveredCardAttempt,
        shouldReturnToApp,
    ]);

    useEffect(() => {
        if (Platform.OS === "web" || shouldReturnToApp) return;

        let refreshTimer: ReturnType<typeof setTimeout> | null = null;
        let verificationTimer: ReturnType<typeof setTimeout> | null = null;
        let sawGatewayBackground = false;
        const subscription = AppState.addEventListener("change", (state) => {
            if (state !== "active") {
                sawGatewayBackground = true;
                return;
            }

            // Ignore unrelated active events until this mounted route has
            // actually been covered by a native gateway activity.
            if (isNativeCardVerification && !sawGatewayBackground) return;

            if (isNativeCardVerification) {
                setNativeGatewayReturned(true);
                setVerificationDelayComplete(false);
                setVerificationPollingComplete(false);
                verificationTimer = setTimeout(
                    () => setVerificationDelayComplete(true),
                    900,
                );

                // The still-running payment screen owns Razorpay verification.
                // It will mark this route ready after verify/abandon completes.
                // A reconstructed route uses recovered=1 and may poll directly.
                if (!canCheckNativeCardImmediately) return;
            }

            // Let the Razorpay promise/verification request finish first. This
            // avoids racing the backend verification with a status refresh.
            refreshTimer = setTimeout(() => {
                if (
                    isRecoveredNativeCardAttempt &&
                    !recoveredWithSuccessEvidence
                ) {
                    void reconcileRecoveredCardAttempt();
                } else {
                    void checkPayment(true);
                }
            }, 1500);
        });

        return () => {
            subscription.remove();
            if (refreshTimer) clearTimeout(refreshTimer);
            if (verificationTimer) clearTimeout(verificationTimer);
        };
    }, [
        canCheckNativeCardImmediately,
        checkPayment,
        isNativeCardVerification,
        isRecoveredNativeCardAttempt,
        recoveredWithSuccessEvidence,
        reconcileRecoveredCardAttempt,
        shouldReturnToApp,
    ]);

    useEffect(() => {
        if (!payment?.terminal) return;
        const storageKey = `zincy_active_payment_${payment.onboardingRequestId}`;

        if (Platform.OS === "web" && typeof window !== "undefined") {
            window.sessionStorage.removeItem(storageKey);
            return;
        }

        void Promise.all([
            SecureStore.deleteItemAsync(storageKey),
            SecureStore.deleteItemAsync(NATIVE_PAYMENT_RETURN_KEY),
        ]).catch(() => {
            // The result screen is still valid; cleanup will be retried when
            // the payment page next reconciles its stored attempt.
        });

    }, [payment?.onboardingRequestId, payment?.terminal]);

    useEffect(() => {
        const remaining = Math.max(0, payment?.cancelRetrySecondsRemaining ?? 0);
        setCancelRetrySeconds(remaining);

        if (!payment || payment.terminal || remaining <= 0) return;

        const timer = setInterval(() => {
            setCancelRetrySeconds((current) => Math.max(0, current - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [payment?.id, payment?.terminal, payment?.cancelRetrySecondsRemaining]);

    const refundCompleted = payment?.refundStatus === "COMPLETED";

    const refundNeedsAttention =
        payment?.refundStatus === "FAILED" ||
        payment?.refundStatus === "REVIEW_REQUIRED";

    const refundPending = payment?.refundInProgress === true;
    const customerCancelled =
        payment?.providerState === "ABANDONED_BY_CUSTOMER";
    const successful = payment?.successful === true;
    const pending = payment != null && !payment.terminal && !refundPending;

    // A request/verification failure is not the same thing as a failed payment.
    // If we have a valid local payment reference but no authoritative response
    // from the backend, keep the attempt protected and present the state as
    // temporarily unverifiable. The customer must not be encouraged to pay again.
    const unableToVerify = Boolean(
        !loading &&
        !payment &&
        error &&
        paymentRecordId !== null,
    );

    const positive = successful || refundCompleted;
    const warning = pending || refundPending || unableToVerify;

    const canTryAnotherPayment = Boolean(
        payment &&
        payment.terminal &&
        !payment.successful &&
        !payment.refundStatus &&
        (payment.status === "FAILED" || payment.status === "EXPIRED"),
    );

    const showCancelRetry = Boolean(
        payment &&
        pending &&
        payment.provider === "RAZORPAY" &&
        payment.paymentMethod === "CARD" &&
        payment.providerState?.toLowerCase() === "created",
    );
    const cancelRetryWindowElapsed = Boolean(
        payment?.cancelRetryAllowed ||
        cancelRetrySeconds <= 0
    );

    const cancelRetryEnabled = Boolean(
        showCancelRetry &&
        cancelRetryWindowElapsed &&
        !loading &&
        !cancellingAttempt
    );

    const cancelRetryLabel = !cancelRetryWindowElapsed
        ? `Cancel & retry available in ${String(
            Math.floor(cancelRetrySeconds / 60)
        ).padStart(2, "0")}:${String(
            cancelRetrySeconds % 60
        ).padStart(2, "0")}`
        : loading
            ? "Finishing payment status check..."
            : "Cancel this attempt & choose another payment";


    const cancelAndChooseAnother = async () => {
        if (!payment || !cancelRetryEnabled || cancellingAttempt) return;

        setCancellingAttempt(true);
        setError("");
        try {
            // The backend performs a fresh Razorpay check before releasing the
            // attempt. The countdown is UX only; this server check is the safety gate.
            const result = await abandonPaymentAttempt(payment.id);
            setPayment(result);

            if (result.status === "EXPIRED" || result.status === "FAILED") {
                router.replace({
                    pathname: "/client-setup/payment/payment",
                    params: {
                        onboardingRequestId: String(result.onboardingRequestId),
                    },
                });
            }
        } catch (value) {
            setError(
                paymentErrorMessage(
                    value,
                    "Unable to safely cancel this payment attempt. Please check the payment status and try again.",
                ),
            );
            // Refresh once when possible; a concurrent webhook may already have
            // resolved the payment while the cancel request was in flight.
            void checkPayment(false);
        } finally {
            setCancellingAttempt(false);
        }
    };

    // PhonePe runs in a separate web window. When its redirect reaches this
    // terminal status page, move the verified result into the original Zincy
    // window and close the gateway window. Razorpay card checkout already runs
    // in an in-page modal, so its status page has no opener and is unchanged.
    useEffect(() => {
        if (
            Platform.OS !== "web" ||
            !payment?.terminal ||
            typeof window === "undefined"
        ) {
            return;
        }

        if (window.opener && !window.opener.closed) {
            window.opener.location.assign(window.location.href);
            window.close();
            return;
        }

        // Some mobile/desktop browsers isolate the PhonePe popup and remove
        // window.opener. The named window was still opened by Zincy, so close
        // it after terminal verification; the original payment page's focus
        // listener will refresh the same protected payment record. This also
        // prevents Browser Back from reopening the completed gateway page.
        if (window.name === "zincy_phonepe_checkout") {
            window.close();
        }
    }, [payment?.terminal]);

    if (shouldReturnToApp) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.bridgeTitle}>Returning to Zincy…</Text>
                    <Text style={styles.message}>
                        Continue in the Zincy app to verify your payment securely.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            if (typeof window !== "undefined") {
                                window.location.assign(nativeReturnUrl);
                            }
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Return to Zincy app</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const iconName = positive
        ? "checkmark-circle"
        : warning
            ? "time"
            : customerCancelled
                ? "close-circle"
                : "alert-circle";

    const iconColor = positive
        ? "#16A34A"
        : warning
            ? "#D97706"
            : customerCancelled
                ? "#64748B"
                : "#DC2626";

    const iconBackground = positive
        ? "#DCFCE7"
        : warning
            ? "#FEF3C7"
            : customerCancelled
                ? "#E2E8F0"
                : "#FEE2E2";

    const title = refundCompleted
        ? "Refund completed"
        : refundPending
            ? "Refund processing"
            : refundNeedsAttention
                ? "Refund needs attention"
                : customerCancelled
                    ? "Payment cancelled"
                    : successful
                        ? "Payment successful"
                        : unableToVerify
                            ? "Unable to verify payment status"
                            : pending
                                ? "Payment processing"
                                : "Payment not completed";

    const message = refundCompleted
        ? "The payment gateway confirmed that the full amount was refunded."
        : refundPending
            ? "Your full refund was requested and is being confirmed with the payment gateway."
            : refundNeedsAttention
                ? payment?.refundFailureReason ||
                "The refund requires support review. Do not make another payment."
                : customerCancelled
                    ? "No payment was completed. You can safely choose a payment method and try again."
                    : successful
                        ? "Your payment was verified directly with the payment gateway."
                        : unableToVerify
                            ? "We can't verify your payment status right now. Your payment may still have been successful. Please reconnect to the internet and check the payment status. Do not make another payment until the status is confirmed."
                            : pending
                                ? "The gateway has not confirmed the final status yet. You can check again safely."
                                : payment
                                    ? paymentFailureMessage(payment)
                                    : error ||
                                    "The payment could not be verified.";

    const showNativeVerification =
        (isNativeCardVerification || isNativePhonePeVerification) &&
        !error &&
        (!verificationDelayComplete ||
            loading ||
            (!payment?.terminal &&
                (!nativeGatewayReturned || !verificationPollingComplete)));

    if (showNativeVerification) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.verificationContent}>
                    <View style={styles.verificationSpinnerBox}>
                        <ActivityIndicator size="large" color="#0EA5E9" />
                    </View>
                    <Text style={styles.verificationTitle}>Verifying payment</Text>
                    <Text style={styles.verificationMessage}>
                        {isNativePhonePeVerification
                            ? "Please wait while we securely confirm your UPI payment with PhonePe."
                            : "Please wait while we securely confirm your card payment with Razorpay."}
                    </Text>
                    <Text style={styles.verificationHint}>
                        Do not close the app or make another payment.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loading && !payment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
                    <Ionicons name={iconName} size={64} color={iconColor} />
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                {unableToVerify && paymentRecordId && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Payment reference</Text>
                        <Text selectable style={styles.reference}>
                            Zincy payment #{paymentRecordId}
                        </Text>

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>STATUS</Text>
                            <Text style={[styles.statusValue, { color: iconColor }]}>
                                AWAITING VERIFICATION
                            </Text>
                        </View>
                    </View>
                )}

                {payment && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Amount</Text>
                        <Text style={styles.amount}>
                            {formatAmount(Number(payment.amount), payment.currency)}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.label}>Payment method</Text>
                        <Text style={styles.reference}>
                            {payment.paymentMethod === "CARD"
                                ? "Credit / Debit Card · Razorpay"
                                : "PhonePe · UPI"}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.label}>Payment reference</Text>
                        <Text selectable style={styles.reference}>
                            {payment.providerPaymentId ||
                                payment.providerOrderId ||
                                payment.merchantOrderId}
                        </Text>

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>STATUS</Text>
                            <Text style={[styles.statusValue, { color: iconColor }]}>
                                {(payment.refundStatus
                                    ? `REFUND ${payment.refundStatus}`
                                    : customerCancelled
                                        ? "CANCELLED"
                                        : payment.status
                                ).replace(/_/g, " ")}
                            </Text>
                        </View>
                    </View>
                )}

                {(pending || refundPending || Boolean(error)) && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => void checkPayment(false)}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0284C7" />
                        ) : (
                            <Text style={styles.secondaryButtonText}>
                                Check payment status
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {showCancelRetry && (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.cancelRetryButton,
                                !cancelRetryEnabled && styles.disabledButton,
                            ]}
                            onPress={() => void cancelAndChooseAnother()}
                            disabled={!cancelRetryEnabled}
                            activeOpacity={0.85}
                        >
                            {cancellingAttempt ? (
                                <ActivityIndicator color="#475569" />
                            ) : (
                                <Text
                                    style={[
                                        styles.cancelRetryButtonText,
                                        !cancelRetryEnabled && styles.disabledButtonText,
                                    ]}
                                >
                                    {cancelRetryLabel}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.cancelRetryHelp}>
                            To prevent a duplicate charge, another payment is temporarily
                            locked while Razorpay may still confirm this attempt. Before
                            releasing it, we check Razorpay again.
                        </Text>
                    </>
                )}

                {canTryAnotherPayment && payment && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            router.replace({
                                pathname: "/client-setup/payment/payment",
                                params: {
                                    onboardingRequestId: String(payment.onboardingRequestId),
                                },
                            })
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Try another payment</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, canTryAnotherPayment && styles.homeButton]}
                    onPress={() => router.replace("/(website)")}
                    activeOpacity={0.85}
                >
                    <Text style={styles.buttonText}>Go to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    content: {
        flex: 1,
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    verificationContent: {
        flex: 1,
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
        paddingHorizontal: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    verificationSpinnerBox: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E0F2FE",
    },
    verificationTitle: {
        marginTop: 28,
        fontSize: 26,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
    },
    verificationMessage: {
        marginTop: 12,
        maxWidth: 360,
        fontSize: 15,
        lineHeight: 23,
        fontWeight: "600",
        color: "#475569",
        textAlign: "center",
    },
    verificationHint: {
        marginTop: 18,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "700",
        color: "#94A3B8",
        textAlign: "center",
    },
    iconBox: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        marginTop: 20,
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
    },
    bridgeTitle: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: "900",
        color: "#0F172A",
    },
    message: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
        color: "#64748B",
        fontWeight: "600",
    },
    card: {
        width: "100%",
        marginTop: 24,
        padding: 18,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    label: {
        fontSize: 11,
        fontWeight: "800",
        color: "#64748B",
        textTransform: "uppercase",
    },
    amount: {
        marginTop: 5,
        fontSize: 25,
        fontWeight: "900",
        color: "#0F172A",
    },
    divider: {
        height: 1,
        marginVertical: 14,
        backgroundColor: "#E2E8F0",
    },
    reference: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: "800",
        color: "#334155",
    },
    statusRow: {
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: "900",
        color: "#64748B",
    },
    statusValue: {
        fontSize: 11,
        fontWeight: "900",
    },
    button: {
        width: "100%",
        minHeight: 52,
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: "#0EA5E9",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
    },
    homeButton: {
        backgroundColor: "#475569",
    },
    cancelRetryButton: {
        width: "100%",
        minHeight: 50,
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#64748B",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    cancelRetryButtonText: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "900",
        textAlign: "center",
    },
    disabledButton: {
        backgroundColor: "#F1F5F9",
        borderColor: "#CBD5E1",
    },
    disabledButtonText: {
        color: "#94A3B8",
    },
    cancelRetryHelp: {
        marginTop: 8,
        paddingHorizontal: 8,
        color: "#64748B",
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
    },
    secondaryButton: {
        width: "100%",
        minHeight: 50,
        marginTop: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#38BDF8",
        backgroundColor: "#F0F9FF",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        color: "#0284C7",
        fontSize: 14,
        fontWeight: "900",
    },
});
