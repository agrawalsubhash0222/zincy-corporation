import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
    const params = useLocalSearchParams<{
        paymentId?: string;
        amount?: string;
    }>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconBox}>
                    <Ionicons
                        name="checkmark-circle"
                        size={64}
                        color="#16A34A"
                    />
                </View>

                <Text style={styles.title}>Payment successful</Text>
                <Text style={styles.message}>
                    Your payment has been verified and recorded successfully.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Amount paid</Text>
                    <Text style={styles.amount}>
                        ₹{Number(params.amount || 0).toLocaleString('en-IN')}/-
                    </Text>

                    {!!params.paymentId && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.label}>Payment reference</Text>
                            <Text style={styles.reference}>
                                {params.paymentId}
                            </Text>
                        </>
                    )}
                </View>

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
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBox: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
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
    button: {
        width: '100%',
        minHeight: 52,
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
