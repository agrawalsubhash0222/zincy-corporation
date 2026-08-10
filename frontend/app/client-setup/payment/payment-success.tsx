import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getPaymentStatus,
    paymentErrorMessage,
    PaymentResponse,
} from '@/services/paymentService';

const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 2000;

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function PaymentSuccessScreen() {
    const params = useLocalSearchParams<{
        paymentRecordId?: string | string[];
    }>();

    const paymentRecordId = useMemo(() => {
        const value = Number(first(params.paymentRecordId));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [params.paymentRecordId]);

    const [payment, setPayment] = useState<PaymentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const checkPayment = useCallback(async (poll: boolean) => {
        if (!paymentRecordId) {
            setError('Invalid payment reference.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            for (let attempt = 0; attempt < (poll ? POLL_ATTEMPTS : 1); attempt += 1) {
                const result = await getPaymentStatus(paymentRecordId, true);
                setPayment(result);

                if (result.terminal || !poll) {
                    break;
                }

                await wait(POLL_DELAY_MS);
            }
        } catch (value) {
            setError(
                paymentErrorMessage(
                    value,
                    'Unable to verify payment status.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, [paymentRecordId]);

    useEffect(() => {
        let active = true;

        void (async () => {
            if (active) {
                await checkPayment(true);
            }
        })();

        return () => {
            active = false;
        };
    }, [checkPayment]);

    const successful = payment?.successful === true;
    const pending = payment != null && !payment.terminal;
    const iconName = successful
        ? 'checkmark-circle'
        : pending
            ? 'time'
            : 'alert-circle';
    const iconColor = successful ? '#16A34A' : pending ? '#D97706' : '#DC2626';
    const iconBackground = successful
        ? '#DCFCE7'
        : pending
            ? '#FEF3C7'
            : '#FEE2E2';
    const title = successful
        ? 'Payment successful'
        : pending
            ? 'Payment processing'
            : 'Payment not completed';
    const message = successful
        ? 'Your payment was verified directly with the payment gateway.'
        : pending
            ? 'The gateway has not confirmed the final status yet. You can check again safely.'
            : payment?.failureReason || error || 'The payment could not be verified.';

    if (loading && !payment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                    <Text style={styles.loadingTitle}>Verifying payment</Text>
                    <Text style={styles.message}>
                        Please wait while Zincy checks the gateway status.
                    </Text>
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

                {payment && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Amount</Text>
                        <Text style={styles.amount}>
                            {formatAmount(Number(payment.amount), payment.currency)}
                        </Text>

                        <View style={styles.divider} />
                        <Text style={styles.label}>Payment method</Text>
                        <Text style={styles.reference}>
                            {payment.paymentMethod === 'CARD'
                                ? 'Credit / Debit Card · Razorpay'
                                : 'PhonePe · UPI'}
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
                                {payment.status.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>
                )}

                {(pending || Boolean(error)) && (
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

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/(website)')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.buttonText}>Go to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBox: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingTitle: {
        marginTop: 20,
        fontSize: 21,
        fontWeight: '900',
        color: '#0F172A',
    },
    title: {
        marginTop: 20,
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
    },
    message: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        color: '#64748B',
        fontWeight: '600',
    },
    card: {
        width: '100%',
        marginTop: 24,
        padding: 18,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    amount: {
        marginTop: 5,
        fontSize: 25,
        fontWeight: '900',
        color: '#0F172A',
    },
    divider: {
        height: 1,
        marginVertical: 14,
        backgroundColor: '#E2E8F0',
    },
    reference: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },
    statusRow: {
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusLabel: { fontSize: 11, fontWeight: '900', color: '#64748B' },
    statusValue: { fontSize: 11, fontWeight: '900' },
    button: {
        width: '100%',
        minHeight: 52,
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
    secondaryButton: {
        width: '100%',
        minHeight: 50,
        marginTop: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: { color: '#0284C7', fontSize: 14, fontWeight: '900' },
});
