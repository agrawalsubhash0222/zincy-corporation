import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/services/api';

// Keeps the layout from stretching edge-to-edge on wide
// browser windows. Mobile/native is untouched.
const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === 'web';
const webConstrained = isWeb
    ? {
        width: '100%' as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: 'center' as const,
    }
    : {};

type PaymentMethod = 'PHONEPE' | 'GOOGLE_PAY' | 'NET_BANKING';

type CreateOrderResponse = {
    paymentRecordId: number;
    keyId: string;
    orderId: string;
    amountPaise: number;
    amount: number;
    currency: string;
    businessName: string;
    description: string;
};

type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
};

type ApiError = {
    message?: string;
    error?: string;
};

const OPTIONS: Array<{
    value: PaymentMethod;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
}> = [
    {
        value: 'PHONEPE',
        title: 'PhonePe',
        subtitle: 'Pay securely using UPI',
        icon: 'phone-portrait-outline',
    },
    {
        value: 'GOOGLE_PAY',
        title: 'Google Pay',
        subtitle: 'Pay securely using UPI',
        icon: 'logo-google',
    },
    {
        value: 'NET_BANKING',
        title: 'Net Banking',
        subtitle: 'Choose your bank at checkout',
        icon: 'business-outline',
    },
];

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

async function parse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const error = body as ApiError | null;
        throw new Error(
            error?.message || error?.error || 'Payment request failed.'
        );
    }

    return body as T;
}

export default function PaymentScreen() {
    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
    }>();

    const onboardingRequestId = useMemo(() => {
        const value = Number(first(params.onboardingRequestId));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [params.onboardingRequestId]);

    const [selectedMethod, setSelectedMethod] =
        useState<PaymentMethod>('PHONEPE');
    const [processing, setProcessing] = useState(false);

    const startPayment = async () => {
        if (!onboardingRequestId || processing) {
            return;
        }

        try {
            setProcessing(true);

            const orderResponse = await fetch(
                `${API_BASE_URL}/payments/orders`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        onboardingRequestId,
                        preferredMethod: selectedMethod,
                    }),
                }
            );

            const order = await parse<CreateOrderResponse>(orderResponse);

            const result = (await RazorpayCheckout.open({
                key: order.keyId,
                amount: order.amountPaise,
                currency: order.currency,
                name: order.businessName,
                description: order.description,
                order_id: order.orderId,
                theme: { color: '#0EA5E9' },
                retry: { enabled: true, max_count: 2 },
                method: {
                    upi: selectedMethod !== 'NET_BANKING',
                    netbanking: selectedMethod === 'NET_BANKING',
                    card: false,
                    wallet: false,
                    emi: false,
                    paylater: false,
                },
            })) as RazorpaySuccess;

            const verifyResponse = await fetch(
                `${API_BASE_URL}/payments/verify`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentRecordId: order.paymentRecordId,
                        razorpayOrderId: result.razorpay_order_id,
                        razorpayPaymentId: result.razorpay_payment_id,
                        razorpaySignature: result.razorpay_signature,
                    }),
                }
            );

            await parse(verifyResponse);

            router.replace({
                pathname: '/client-setup/payment/payment-success',
                params: {
                    onboardingRequestId: String(onboardingRequestId),
                    paymentId: result.razorpay_payment_id,
                    amount: String(order.amount),
                },
            });
        } catch (error: any) {
            const message =
                error?.description ||
                error?.message ||
                'Payment was not completed.';

            Alert.alert('Payment not completed', message);
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
                            Secure payment powered by Razorpay
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
                        Payment details are handled securely by the payment
                        gateway. We do not store UPI PINs or bank credentials.
                    </Text>
                </View>

                <Text style={styles.sectionLabel}>PAY USING</Text>

                {OPTIONS.map((option) => {
                    const selected = option.value === selectedMethod;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            activeOpacity={0.8}
                            onPress={() => setSelectedMethod(option.value)}
                            style={[
                                styles.option,
                                selected && styles.optionSelected,
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
                                <Text style={styles.optionTitle}>
                                    {option.title}
                                </Text>
                                <Text style={styles.optionSubtitle}>
                                    {option.subtitle}
                                </Text>
                            </View>

                            <Ionicons
                                name={
                                    selected
                                        ? 'radio-button-on'
                                        : 'radio-button-off'
                                }
                                size={22}
                                color={selected ? '#0EA5E9' : '#94A3B8'}
                            />
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
                        For PhonePe or Google Pay, the selected UPI app must be
                        installed and available on the device.
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
                            processing && styles.payButtonDisabled,
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
    content: {
        padding: 18,
        paddingBottom: 120,
        ...webConstrained,
    },
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
    optionSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
    },
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
    optionTitle: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
        color: '#0F172A',
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
    footerInner: {
        padding: 18,
        ...webConstrained,
    },
    payButton: {
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonDisabled: { opacity: 0.65 },
    payButtonText: {
        marginLeft: 9,
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});