import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    abandonPaymentAttempt,
    createPaymentOrder,
    getPaymentStatus,
    paymentErrorMessage,
    verifyRazorpayPayment,
} from '@/services/paymentService';
import {
    openRazorpayCardCheckout,
    RazorpaySuccess,
} from '@/utils/razorpayWeb';

const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === 'web';
const webConstrained = isWeb
    ? {
        width: '100%' as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: 'center' as const,
    }
    : {};

type ActivePaymentMethod = 'PHONEPE' | 'CARD';
type PaymentChoice = ActivePaymentMethod | 'GOOGLE_PAY';
type ActiveAttempt = {
    paymentRecordId: number;
    method: ActivePaymentMethod;
    checkoutUrl?: string;
};

const OPTIONS: Array<{
    value: PaymentChoice;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
}> = [
    {
        value: 'PHONEPE',
        title: 'PhonePe',
        subtitle: 'PhonePe Standard Checkout · UPI only',
        icon: 'phone-portrait-outline',
    },
    {
        value: 'CARD',
        title: 'Credit / Debit Card',
        subtitle: 'Secure card checkout powered by Razorpay',
        icon: 'card-outline',
    },
    {
        value: 'GOOGLE_PAY',
        title: 'Google Pay',
        subtitle: 'Coming soon',
        icon: 'logo-google',
        disabled: true,
    },
];

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function createIdempotencyKey(): string {
    const cryptoValue = globalThis.crypto as
        | { randomUUID?: () => string }
        | undefined;
    const random = cryptoValue?.randomUUID
        ? cryptoValue.randomUUID().replace(/-/g, '')
        : `${Date.now()}${Math.random().toString(36).slice(2)}`;

    return `pay_${random}`.slice(0, 64);
}

function wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default function PaymentScreen() {
    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
    }>();

    const onboardingRequestId = useMemo(() => {
        const value = Number(first(params.onboardingRequestId));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [params.onboardingRequestId]);

    const idempotencyKeys = useRef<Partial<Record<ActivePaymentMethod, string>>>({});
    const [selectedMethod, setSelectedMethod] =
        useState<ActivePaymentMethod>('PHONEPE');
    const [processing, setProcessing] = useState(false);
    const [restoringAttempt, setRestoringAttempt] = useState(false);
    const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
    const [showChangeMethodConfirm, setShowChangeMethodConfirm] =
        useState(false);

    const storageKey = onboardingRequestId
        ? `zincy_active_payment_${onboardingRequestId}`
        : null;

    const rememberAttempt = (attempt: ActiveAttempt | null) => {
        setActiveAttempt(attempt);
        if (!isWeb || !storageKey || typeof window === 'undefined') return;
        if (attempt) {
            window.sessionStorage.setItem(storageKey, JSON.stringify(attempt));
        } else {
            window.sessionStorage.removeItem(storageKey);
        }
    };

    useEffect(() => {
        if (!isWeb || !storageKey || typeof window === 'undefined') return;

        let cancelled = false;
        let requestInFlight = false;

        const reconcileStoredAttempt = async () => {
            if (requestInFlight) return;

            const stored = window.sessionStorage.getItem(storageKey);
            if (!stored) {
                if (!cancelled) {
                    setActiveAttempt(null);
                    setRestoringAttempt(false);
                }
                return;
            }

            let attempt: ActiveAttempt;
            try {
                attempt = JSON.parse(stored) as ActiveAttempt;
                if (
                    !Number.isInteger(attempt.paymentRecordId) ||
                    attempt.paymentRecordId <= 0 ||
                    (attempt.method !== 'PHONEPE' &&
                        attempt.method !== 'CARD')
                ) {
                    throw new Error('Invalid stored payment attempt');
                }
            } catch {
                window.sessionStorage.removeItem(storageKey);
                if (!cancelled) {
                    setActiveAttempt(null);
                    setRestoringAttempt(false);
                }
                return;
            }

            requestInFlight = true;
            if (!cancelled) setRestoringAttempt(true);

            try {
                const status = await getPaymentStatus(
                    attempt.paymentRecordId,
                    true
                );
                if (cancelled) return;

                if (status.terminal) {
                    window.sessionStorage.removeItem(storageKey);
                    setActiveAttempt(null);
                    idempotencyKeys.current = {};
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

        // Back/forward cache can restore this screen without remounting React.
        const handlePageShow = () => void reconcileStoredAttempt();
        const handleFocus = () => void reconcileStoredAttempt();
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('focus', handleFocus);

        return () => {
            cancelled = true;
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('focus', handleFocus);
        };
    }, [storageKey]);

    const goToStatus = (paymentRecordId: number) => {
        rememberAttempt(null);
        router.replace({
            pathname: '/client-setup/payment/payment-success',
            params: { paymentRecordId: String(paymentRecordId) },
        });
    };

    const cancelActiveAttempt = async () => {
        if (!activeAttempt || processing) return;
        try {
            setProcessing(true);
            const result = await abandonPaymentAttempt(
                activeAttempt.paymentRecordId
            );
            if (result.successful || result.status === 'REVIEW_REQUIRED') {
                goToStatus(result.id);
                return;
            }
            rememberAttempt(null);
            idempotencyKeys.current = {};
            setShowChangeMethodConfirm(false);
        } catch (error) {
            Alert.alert(
                'Unable to switch safely',
                paymentErrorMessage(
                    error,
                    'The gateway status could not be checked. Please try again.'
                )
            );
        } finally {
            setProcessing(false);
        }
    };

    const resumeActiveAttempt = async () => {
        if (!activeAttempt || processing) return;

        try {
            setProcessing(true);
            const status = await getPaymentStatus(
                activeAttempt.paymentRecordId,
                true
            );
            if (status.terminal) {
                goToStatus(status.id);
                return;
            }

            if (
                activeAttempt.method === 'PHONEPE' &&
                activeAttempt.checkoutUrl
            ) {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.assign(activeAttempt.checkoutUrl);
                    return;
                }
                await WebBrowser.openBrowserAsync(activeAttempt.checkoutUrl);
                const refreshed = await getPaymentStatus(
                    activeAttempt.paymentRecordId,
                    true
                );
                if (refreshed.terminal) goToStatus(refreshed.id);
                return;
            }

            Alert.alert(
                'Payment still in progress',
                'The gateway has not confirmed a final status yet. You can check again or safely change the payment method.'
            );
        } catch (error) {
            Alert.alert(
                'Unable to check payment',
                paymentErrorMessage(
                    error,
                    'The payment status could not be checked. Please try again.'
                )
            );
        } finally {
            setProcessing(false);
        }
    };

    const openCardCheckout = async (
        order: Awaited<ReturnType<typeof createPaymentOrder>>
    ): Promise<RazorpaySuccess | null> => {
        if (!order.publicKey || !order.providerOrderId) {
            throw new Error('Card checkout information is incomplete.');
        }

        if (Platform.OS === 'web') {
            return openRazorpayCardCheckout({
                key: order.publicKey,
                orderId: order.providerOrderId,
                amountPaise: order.amountPaise,
                currency: order.currency,
                businessName: order.businessName,
                description: order.description,
            });
        }

        const module = await import('react-native-razorpay');
        return module.default.open({
            key: order.publicKey,
            order_id: order.providerOrderId,
            amount: order.amountPaise,
            currency: order.currency,
            name: order.businessName,
            description: order.description,
            theme: { color: '#0EA5E9' },
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
        }) as Promise<RazorpaySuccess>;
    };

    const startPayment = async () => {
        if (!onboardingRequestId || processing) {
            return;
        }

        let activeOrder: Awaited<ReturnType<typeof createPaymentOrder>> | null =
            null;
        try {
            setProcessing(true);
            const idempotencyKey =
                idempotencyKeys.current[selectedMethod] ||
                createIdempotencyKey();
            idempotencyKeys.current[selectedMethod] = idempotencyKey;

            const order = await createPaymentOrder(
                onboardingRequestId,
                selectedMethod,
                idempotencyKey
            );
            activeOrder = order;
            rememberAttempt({
                paymentRecordId: order.paymentRecordId,
                method: selectedMethod,
                checkoutUrl:
                    selectedMethod === 'PHONEPE'
                        ? order.checkoutUrl
                        : undefined,
            });

            if (selectedMethod === 'PHONEPE') {
                if (!order.checkoutUrl) {
                    throw new Error('PhonePe checkout URL is unavailable.');
                }

                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.assign(order.checkoutUrl);
                    return;
                }

                await WebBrowser.openBrowserAsync(order.checkoutUrl);
                const status = await getPaymentStatus(
                    order.paymentRecordId,
                    true
                );
                if (status.terminal) {
                    goToStatus(status.id);
                } else {
                    Alert.alert(
                        'Payment still pending',
                        'Complete the PhonePe payment, or cancel this attempt to choose another method.'
                    );
                }
                return;
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
                        true
                    );

                    if (reconciled.providerPaymentId) {
                        goToStatus(reconciled.id);
                        return;
                    }

                    if (attempt < 3) {
                        await wait(750);
                    }
                }

                const abandoned = await abandonPaymentAttempt(
                    order.paymentRecordId
                );
                if (abandoned.successful
                        || abandoned.status === 'REVIEW_REQUIRED') {
                    goToStatus(abandoned.id);
                    return;
                }
                rememberAttempt(null);
                throw new Error('Card checkout was cancelled.');
            }

            const verified = await verifyRazorpayPayment({
                paymentRecordId: order.paymentRecordId,
                razorpayOrderId: result.razorpay_order_id,
                razorpayPaymentId: result.razorpay_payment_id,
                razorpaySignature: result.razorpay_signature,
            });

            goToStatus(verified.id);
        } catch (error) {
            delete idempotencyKeys.current[selectedMethod];

            // Razorpay's payment.failed event is raised before our webhook may
            // arrive. Refresh immediately so the backend verifies the failed
            // attempt with Razorpay, marks it FAILED and releases the unique
            // active-payment lock. A refresh error must not hide the original
            // checkout error from the customer.
            if (selectedMethod === 'CARD' && activeOrder) {
                try {
                    const reconciled = await getPaymentStatus(
                        activeOrder.paymentRecordId,
                        true
                    );
                    if (reconciled.terminal) {
                        goToStatus(reconciled.id);
                        return;
                    }
                } catch {
                    // Webhook/scheduled reconciliation remains the fallback.
                }
            }

            Alert.alert(
                'Payment not completed',
                paymentErrorMessage(error, 'Payment was not completed.')
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.iconButton}
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
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={22}
                        color="#0284C7"
                    />
                    <Text style={styles.secureText}>
                        Payment details are entered only on the selected
                        gateway. Zincy never stores card numbers, CVV, OTP, or
                        UPI PIN.
                    </Text>
                </View>

                {activeAttempt && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressIcon}>
                            <Ionicons
                                name="time-outline"
                                size={22}
                                color="#0369A1"
                            />
                        </View>
                        <View style={styles.progressContent}>
                            <Text style={styles.progressTitle}>
                                {activeAttempt.method === 'PHONEPE'
                                    ? 'PhonePe payment in progress'
                                    : 'Card payment in progress'}
                            </Text>
                            <Text style={styles.progressText}>
                                Complete the current payment, or safely switch
                                to another method.
                            </Text>
                            <TouchableOpacity
                                disabled={processing}
                                onPress={() =>
                                    setShowChangeMethodConfirm(true)
                                }
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
                                setSelectedMethod(
                                    option.value as ActivePaymentMethod
                                )
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
                                    color={selected ? '#0284C7' : '#475569'}
                                />
                            </View>

                            <View style={styles.optionText}>
                                <View style={styles.optionTitleRow}>
                                    <Text style={styles.optionTitle}>
                                        {option.title}
                                    </Text>
                                    {option.disabled && (
                                        <Text style={styles.comingSoonBadge}>
                                            COMING SOON
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.optionSubtitle}>
                                    {option.subtitle}
                                </Text>
                            </View>

                            {!option.disabled && (
                                <Ionicons
                                    name={
                                        selected
                                            ? 'radio-button-on'
                                            : 'radio-button-off'
                                    }
                                    size={22}
                                    color={selected ? '#0EA5E9' : '#94A3B8'}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    <TouchableOpacity
                        disabled={
                            processing ||
                            restoringAttempt ||
                            !onboardingRequestId
                        }
                        activeOpacity={0.85}
                        onPress={
                            activeAttempt ? resumeActiveAttempt : startPayment
                        }
                        style={[
                            styles.payButton,
                            (processing ||
                                restoringAttempt ||
                                !onboardingRequestId) &&
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
                                        ? activeAttempt.method === 'PHONEPE' &&
                                          activeAttempt.checkoutUrl
                                            ? 'Resume PhonePe'
                                            : 'Check Payment Status'
                                        : 'Continue Securely'}
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
                        <Text style={styles.modalTitle}>
                            Change payment method?
                        </Text>
                        <Text style={styles.modalText}>
                            We’ll safely close the current gateway attempt
                            before starting another payment.
                        </Text>

                        <TouchableOpacity
                            disabled={processing}
                            onPress={cancelActiveAttempt}
                            style={styles.modalPrimaryButton}
                        >
                            {processing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.modalPrimaryText}>
                                    Change method
                                </Text>
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },
    headerInner: {
        minHeight: 72,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...webConstrained,
    },
    iconButton: {
        width: 40,
        height: 40,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: { fontSize: 20, lineHeight: 24, fontWeight: '900', color: '#0F172A' },
    subtitle: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    content: { padding: 18, paddingBottom: 120, ...webConstrained },
    secureBox: {
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#E0F2FE',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    secureText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        color: '#075985',
    },
    sectionLabel: {
        marginTop: 24,
        marginBottom: 10,
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.8,
        fontWeight: '900',
        color: '#64748B',
    },
    option: {
        minHeight: 74,
        marginBottom: 11,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionSelected: { borderColor: '#38BDF8', backgroundColor: '#F0F9FF' },
    optionDisabled: { opacity: 0.58, backgroundColor: '#F8FAFC' },
    optionLocked: { opacity: 0.48 },
    optionIcon: {
        width: 42,
        height: 42,
        marginRight: 12,
        borderRadius: 13,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconSelected: { backgroundColor: '#E0F2FE' },
    optionText: { flex: 1 },
    optionTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    optionTitle: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    comingSoonBadge: {
        marginLeft: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
        color: '#475569',
        fontSize: 8,
        lineHeight: 10,
        fontWeight: '900',
    },
    optionSubtitle: {
        marginTop: 3,
        fontSize: 11.5,
        lineHeight: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    progressCard: {
        marginTop: 16,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        backgroundColor: '#F0F9FF',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    progressIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContent: { flex: 1, marginLeft: 12 },
    progressTitle: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
        color: '#0F172A',
    },
    progressText: {
        marginTop: 3,
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: '600',
        color: '#475569',
    },
    changeMethodText: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '900',
        color: '#0369A1',
    },
    modalBackdrop: {
        flex: 1,
        padding: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.56)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        padding: 22,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    modalIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        marginTop: 16,
        fontSize: 19,
        lineHeight: 24,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
    },
    modalText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
    },
    modalPrimaryButton: {
        width: '100%',
        minHeight: 50,
        marginTop: 22,
        borderRadius: 15,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalPrimaryText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    modalSecondaryButton: {
        minHeight: 44,
        marginTop: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSecondaryText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
        color: '#475569',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        width: '100%',
    },
    footerInner: { padding: 18, ...webConstrained },
    payButton: {
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonDisabled: { opacity: 0.55 },
    payButtonText: {
        marginLeft: 9,
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
