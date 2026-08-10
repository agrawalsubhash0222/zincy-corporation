import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
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

    const goToStatus = (paymentRecordId: number) => {
        router.replace({
            pathname: '/client-setup/payment/payment-success',
            params: { paymentRecordId: String(paymentRecordId) },
        });
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
            retry: { enabled: true, max_count: 2 },
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

            if (selectedMethod === 'PHONEPE') {
                if (!order.checkoutUrl) {
                    throw new Error('PhonePe checkout URL is unavailable.');
                }

                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.assign(order.checkoutUrl);
                    return;
                }

                await WebBrowser.openBrowserAsync(order.checkoutUrl);
                goToStatus(order.paymentRecordId);
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

                throw new Error(
                    'Card checkout was closed before payment confirmation.'
                );
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

                <Text style={styles.sectionLabel}>PAY USING</Text>

                {OPTIONS.map((option) => {
                    const selected = option.value === selectedMethod;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            disabled={option.disabled || processing}
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

                <View style={styles.note}>
                    <Ionicons
                        name="information-circle-outline"
                        size={19}
                        color="#B45309"
                    />
                    <Text style={styles.noteText}>
                        PhonePe opens its UPI checkout. Card Payment opens
                        Razorpay with only credit and debit card options.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    <TouchableOpacity
                        disabled={processing || !onboardingRequestId}
                        activeOpacity={0.85}
                        onPress={startPayment}
                        style={[
                            styles.payButton,
                            (processing || !onboardingRequestId) &&
                                styles.payButtonDisabled,
                        ]}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.payButtonText}>
                                    Continue Securely
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
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
    note: {
        marginTop: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noteText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 11,
        lineHeight: 17,
        fontWeight: '700',
        color: '#92400E',
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
