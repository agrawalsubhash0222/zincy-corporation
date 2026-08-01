import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useOtpVerify } from '@/hooks/auth/useOtpVerify';
import { styles } from '@/styles/auth/otp.styles';

export default function OtpForm() {
    const { redirectTo } = useLocalSearchParams<{
        redirectTo?: string | string[];
    }>();

    const {
        mobile,
        otp,
        errorMsg,
        loading,
        setOtpNumber,
        handleOtpVerify,
    } = useOtpVerify(redirectTo);

    return (
        <View style={styles.formCard}>
            <Text style={styles.title}>Verify OTP</Text>

            <Text style={styles.subText}>We have sent a 6 digit OTP to</Text>

            <Text style={styles.mobileText}>+91 {mobile}</Text>

            <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#149BD7" />

                <TextInput
                    placeholder="Enter OTP"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtpNumber}
                    style={styles.input}
                />
            </View>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.btn, loading && styles.disabled]}
                onPress={handleOtpVerify}
                disabled={loading}
            >
                <Text style={styles.btnText}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
                <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}