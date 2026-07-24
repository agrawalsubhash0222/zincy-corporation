import { useLogin } from '@/hooks/auth/useLogin';
import { styles } from '@/styles/auth/login.styles';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginForm() {
    const { redirectTo } = useLocalSearchParams<{
        redirectTo?: string | string[];
    }>();

    const {
        mobile,
        errorMsg,
        loading,
        checkingSession,
        setMobileNumber,
        handleOtpSend,
    } = useLogin(redirectTo);

    if (checkingSession) {
        return (
            <View style={styles.formCard}>
                <Text style={styles.title}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.formCard}>
            <View style={styles.iconCircle}>
                <Ionicons
                    name="shield-checkmark"
                    size={30}
                    color="#16A34A"
                />
            </View>

            <Text style={styles.title}>Welcome, Please Login</Text>

            <Text style={styles.subtitle}>
                Enter your mobile number to continue.
            </Text>

            <View style={styles.inputBox}>
                <Ionicons
                    name="call-outline"
                    size={20}
                    color="#64748B"
                />

                <TextInput
                    placeholder="Enter mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobileNumber}
                    style={styles.input}
                />
            </View>

            {errorMsg ? (
                <Text style={styles.error}>{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleOtpSend}
                disabled={loading}
            >
                <Text style={styles.btnText}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                </Text>

                <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                />
            </TouchableOpacity>
        </View>
    );
}